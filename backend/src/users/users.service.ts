import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { BulkUploadUsersDto } from "./dto/bulk-upload-users.dto";
import { ConfirmBulkUsersDto } from "./dto/confirm-bulk-users.dto";
import { BulkUpdateRoleDto } from "./dto/bulk-update-role.dto";
import * as bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';

type BulkExcelField = 'names' | 'last_name' | 'num_id' | 'email' | 'charge';

interface BulkRawRow {
    rowNumber: number;
    names: string;
    last_name: string;
    num_id: string;
    email: string;
    charge: string;
}

export interface BulkPreviewRow {
    row: number;
    names: string;
    last_name: string;
    num_id: string;
    email: string;
    charge?: string;
    username: string;
    password: string;
    status: 'ok' | 'error';
    errors: string[];
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private readonly userInclude = {
        areas: {
            include: {
                subdirecciones: true
            }
        },
        subdirecciones: true,
        user_types: {
            include: {
                permissions: {
                    include: {
                        modules: true
                    }
                }
            }
        }
    };

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.prisma.users.findFirst({
            where: {
                OR: [
                    { username: createUserDto.username },
                    { email: createUserDto.email },
                    { num_id: createUserDto.num_id }
                ]
            }
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const normalizedSubdireccionId = createUserDto.subdireccion_id === '' ? undefined : createUserDto.subdireccion_id;
        const normalizedAreaId = createUserDto.area_id === '' ? undefined : createUserDto.area_id;

        const userType = await this.prisma.user_types.findUnique({
            where: { id: createUserDto.user_type_id }
        });

        if (!userType) {
            throw new BadRequestException('Tipo de usuario no encontrado');
        }

        if (!normalizedSubdireccionId) {
            throw new BadRequestException('Debe seleccionar una subdirección');
        }

        if (userType.name !== 'admin_subdireccion' && !normalizedAreaId) {
            throw new BadRequestException('Debe seleccionar un área');
        }

        const area = normalizedAreaId
            ? await this.prisma.areas.findUnique({
                where: { id: normalizedAreaId },
                select: { subdireccion_id: true }
            })
            : null;

        if (normalizedAreaId && !area) {
            throw new BadRequestException('Área no encontrada');
        }

        if (area && area.subdireccion_id !== normalizedSubdireccionId) {
            throw new BadRequestException('El área no pertenece a la subdirección seleccionada');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await this.prisma.users.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
                area_id: userType.name === 'admin_subdireccion' ? null : normalizedAreaId,
                subdireccion_id: normalizedSubdireccionId,
            },
        });

        const { password, ...result } = user;

        return result;
    }

    async findUserTypes() {
        return await this.prisma.user_types.findMany();
    }

    async findAll() {
        const users = await this.prisma.users.findMany({
            include: this.userInclude,
        });

        return users.map(user => {
            const { password, ...result } = user;
            return result;
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.users.findUnique({
            where: {
                id
            },
            include: this.userInclude,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...result } = user;

        return result;
    }

    async findByUsername(username: string) {
        return await this.prisma.users.findUnique({
            where: {
                username
            },
            include: this.userInclude,
        });
    }

    async findByEmail(email: string) {
        return await this.prisma.users.findUnique({
            where: {
                email
            },
            include: this.userInclude,
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const existing = await this.findOne(id);

        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        const normalizedUpdateSubId = updateUserDto.subdireccion_id === '' ? null : updateUserDto.subdireccion_id;
        const normalizedUpdateAreaId = updateUserDto.area_id === '' ? null : updateUserDto.area_id;

        const targetUserTypeId = updateUserDto.user_type_id || existing.user_type_id;
        const userType = await this.prisma.user_types.findUnique({
            where: { id: targetUserTypeId }
        });

        if (!userType) {
            throw new BadRequestException('Tipo de usuario no encontrado');
        }

        const targetSubdireccionId = normalizedUpdateSubId !== undefined ? normalizedUpdateSubId : existing.subdireccion_id;
        const targetAreaId = normalizedUpdateAreaId !== undefined ? normalizedUpdateAreaId : existing.area_id;

        if (!targetSubdireccionId) {
            throw new BadRequestException('Debe seleccionar una subdirección');
        }

        if (userType.name !== 'admin_subdireccion' && !targetAreaId) {
            throw new BadRequestException('Debe seleccionar un área');
        }

        const area = targetAreaId
            ? await this.prisma.areas.findUnique({
                where: { id: targetAreaId },
                select: { subdireccion_id: true }
            })
            : null;

        if (targetAreaId && !area) {
            throw new BadRequestException('Área no encontrada');
        }

        if (area && area.subdireccion_id !== targetSubdireccionId) {
            throw new BadRequestException('El área no pertenece a la subdirección seleccionada');
        }

        const user = await this.prisma.users.update({
            where: {
                id
            },
            data: {
                ...updateUserDto,
                area_id: userType.name === 'admin_subdireccion' ? null : targetAreaId,
                subdireccion_id: targetSubdireccionId,
            },
        });

        const { password, ...result } = user;

        return result;
    }

    async remove(id: string) {
        await this.findOne(id);

        try {
            return await this.prisma.users.delete({
                where: {
                    id
                },
            });
        } catch (error) {
            const pgCode =
                (error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined) ??
                (error as { cause?: { code?: string } })?.cause?.code;

            if (pgCode === 'P2003' || pgCode === '23503' || pgCode === '23001') {
                throw new ConflictException(
                    'Este usuario tiene programaciones, articulaciones, IVC, uniones o asesorías asociadas y no se puede eliminar. Desactívalo en su lugar.',
                );
            }
            throw error;
        }
    }

    async deactivate(id: string) {
        await this.findOne(id);

        return await this.prisma.users.update({
            where: { id },
            data: { is_active: false },
        });
    }

    async activate(id: string) {
        await this.findOne(id);

        return await this.prisma.users.update({
            where: { id },
            data: { is_active: true },
        });
    }

    async bulkUpdateRole(dto: BulkUpdateRoleDto) {
        const userType = await this.prisma.user_types.findUnique({ where: { id: dto.user_type_id } });
        if (!userType) throw new BadRequestException('Tipo de usuario no encontrado');

        const targetUsers = await this.prisma.users.findMany({ where: { id: { in: dto.user_ids } } });

        const results: { id: string; status: 'ok' | 'error'; message?: string }[] = [];

        for (const userId of dto.user_ids) {
            const target = targetUsers.find(u => u.id === userId);
            if (!target) {
                results.push({ id: userId, status: 'error', message: 'Usuario no encontrado' });
                continue;
            }

            const nextAreaId = userType.name === 'admin_subdireccion' ? null : target.area_id;
            if (userType.name !== 'admin_subdireccion' && !nextAreaId) {
                results.push({ id: userId, status: 'error', message: 'El usuario no tiene un área asignada, requerida para este rol' });
                continue;
            }

            try {
                await this.prisma.users.update({
                    where: { id: userId },
                    data: { user_type_id: dto.user_type_id, area_id: nextAreaId },
                });
                results.push({ id: userId, status: 'ok' });
            } catch {
                results.push({ id: userId, status: 'error', message: 'Error al actualizar el usuario' });
            }
        }

        return {
            updated: results.filter(r => r.status === 'ok').length,
            failed: results.filter(r => r.status === 'error').length,
            results,
        };
    }

    private stripDiacritics(value: string): string {
        return value
            .normalize('NFD')
            .split('')
            .filter((ch) => {
                const code = ch.charCodeAt(0);
                return code < 0x0300 || code > 0x036f;
            })
            .join('');
    }

    private toUsernameToken(value: string): string {
        return this.stripDiacritics(value)
            .toLowerCase()
            .trim()
            .split(/\s+/)[0]
            .replace(/[^a-z0-9]/g, '');
    }

    private generateUsername(names: string, last_name: string, taken: Set<string>): string {
        const base = `${this.toUsernameToken(names)}${this.toUsernameToken(last_name)}` || 'usuario';
        let candidate = base;
        let suffix = 1;
        while (taken.has(candidate)) {
            suffix += 1;
            candidate = `${base}${suffix}`;
        }
        taken.add(candidate);
        return candidate;
    }

    private async validateBulkAssignment(userTypeId: string, subdireccionId?: string, areaId?: string) {
        const normalizedSubdireccionId = subdireccionId === '' ? undefined : subdireccionId;
        const normalizedAreaId = areaId === '' ? undefined : areaId;

        const userType = await this.prisma.user_types.findUnique({
            where: { id: userTypeId }
        });

        if (!userType) {
            throw new BadRequestException('Tipo de usuario no encontrado');
        }

        if (!normalizedSubdireccionId) {
            throw new BadRequestException('Debe seleccionar una subdirección');
        }

        if (userType.name !== 'admin_subdireccion' && !normalizedAreaId) {
            throw new BadRequestException('Debe seleccionar un área');
        }

        const area = normalizedAreaId
            ? await this.prisma.areas.findUnique({
                where: { id: normalizedAreaId },
                select: { subdireccion_id: true }
            })
            : null;

        if (normalizedAreaId && !area) {
            throw new BadRequestException('Área no encontrada');
        }

        if (area && area.subdireccion_id !== normalizedSubdireccionId) {
            throw new BadRequestException('El área no pertenece a la subdirección seleccionada');
        }

        return { userType, normalizedSubdireccionId, normalizedAreaId };
    }

    private readonly excelHeaderMap: Record<string, BulkExcelField> = {
        nombres: 'names',
        nombre: 'names',
        apellidos: 'last_name',
        apellido: 'last_name',
        identificacion: 'num_id',
        cedula: 'num_id',
        documento: 'num_id',
        numdocumento: 'num_id',
        nodocumento: 'num_id',
        numeroidentificacion: 'num_id',
        numerodeidentificacion: 'num_id',
        email: 'email',
        correo: 'email',
        correoelectronico: 'email',
        cargo: 'charge',
        charge: 'charge',
    };

    private normalizeHeaderKey(value: string): string {
        return this.stripDiacritics(value).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    }

    private extractCellText(cellValue: unknown): string {
        if (cellValue === null || cellValue === undefined) return '';
        if (typeof cellValue === 'object') {
            if ('text' in (cellValue as any)) return String((cellValue as any).text ?? '');
            if ('result' in (cellValue as any)) return String((cellValue as any).result ?? '');
            if (cellValue instanceof Date) return cellValue.toISOString();
        }
        return String(cellValue);
    }

    private findHeaderRow(worksheet: ExcelJS.Worksheet): { headerRowNumber: number; columnMap: Map<number, BulkExcelField> } {
        const requiredFields: BulkExcelField[] = ['names', 'last_name', 'num_id', 'email'];
        const maxScanRows = Math.min(worksheet.rowCount || 20, 20);

        let bestRowNumber = 0;
        let bestMap = new Map<number, BulkExcelField>();
        let bestRequiredCount = 0;

        for (let r = 1; r <= maxScanRows; r++) {
            const candidateMap = new Map<number, BulkExcelField>();
            worksheet.getRow(r).eachCell((cell, colNumber) => {
                const key = this.normalizeHeaderKey(this.extractCellText(cell.value));
                const field = this.excelHeaderMap[key];
                if (field && !Array.from(candidateMap.values()).includes(field)) {
                    candidateMap.set(colNumber, field);
                }
            });

            const requiredCount = requiredFields.filter(f => Array.from(candidateMap.values()).includes(f)).length;
            if (requiredCount > bestRequiredCount) {
                bestRequiredCount = requiredCount;
                bestMap = candidateMap;
                bestRowNumber = r;
            }
        }

        if (bestRequiredCount < 3) return { headerRowNumber: 0, columnMap: new Map() };

        return { headerRowNumber: bestRowNumber, columnMap: bestMap };
    }

    private async parseUsersExcel(buffer: Buffer): Promise<BulkRawRow[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) return [];

        const { headerRowNumber, columnMap } = this.findHeaderRow(worksheet);
        if (headerRowNumber === 0) return [];

        const rows: BulkRawRow[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= headerRowNumber) return;

            const record: BulkRawRow = { rowNumber, names: '', last_name: '', num_id: '', email: '', charge: '' };
            let hasData = false;

            columnMap.forEach((field, colNumber) => {
                const text = this.extractCellText(row.getCell(colNumber).value).trim();
                if (text) hasData = true;
                record[field] = text;
            });

            if (hasData) rows.push(record);
        });

        return rows;
    }

    async previewBulkUsers(file: Express.Multer.File, dto: BulkUploadUsersDto) {
        const { userType, normalizedSubdireccionId, normalizedAreaId } =
            await this.validateBulkAssignment(dto.user_type_id, dto.subdireccion_id, dto.area_id);

        const rawRows = await this.parseUsersExcel(file.buffer);

        if (rawRows.length === 0) {
            throw new BadRequestException(
                'El archivo no contiene filas de datos o no se reconocieron las columnas esperadas (Nombres, Apellidos, Identificación, Email)'
            );
        }

        const existing = await this.prisma.users.findMany({
            select: { username: true, email: true, num_id: true }
        });
        const takenUsernames = new Set(existing.map(u => u.username));
        const takenEmails = new Set(existing.map(u => u.email.toLowerCase()));
        const takenNumIds = new Set(existing.map(u => u.num_id));

        const seenEmailsInFile = new Set<string>();
        const seenNumIdsInFile = new Set<string>();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const rows: BulkPreviewRow[] = rawRows.map((raw) => {
            const errors: string[] = [];
            const { names, last_name, num_id, email, charge } = raw;
            const emailLower = email.toLowerCase();

            if (!names) errors.push('Falta el nombre');
            if (!last_name) errors.push('Falta el apellido');
            if (!num_id) errors.push('Falta la identificación');
            if (!email) errors.push('Falta el email');
            else if (!emailRegex.test(email)) errors.push('Email con formato inválido');

            if (num_id && takenNumIds.has(num_id)) errors.push('Identificación ya registrada en el sistema');
            if (email && takenEmails.has(emailLower)) errors.push('Email ya registrado en el sistema');
            if (num_id && seenNumIdsInFile.has(num_id)) errors.push('Identificación duplicada en el archivo');
            if (email && seenEmailsInFile.has(emailLower)) errors.push('Email duplicado en el archivo');

            if (num_id) seenNumIdsInFile.add(num_id);
            if (email) seenEmailsInFile.add(emailLower);

            const username = (names && last_name) ? this.generateUsername(names, last_name, takenUsernames) : '';
            const password = num_id;

            return {
                row: raw.rowNumber,
                names, last_name, num_id, email,
                charge: charge || undefined,
                username,
                password,
                status: errors.length === 0 ? 'ok' : 'error',
                errors,
            };
        });

        return {
            subdireccion_id: normalizedSubdireccionId,
            area_id: userType.name === 'admin_subdireccion' ? null : (normalizedAreaId ?? null),
            user_type_id: dto.user_type_id,
            total: rows.length,
            valid: rows.filter(r => r.status === 'ok').length,
            invalid: rows.filter(r => r.status === 'error').length,
            rows,
        };
    }

    async confirmBulkUsers(dto: ConfirmBulkUsersDto) {
        const { userType, normalizedSubdireccionId, normalizedAreaId } =
            await this.validateBulkAssignment(dto.user_type_id, dto.subdireccion_id, dto.area_id);

        const finalAreaId = userType.name === 'admin_subdireccion' ? null : (normalizedAreaId ?? null);

        const existing = await this.prisma.users.findMany({
            select: { username: true, email: true, num_id: true }
        });
        const takenUsernames = new Set(existing.map(u => u.username));
        const takenEmails = new Set(existing.map(u => u.email.toLowerCase()));
        const takenNumIds = new Set(existing.map(u => u.num_id));

        const seenUsernamesInFile = new Set<string>();
        const seenEmailsInFile = new Set<string>();
        const seenNumIdsInFile = new Set<string>();

        const results: Array<{
            row: number;
            names: string;
            last_name: string;
            username: string;
            status: 'created' | 'error';
            message?: string;
            id?: string;
        }> = [];

        for (let i = 0; i < dto.users.length; i++) {
            const row = dto.users[i];
            const emailLower = row.email.toLowerCase();
            const errors: string[] = [];

            if (takenUsernames.has(row.username) || seenUsernamesInFile.has(row.username)) errors.push('Nombre de usuario duplicado');
            if (takenEmails.has(emailLower) || seenEmailsInFile.has(emailLower)) errors.push('Email duplicado');
            if (takenNumIds.has(row.num_id) || seenNumIdsInFile.has(row.num_id)) errors.push('Identificación duplicada');

            if (errors.length > 0) {
                results.push({ row: i + 1, names: row.names, last_name: row.last_name, username: row.username, status: 'error', message: errors.join(', ') });
                continue;
            }

            try {
                const hashedPassword = await bcrypt.hash(row.password, 10);
                const created = await this.prisma.users.create({
                    data: {
                        username: row.username,
                        password: hashedPassword,
                        user_type_id: dto.user_type_id,
                        names: row.names,
                        last_name: row.last_name,
                        num_id: row.num_id,
                        email: row.email,
                        charge: row.charge,
                        area_id: finalAreaId,
                        subdireccion_id: normalizedSubdireccionId,
                    },
                });

                takenUsernames.add(row.username);
                takenEmails.add(emailLower);
                takenNumIds.add(row.num_id);
                seenUsernamesInFile.add(row.username);
                seenEmailsInFile.add(emailLower);
                seenNumIdsInFile.add(row.num_id);

                results.push({ row: i + 1, names: row.names, last_name: row.last_name, username: row.username, status: 'created', id: created.id });
            } catch {
                results.push({ row: i + 1, names: row.names, last_name: row.last_name, username: row.username, status: 'error', message: 'Error al crear el usuario' });
            }
        }

        return {
            created: results.filter(r => r.status === 'created').length,
            failed: results.filter(r => r.status === 'error').length,
            results,
        };
    }

    async generateUsersTemplate(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Usuarios');

        sheet.columns = [
            { header: 'Nombres', key: 'names', width: 25 },
            { header: 'Apellidos', key: 'last_name', width: 25 },
            { header: 'Identificación', key: 'num_id', width: 20 },
            { header: 'Email', key: 'email', width: 32 },
            { header: 'Cargo', key: 'charge', width: 28 },
        ];

        sheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        });

        sheet.addRow({
            names: 'Santiago',
            last_name: 'Jojoa',
            num_id: '1234567890',
            email: 'santiago.jojoa@example.com',
            charge: 'Profesional Universitario',
        });

        return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    async exportUsersToExcel(filters: { subdireccionId?: string; areaId?: string }): Promise<Buffer> {
        const where: Prisma.usersWhereInput = {};
        if (filters.areaId) {
            where.area_id = filters.areaId;
        } else if (filters.subdireccionId) {
            where.OR = [
                { subdireccion_id: filters.subdireccionId },
                { areas: { subdireccion_id: filters.subdireccionId } },
            ];
        }

        const users = await this.prisma.users.findMany({
            where,
            include: this.userInclude,
            orderBy: { names: 'asc' },
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Usuarios');

        sheet.columns = [
            { header: 'Nombres', key: 'names', width: 22 },
            { header: 'Apellidos', key: 'last_name', width: 22 },
            { header: 'Usuario', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Identificación', key: 'num_id', width: 18 },
            { header: 'Cargo', key: 'charge', width: 26 },
            { header: 'Rol', key: 'role', width: 20 },
            { header: 'Subdirección', key: 'subdireccion', width: 26 },
            { header: 'Área', key: 'area', width: 26 },
            { header: 'Estado', key: 'status', width: 12 },
        ];

        sheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        });

        for (const user of users) {
            sheet.addRow({
                names: user.names,
                last_name: user.last_name,
                username: user.username,
                email: user.email,
                num_id: user.num_id,
                charge: user.charge || '',
                role: user.user_types?.name || '',
                subdireccion: user.subdirecciones?.name || user.areas?.subdirecciones?.name || '',
                area: user.user_types?.name === 'admin_subdireccion' ? '' : (user.areas?.name || ''),
                status: user.is_active ? 'Activo' : 'Inactivo',
            });
        }

        return Buffer.from(await workbook.xlsx.writeBuffer());
    }
}

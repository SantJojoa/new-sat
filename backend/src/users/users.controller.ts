import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile, Query,
} from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { BulkUploadUsersDto } from "./dto/bulk-upload-users.dto";
import { ConfirmBulkUsersDto } from "./dto/confirm-bulk-users.dto";
import { BulkUpdateRoleDto } from "./dto/bulk-update-role.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @RequirePermissions('usuarios', 'create')
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @RequirePermissions('usuarios', 'view')
    findAll() {
        return this.usersService.findAll();
    }

    @Get('types')
    @RequirePermissions('usuarios', 'view')
    getUserTypes() {
        return this.usersService.findUserTypes();
    }

    @Get('export')
    @RequirePermissions('usuarios', 'view')
    async exportUsers(
        @Query('subdireccion_id') subdireccionId: string | undefined,
        @Query('area_id') areaId: string | undefined,
        @Res({ passthrough: true }) res: Response,
    ) {
        const buffer = await this.usersService.exportUsersToExcel({ subdireccionId, areaId });
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="usuarios.xlsx"',
        });
        return new StreamableFile(buffer);
    }

    @Patch('bulk/role')
    @RequirePermissions('usuarios', 'edit')
    bulkUpdateRole(@Body() dto: BulkUpdateRoleDto) {
        return this.usersService.bulkUpdateRole(dto);
    }

    @Get('bulk-upload/template')
    @RequirePermissions('usuarios', 'create')
    async downloadBulkUploadTemplate(@Res({ passthrough: true }) res: Response) {
        const buffer = await this.usersService.generateUsersTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="plantilla_carga_usuarios.xlsx"',
        });
        return new StreamableFile(buffer);
    }

    @Post('bulk-upload/preview')
    @RequirePermissions('usuarios', 'create')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const okExt = /\.(xlsx|xls)$/i.test(file.originalname);
            if (!okExt) return cb(new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
            cb(null, true);
        },
    }))
    previewBulkUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: BulkUploadUsersDto,
    ) {
        if (!file) throw new BadRequestException('Debe adjuntar un archivo Excel');
        return this.usersService.previewBulkUsers(file, dto);
    }

    @Post('bulk-upload/confirm')
    @RequirePermissions('usuarios', 'create')
    confirmBulkUpload(@Body() dto: ConfirmBulkUsersDto) {
        return this.usersService.confirmBulkUsers(dto);
    }

    @Get(':id')
    @RequirePermissions('usuarios', 'view')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @RequirePermissions('usuarios', 'edit')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }


    @Delete(':id')
    @RequirePermissions('usuarios', 'delete')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch(':id/deactivate')
    @RequirePermissions('usuarios', 'edit')
    deactivate(@Param('id') id: string) {
        return this.usersService.deactivate(id);
    }

    @Patch(':id/activate')
    @RequirePermissions('usuarios', 'edit')
    activate(@Param('id') id: string) {
        return this.usersService.activate(id);
    }
}
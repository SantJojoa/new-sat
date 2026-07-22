import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
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
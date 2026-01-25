import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common'

import { UsersService } from './users.service'
import { JwtGuard } from '../auth/jwt.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@UseGuards(JwtGuard, RolesGuard)

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Roles('ADMIN')
    @Get()
    findAll() {
        return this.usersService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id)
    }

    @Roles('ADMIN')
    @Post()
    create(@Body() body: any) {
        return this.usersService.create(body)
    }

    @Roles('ADMIN')
    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.usersService.update(id, body)
    }
}

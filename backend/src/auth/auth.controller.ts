import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const user = await this.usersService.findOne(req.user.id);
        const subdireccion = user.subdirecciones ?? user.areas?.subdirecciones ?? null;

        return {
            ...user,
            subdireccion_id: user.subdireccion_id ?? user.areas?.subdireccion_id,
            area: user.areas,
            subdireccion,
        };
    }
}

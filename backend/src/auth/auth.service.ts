import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { UsersService } from "../users/users.service";
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.usersService.findByUsername(username);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        if (!user.is_active) {
            throw new UnauthorizedException('User is not active')
        }


        const { password: _, ...result } = user;

        return result;
    }

    async login(logingDto: LoginDto) {
        const user = await this.validateUser(logingDto.username, logingDto.password);

        const payload = {
            username: user.username,
            sub: user.id,
            user_type_id: user.user_type_id,
            email: user.email
        }

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                names: user.names,
                last_names: user.last_names,
                email: user.email,
                user_type_id: user.user_type_id,
                area_id: user.area_id,
            }
        }
    }

    async register(registerDto: any) {
        const user = await this.usersService.create(registerDto);
        return user;
    }
}

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common'

import * as jwt from 'jsonwebtoken'

@Injectable()
export class JwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()

        const authHeader = request.headers['authorization']
        if (!authHeader) {
            throw new UnauthorizedException('Token no enviado')
        }

        const [type, token] = authHeader.split(' ')

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Formato de token inválido')
        }

        try {
            const payload = jwt.verify(
                token,
                process.env.JWT_SECRET as string
            )

            request.user = payload

            return true
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado')
        }
    }
}

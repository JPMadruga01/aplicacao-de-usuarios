import { Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService{
    constructor(private prisma: PrismaService) {}
    
    async signup(dto: AuthDto) {
        
        // gerar as senha hash
        const hash = await bcrypt.hash(dto.password, 10); // 10 = saltRounds
        // salvar o novo usuário no db
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash,
            },
        });
        // retornar o usuário salvo
        return user;
    }

    signin() {
        return {msg: 'I have signed in'};
    }
}
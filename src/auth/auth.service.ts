import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    // Verificar se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Gerar hash da senha
    const hash = await bcrypt.hash(dto.password, 10);

    // Criar novo usuário
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        level: dto.level || 1,
      },
    });

    // Retornar token JWT
    return this.signToken(user.id, user.email, user.level);
  }

  async signin(dto: LoginDto) {
    // Buscar usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se o usuário foi deletado
    if (user.deletedAt) {
      throw new ForbiddenException('Usuário foi deletado');
    }

    // Verificar senha
    const passwordMatches = await bcrypt.compare(dto.password, user.hash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Retornar token JWT
    return this.signToken(user.id, user.email, user.level);
  }

  async signToken(
    userId: number,
    email: string,
    level: number,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
      level,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '24h',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
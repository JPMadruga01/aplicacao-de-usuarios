import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        level: dto.level || 1,
      },
    });

    const { hash: _, ...userWithoutHash } = user;
    return userWithoutHash;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const dataToUpdate: any = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      level: dto.level,
    };

    if (dto.password) {
      dataToUpdate.hash = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  async findDeleted() {
    const deletedUsers = await this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return deletedUsers;
  }

  async generateReport(format: 'pdf' | 'csv', res: Response) {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        level: true,
        createdAt: true,
      },
    });

    if (format === 'csv') {
      return this.generateCSV(users, res);
    } else {
      return this.generatePDF(users, res);
    }
  }

  private generateCSV(users: any[], res: Response) {
    const header = 'ID,Email,First Name,Last Name,Level,Created At\n';
    const rows = users
      .map(
        (u) =>
          `${u.id},"${u.email}","${u.firstName || ''}","${u.lastName || ''}",${u.level},"${u.createdAt.toISOString()}"`,
      )
      .join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-report.csv');
    res.send(csv);
  }

  private generatePDF(users: any[], res: Response) {
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-report.pdf',
    );

    doc.pipe(res);

    // Título
    doc.fontSize(20).text('Relatório de Usuários', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
      align: 'center',
    });
    doc.moveDown(2);

    // Cabeçalho da tabela
    doc
      .fontSize(12)
      .text(
        'ID       Email                    Nome                Level    Data de Criação',
      );
    doc.moveDown(0.5);

    // Dados
    users.forEach((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const line = `${user.id}    ${user.email.padEnd(25)}  ${name.padEnd(20)}  ${user.level}       ${user.createdAt.toLocaleDateString('pt-BR')}`;
      doc.fontSize(10).text(line);
    });

    doc.moveDown(2);
    doc.fontSize(10).text(`Total de usuários: ${users.length}`, {
      align: 'right',
    });

    doc.end();
  }
}
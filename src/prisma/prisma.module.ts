import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // adicionando o decorator a classe PrismaService vai estar disponível para todas classes Module
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}

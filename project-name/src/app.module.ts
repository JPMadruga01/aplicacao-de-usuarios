import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';


@Module({ // função que adiciona alguns metadados para a classe
  imports: [AuthModule],
})
export class AppModule {}

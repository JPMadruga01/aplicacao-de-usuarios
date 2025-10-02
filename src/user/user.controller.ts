import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { LevelGuard } from 'src/auth/guard/level.guard';
import { Level } from 'src/auth/decorator/level.decorator';
import type { Response } from 'express';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('deleted')
  findDeleted() {
    return this.userService.findDeleted();
  }

  @UseGuards(LevelGuard)
  @Level(4)
  @Get('report')
  generateReport(
    @Query('format') format: 'pdf' | 'csv' = 'pdf',
    @Res() res: Response,
  ) {
    return this.userService.generateReport(format, res);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
import { SetMetadata } from '@nestjs/common';

export const Level = (level: number) => SetMetadata('level', level);
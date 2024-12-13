import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    default: 10,
    description: 'How many rows do you need',
  })
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number) //Es como el enableImplicitConversion que se coloca en el main.ts -> useGlobalPipes
  limit?: number;

  @ApiProperty({
    default: 0,
    description: 'How many rows do you want to skip',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number) //Es como el enableImplicitConversion que se coloca en el main.ts -> useGlobalPipes
  offset?: number;
}

import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number) //Es como el enableImplicitConversion que se coloca en el main.ts -> useGlobalPipes
  limit?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number) //Es como el enableImplicitConversion que se coloca en el main.ts -> useGlobalPipes
  offset?: number;
}

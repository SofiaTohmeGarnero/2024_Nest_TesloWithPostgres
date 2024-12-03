import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

/** Asi es como recibirá el body el endpoint, aqui por ejemplo
 *  - tags es opcional, aunque en la base de datos es obligatorio (por eso en la entity le colocamos un valor por defecto si no llega en el body)
 *  - slug es opcional, aunque en la base de datos es obligatorio y como no le colocamos un valor por defecto (pq debe ser unico) usamos la fnc beforeInsert para asegurrarnos que exista y sea conforme lo que necesitamos
 * */
export class CreateProductDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  stock?: number;

  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}

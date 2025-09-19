//backend\src\products\dto\create-product.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name_th: string;

  @IsString()
  @IsNotEmpty()
  name_en: string;

  @IsString()
  @IsNotEmpty()
  description_th: string;

  @IsString()
  @IsNotEmpty()
  description_en: string;
  
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specs_th: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specs_en: string[];

  @IsNumber()
  price: number;
  
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  brandId: string;
}


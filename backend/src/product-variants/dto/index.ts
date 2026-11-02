import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'Color: Red, Size: M' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'SP-XYZ-RED-M' })
  @IsString()
  @MaxLength(60)
  sku: string;

  @ApiProperty({ example: 5999000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number = 0;

  @ApiPropertyOptional({ example: { color: 'red', size: 'M' } })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateVariantDto {
  @ApiPropertyOptional({ example: 'Color: Blue, Size: L' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'SP-XYZ-BLUE-L' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @ApiPropertyOptional({ example: 6499000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: { color: 'blue', size: 'L' } })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
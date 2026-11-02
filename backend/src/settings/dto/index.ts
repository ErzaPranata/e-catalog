import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'My Store' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  storeName?: string;

  @ApiPropertyOptional({ example: 'Welcome to our store' })
  @IsOptional()
  @IsString()
  storeDescription?: string;

  @ApiPropertyOptional({ example: '6281234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'IDR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'Jl. Example No. 123, Jakarta' })
  @IsOptional()
  @IsString()
  storeAddress?: string;

  @ApiPropertyOptional({ example: 'Free shipping for orders over 500k!' })
  @IsOptional()
  @IsString()
  announcement?: string;
}
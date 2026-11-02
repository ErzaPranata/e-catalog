import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @ApiPropertyOptional({ example: 'products/abc123/image.jpg' })
  @IsOptional()
  @IsString()
  storagePath?: string;

  @ApiPropertyOptional({ example: 'Product main image' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @ApiPropertyOptional({ example: 'variant-id-here', description: 'Link image to a specific variant' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class UpdateImageDto {
  @ApiPropertyOptional({ example: 'https://example.com/new-image.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Updated alt text' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 'variant-id-here', description: 'Link image to a specific variant' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class ReorderImagesDto {
  @ApiProperty({ type: [String], example: ['img-id-1', 'img-id-2', 'img-id-3'] })
  @IsArray()
  @IsString({ each: true })
  imageIds: string[];
}
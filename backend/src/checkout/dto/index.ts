import { IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(150)
  customerName: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @MaxLength(30)
  phone: string;

  @ApiProperty({ example: 'Jl. Contoh No. 123, Jakarta' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Please deliver after 5 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}
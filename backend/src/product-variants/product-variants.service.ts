import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariantDto, UpdateVariantDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductVariantsService {
  constructor(private prisma: PrismaService) {}

  async findByProductId(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant;
  }

  async create(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingSku = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        ...dto,
        productId,
        price: new Prisma.Decimal(dto.price),
      },
    });

    return variant;
  }

  async update(id: string, dto: UpdateVariantDto) {
    await this.findById(id);

    if (dto.sku) {
      const existing = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (existing && existing.id !== id) {
        throw new ConflictException('SKU already exists');
      }
    }

    const updateData: any = { ...dto };
    if (dto.price !== undefined) {
      updateData.price = new Prisma.Decimal(dto.price);
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const orderItemCount = await this.prisma.orderItem.count({
      where: { variantId: id },
    });

    if (orderItemCount > 0) {
      return this.prisma.productVariant.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.productVariant.delete({ where: { id } });
  }

  async validateAndGetVariant(productId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, isActive: true },
      include: { product: true },
    });

    if (!variant) {
      throw new BadRequestException('Variant not found or inactive');
    }

    if (variant.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${variant.stock}`);
    }

    return variant;
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { stock: { increment: quantity } },
    });
  }
}
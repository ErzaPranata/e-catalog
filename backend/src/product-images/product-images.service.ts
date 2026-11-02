import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto, UpdateImageDto, ReorderImagesDto } from './dto';

@Injectable()
export class ProductImagesService {
  constructor(private prisma: PrismaService) {}

  async findByProductId(productId: string, variantId?: string) {
    return this.prisma.productImage.findMany({
      where: { 
        productId,
        variantId: variantId || null, // If variantId provided, filter by it; otherwise get product-level images
      },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findByVariantId(variantId: string) {
    return this.prisma.productImage.findMany({
      where: { variantId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findById(id: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return image;
  }

  async create(productId: string, dto: CreateImageDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If variantId provided, verify it belongs to this product
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId },
      });
      if (!variant) {
        throw new BadRequestException('Variant not found for this product');
      }
    }

    // If setting as primary, unset other primary images
    if (dto.isPrimary) {
      const whereClause: any = { productId, isPrimary: true };
      if (dto.variantId) {
        whereClause.variantId = dto.variantId;
      } else {
        whereClause.variantId = null;
      }
      await this.prisma.productImage.updateMany({
        where: whereClause,
        data: { isPrimary: false },
      });
    }

    // Get max sortOrder
    const maxOrder = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return this.prisma.productImage.create({
      data: {
        ...dto,
        productId,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async createMultiple(productId: string, dtos: CreateImageDto[]) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const results = [];
    let primarySet = false;

    for (let i = 0; i < dtos.length; i++) {
      const dto = dtos[i];
      
      // If variantId provided, verify it belongs to this product
      if (dto.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: dto.variantId, productId },
        });
        if (!variant) {
          throw new BadRequestException(`Variant ${dto.variantId} not found for this product`);
        }
      }

      const isPrimary = dto.isPrimary && !primarySet;
      if (isPrimary) primarySet = true;

      const image = await this.prisma.productImage.create({
        data: {
          ...dto,
          productId,
          isPrimary,
          sortOrder: dto.sortOrder ?? i,
        },
      });
      results.push(image);
    }

    return results;
  }

  async update(id: string, dto: UpdateImageDto) {
    const existingImage = await this.findById(id);

    // If variantId is being changed, verify it belongs to this product
    if (dto.variantId !== undefined && dto.variantId !== existingImage.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId: existingImage.productId },
      });
      if (!variant) {
        throw new BadRequestException('Variant not found for this product');
      }
    }

    // If setting as primary, unset other primary images for this product/variant
    if (dto.isPrimary) {
      const whereClause: any = { productId: existingImage.productId, isPrimary: true, id: { not: id } };
      if (dto.variantId !== undefined) {
        whereClause.variantId = dto.variantId;
      } else if (existingImage.variantId) {
        whereClause.variantId = existingImage.variantId;
      } else {
        whereClause.variantId = null;
      }
      await this.prisma.productImage.updateMany({
        where: whereClause,
        data: { isPrimary: false },
      });
    }

    return this.prisma.productImage.update({
      where: { id },
      data: dto,
    });
  }

  async reorder(productId: string, dto: ReorderImagesDto) {
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });

    const imageIds = images.map((img) => img.id);
    const invalidIds = dto.imageIds.filter((id) => !imageIds.includes(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid image IDs: ${invalidIds.join(', ')}`);
    }

    const updates = dto.imageIds.map((id, index) =>
      this.prisma.productImage.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );

    return Promise.all(updates);
  }

  async setPrimary(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Image not found for this product');
    }

    const whereClause: any = { productId, isPrimary: true };
    if (image.variantId) {
      whereClause.variantId = image.variantId;
    } else {
      whereClause.variantId = null;
    }
    await this.prisma.productImage.updateMany({
      where: whereClause,
      data: { isPrimary: false },
    });

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async delete(id: string) {
    const image = await this.findById(id);

    // If deleting primary, set next image as primary
    if (image.isPrimary) {
      const whereClause: any = { productId: image.productId, id: { not: id } };
      if (image.variantId) {
        whereClause.variantId = image.variantId;
      } else {
        whereClause.variantId = null;
      }
      const nextImage = await this.prisma.productImage.findFirst({
        where: whereClause,
        orderBy: { sortOrder: 'asc' },
      });
      if (nextImage) {
        await this.prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.prisma.productImage.delete({ where: { id } });
  }
}
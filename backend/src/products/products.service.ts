import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      inStock,
    } = query;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      ...(inStock && {
        OR: [
          { stock: { gt: 0 } },
          { variants: { some: { stock: { gt: 0 }, isActive: true } } },
        ],
      }),
    };

    const priceFilter: Prisma.DecimalFilter = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    if (Object.keys(priceFilter).length > 0) {
      where.basePrice = priceFilter;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: Math.min(limit, 50),
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { imageUrl: true, altText: true },
          },
          variants: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, stock: true },
            orderBy: { price: 'asc' },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((product) => this.formatProductResponse(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlugPublic(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, imageUrl: true, altText: true, isPrimary: true, sortOrder: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          select: { id: true, name: true, sku: true, price: true, stock: true, attributes: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProductDetailResponse(product);
  }

  async findAllAdmin(page = 1, limit = 10, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true, altText: true } },
          variants: { select: { id: true, name: true, price: true, stock: true, isActive: true } },
          _count: { select: { variants: true, images: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((product) => this.formatProductResponse(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByIdAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProductDetailResponse(product);
  }

  async create(dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        basePrice: new Prisma.Decimal(dto.basePrice),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findByIdAdmin(id);

    if (dto.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existing && existing.id !== id) {
        throw new ConflictException('SKU already exists');
      }
    }

    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug already exists');
      }
    }

    const updateData: any = { ...dto };
    if (dto.basePrice !== undefined) {
      updateData.basePrice = new Prisma.Decimal(dto.basePrice);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findByIdAdmin(id);

    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      return this.prisma.product.update({
        where: { id },
        data: { isPublished: false },
      });
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stock: { increment: quantity } },
    });
  }

  private formatProductResponse(product: Product & {
    category: { id: string; name: string; slug: string };
    images: { imageUrl: string; altText: string | null }[];
    variants: { id: string; name: string; price: Prisma.Decimal; stock: number; isActive?: boolean }[];
  }) {
    const primaryImage = product.images[0];
    const hasVariants = product.variants.length > 0;
    const basePrice = Number(product.basePrice);
    let minPrice = basePrice;
    let maxPrice = basePrice;
    let totalStock = product.stock;

    if (hasVariants) {
      const prices = product.variants.map((v) => Number(v.price));
      minPrice = prices.reduce((min, p) => (p < min ? p : min), prices[0]);
      maxPrice = prices.reduce((max, p) => (p > max ? p : max), prices[0]);
      totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      basePrice,
      price: hasVariants ? { min: minPrice, max: maxPrice } : basePrice,
      stock: totalStock,
      hasVariants,
      category: product.category,
      primaryImage: primaryImage ? { url: primaryImage.imageUrl, alt: primaryImage.altText } : null,
      isPublished: product.isPublished,
      createdAt: product.createdAt,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        stock: v.stock,
        isActive: v.isActive ?? true,
      })),
    };
  }

  private formatProductDetailResponse(product: Product & {
    category: { id: string; name: string; slug: string };
    images: { id: string; imageUrl: string; altText: string | null; isPrimary: boolean; sortOrder: number }[];
    variants: { id: string; name: string; sku: string; price: Prisma.Decimal; stock: number; attributes: any }[];
  }) {
    const hasVariants = product.variants.length > 0;
    const basePrice = Number(product.basePrice);
    let minPrice = basePrice;
    let maxPrice = basePrice;
    let totalStock = product.stock;

    if (hasVariants) {
      const prices = product.variants.map((v) => Number(v.price));
      minPrice = prices.reduce((min, p) => (p < min ? p : min), prices[0]);
      maxPrice = prices.reduce((max, p) => (p > max ? p : max), prices[0]);
      totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      basePrice,
      price: hasVariants ? { min: minPrice, max: maxPrice } : basePrice,
      stock: totalStock,
      hasVariants,
      category: product.category,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.imageUrl,
        alt: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        stock: v.stock,
        attributes: v.attributes,
      })),
      isPublished: product.isPublished,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
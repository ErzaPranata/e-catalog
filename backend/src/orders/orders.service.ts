import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto, OrderQueryDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    orderNumber: string;
    customerName: string;
    phone: string;
    address: string;
    notes?: string;
    subtotal: Prisma.Decimal;
    total: Prisma.Decimal;
    items: {
      productId?: string;
      variantId?: string;
      productName: string;
      variantName?: string;
      sku: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
    }[];
  }) {
    return this.prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        subtotal: data.subtotal,
        total: data.total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        items: {
          create: data.items,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } } },
            variant: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findAllAdmin(query: OrderQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByIdAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } } },
            variant: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } } },
            variant: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findByIdAdmin(id);
    const newStatus = dto.status;

    // Validate status transition
    this.validateStatusTransition(order.status, newStatus);

    // Handle stock updates
    if (order.status === OrderStatus.PENDING && newStatus === OrderStatus.CONFIRMED) {
      await this.decreaseStock(order.items);
    } else if (
      (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PROCESSING) &&
      newStatus === OrderStatus.CANCELLED
    ) {
      await this.increaseStock(order.items);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            variant: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    const order = await this.findByIdAdmin(id);
    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            variant: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getDashboardStats() {
    const [
      activeProducts,
      activeCategories,
      newOrders,
      processingOrders,
      completedOrders,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isPublished: true } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] } },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.getLowStockProducts(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { quantity: true } },
        },
      }),
    ]);

    return {
      activeProducts,
      activeCategories,
      newOrders,
      processingOrders,
      completedOrders,
      lowStockProducts,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    };
  }

  private async getLowStockProducts(threshold = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { stock: { lte: threshold, gt: 0 } },
          { variants: { some: { stock: { lte: threshold, gt: 0 }, isActive: true } } },
        ],
      },
      include: {
        variants: { where: { isActive: true }, select: { id: true, name: true, stock: true } },
      },
      take: 10,
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      hasVariants: p.variants.length > 0,
      variants: p.variants,
    }));
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  private async decreaseStock(
    items: { productId?: string | null; variantId?: string | null; quantity: number }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant || variant.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variant ${item.variantId}`,
            );
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product || product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${item.productId}`,
            );
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    });
  }

  private async increaseStock(
    items: { productId?: string | null; variantId?: string | null; quantity: number }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
  }
}
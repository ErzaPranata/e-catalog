import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { ProductVariantsService } from '../product-variants/product-variants.service';
import { OrdersService } from '../orders/orders.service';
import { SettingsService } from '../settings/settings.service';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { CheckoutDto, CheckoutItemDto } from './dto';

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private variantsService: ProductVariantsService,
    private ordersService: OrdersService,
    private settingsService: SettingsService,
  ) {}

  async processCheckout(dto: CheckoutDto) {
    const { items, customerName, phone, address, notes } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate and calculate totals
    const validatedItems = await this.validateAndCalculateItems(items);

    const subtotal = validatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal; // No shipping/tax for now

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          phone,
          address,
          notes,
          subtotal: new Prisma.Decimal(subtotal),
          total: new Prisma.Decimal(total),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              quantity: item.quantity,
              lineTotal: new Prisma.Decimal(item.lineTotal),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true } },
            },
          },
        },
      });
      return newOrder;
    });

    // Get WhatsApp info
    const settings = await this.settingsService.getPublicSettings();
    const whatsappUrl = this.generateWhatsAppUrl(order, settings.whatsappNumber);

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        subtotal: order.subtotal,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: order.items,
      },
      whatsapp: {
        url: whatsappUrl,
        message: this.generateWhatsAppMessage(order),
      },
    };
  }

  private async validateAndCalculateItems(items: CheckoutItemDto[]) {
    const validatedItems = [];

    for (const item of items) {
      if (item.variantId) {
        const variant = await this.variantsService.validateAndGetVariant(
          item.productId!,
          item.variantId,
          item.quantity,
        );
        validatedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice: Number(variant.price),
          quantity: item.quantity,
          lineTotal: Number(variant.price) * item.quantity,
        });
      } else {
        const product = await this.productsService.findByIdAdmin(item.productId!);
        if (!product.isPublished) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        validatedItems.push({
          productId: item.productId,
          variantId: null,
          productName: product.name,
          variantName: null,
          sku: product.sku,
          unitPrice: Number(product.basePrice),
          quantity: item.quantity,
          lineTotal: Number(product.basePrice) * item.quantity,
        });
      }
    }

    return validatedItems;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const prefix = `ORD-${year}${month}${day}`;

    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
  }

  private generateWhatsAppUrl(order: any, whatsappNumber: string) {
    const message = this.generateWhatsAppMessage(order);
    const encodedMessage = encodeURIComponent(message);
    // Remove any non-digit characters from WhatsApp number
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  private generateWhatsAppMessage(order: any): string {
    const lines = [
      `*PESANAN BARU: ${order.orderNumber}*`,
      '',
      `*Pelanggan:* ${order.customerName}`,
      `*Telepon:* ${order.phone}`,
      `*Alamat:* ${order.address}`,
      '',
      `*Detail Pesanan:*`,
    ];

    for (const item of order.items) {
      const variantInfo = item.variantName ? ` (${item.variantName})` : '';
      lines.push(
        `${item.quantity}x ${item.productName}${variantInfo} - ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.lineTotal)}`
      );
    }

    lines.push(
      '',
      `*Subtotal:* ${this.formatCurrency(order.subtotal)}`,
      `*Total:* ${this.formatCurrency(order.total)}`,
    );

    if (order.notes) {
      lines.push('', `*Catatan:* ${order.notes}`);
    }

    lines.push(
      '',
      'Terima kasih telah berbelanja di toko kami!',
      'Kami akan mengonfirmasi pesanan Anda segera.',
    );

    return lines.join('\n');
  }

  private formatCurrency(amount: number | Prisma.Decimal): string {
    const num = typeof amount === 'number' ? amount : Number(amount);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  }
}
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }
    const modelNames = [
      'orderItem',
      'order',
      'productVariant',
      'productImage',
      'product',
      'category',
      'adminUser',
      'storeSetting',
    ];
    for (const modelName of modelNames) {
      const model = (this as any)[modelName];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
      }
    }
  }
}
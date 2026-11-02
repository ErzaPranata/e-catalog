import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSettings() {
    let settings = await this.prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return {
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      whatsappNumber: settings.whatsappNumber,
      currency: settings.currency,
      storeAddress: settings.storeAddress,
      announcement: settings.announcement,
    };
  }

  async getAdminSettings() {
    let settings = await this.prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await this.prisma.storeSetting.findFirst();

    if (existing) {
      return this.prisma.storeSetting.update({
        where: { id: existing.id },
        data: dto,
      });
    }

    return this.prisma.storeSetting.create({
      data: {
        storeName: dto.storeName || 'E-Catalog Store',
        whatsappNumber: dto.whatsappNumber || '',
        currency: dto.currency || 'IDR',
        storeDescription: dto.storeDescription,
        storeAddress: dto.storeAddress,
        announcement: dto.announcement,
      },
    });
  }

  private async createDefaultSettings() {
    return this.prisma.storeSetting.create({
      data: {
        storeName: 'E-Catalog Store',
        whatsappNumber: '',
        currency: 'IDR',
      },
    });
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductImagesService } from './product-images.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '@prisma/client';
import { CreateImageDto, UpdateImageDto, ReorderImagesDto } from './dto';

@ApiTags('Admin Product Images')
@Controller('admin/products/:productId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductImagesController {
  constructor(private imagesService: ProductImagesService) {}

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
  @ApiOperation({ summary: 'Get all images for a product' })
  @ApiResponse({ status: 200, description: 'List of images' })
  async findByProductId(@Param('productId') productId: string) {
    return this.imagesService.findByProductId(productId);
  }

  @Get('variant/:variantId')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MANAGER)
  @ApiOperation({ summary: 'Get all images for a specific variant' })
  @ApiResponse({ status: 200, description: 'List of variant images' })
  async findByVariantId(@Param('variantId') variantId: string) {
    return this.imagesService.findByVariantId(variantId);
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Upload single image' })
  @ApiResponse({ status: 201, description: 'Image created' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateImageDto,
  ) {
    return this.imagesService.create(productId, dto);
  }

  @Post('batch')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiResponse({ status: 201, description: 'Images created' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createMultiple(
    @Param('productId') productId: string,
    @Body() dtos: CreateImageDto[],
  ) {
    return this.imagesService.createMultiple(productId, dtos);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Update image' })
  @ApiResponse({ status: 200, description: 'Image updated' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateImageDto) {
    return this.imagesService.update(id, dto);
  }

  @Patch('reorder')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Reorder images' })
  @ApiResponse({ status: 200, description: 'Images reordered' })
  @ApiResponse({ status: 400, description: 'Invalid image IDs' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async reorder(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.imagesService.reorder(productId, dto);
  }

  @Patch(':id/primary')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Set image as primary' })
  @ApiResponse({ status: 200, description: 'Image set as primary' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async setPrimary(
    @Param('productId') productId: string,
    @Param('id') id: string,
  ) {
    return this.imagesService.setPrimary(productId, id);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Delete image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async delete(@Param('id') id: string) {
    return this.imagesService.delete(id);
  }
}
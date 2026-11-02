import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '@prisma/client';
type MulterFile = Express.Multer.File;

@ApiTags('Uploads')
@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('product-image')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload single product image' })
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadProductImage(
    @UploadedFile() file: MulterFile,
    @Body('productId') productId: string,
    @Body('variantId') variantId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }
    return this.uploadsService.uploadProductImage(file, productId, variantId);
  }

  @Post('product-images')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple product images' })
  @ApiResponse({ status: 201, description: 'Images uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  async uploadProductImages(
    @UploadedFiles() files: MulterFile[],
    @Body('productId') productId: string,
    @Body('variantId') variantId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }
    return this.uploadsService.uploadMultipleProductImages(files, productId, variantId);
  }

  @Delete('product-image')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Delete product image by storage path' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 400, description: 'Storage path required' })
  async deleteProductImage(@Body('storagePath') storagePath: string) {
    if (!storagePath) {
      throw new BadRequestException('Storage path is required');
    }
    await this.uploadsService.deleteImage(storagePath);
    return { message: 'Image deleted successfully' };
  }

  @Delete('product-images')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Delete multiple product images' })
  @ApiResponse({ status: 200, description: 'Images deleted' })
  @ApiResponse({ status: 400, description: 'Storage paths required' })
  async deleteProductImages(@Body('storagePaths') storagePaths: string[]) {
    if (!storagePaths || storagePaths.length === 0) {
      throw new BadRequestException('Storage paths are required');
    }
    await this.uploadsService.deleteMultipleImages(storagePaths);
    return { message: 'Images deleted successfully' };
  }
}
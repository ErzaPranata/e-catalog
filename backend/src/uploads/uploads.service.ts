import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
type MulterFile = Express.Multer.File;

@Injectable()
export class UploadsService {
  private supabase: SupabaseClient;
  private bucket: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private localUploadDir: string;
  private localPublicUrl: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    // Local upload directory fallback
    this.localUploadDir = this.configService.get<string>('LOCAL_UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    this.localPublicUrl = this.configService.get<string>('LOCAL_PUBLIC_URL') || 'http://localhost:3001/uploads';

    if (supabaseUrl && serviceRoleKey) {
      this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }
    // Ensure local upload directory exists
    this.ensureLocalUploadDir();
  }

  private async ensureLocalUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.localUploadDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create local upload directory:', error);
    }
  }

  async uploadProductImage(file: MulterFile, productId: string, variantId?: string): Promise<{
    url: string;
    storagePath: string;
  }> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${ext}`;
    const storagePath = variantId 
      ? `products/${productId}/variants/${variantId}/${filename}`
      : `products/${productId}/${filename}`;

    // Try Supabase first if configured
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (!error && data) {
          const { data: urlData } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(storagePath);

          return {
            url: urlData.publicUrl,
            storagePath: data.path,
          };
        }
        console.warn('Supabase upload failed, falling back to local storage:', error?.message);
      } catch (supabaseError) {
        console.warn('Supabase upload error, falling back to local storage:', supabaseError);
      }
    }

    // Fallback to local storage
    return this.uploadToLocalStorage(file, productId, filename, storagePath, variantId);
  }

  private async uploadToLocalStorage(
    file: MulterFile,
    productId: string,
    filename: string,
    storagePath: string,
    variantId?: string,
  ): Promise<{ url: string; storagePath: string }> {
    const productDir = variantId
      ? path.join(this.localUploadDir, 'products', productId, 'variants', variantId)
      : path.join(this.localUploadDir, 'products', productId);
    await fs.mkdir(productDir, { recursive: true });
    const filePath = path.join(productDir, filename);
    await fs.writeFile(filePath, file.buffer);

    return {
      url: variantId
        ? `${this.localPublicUrl}/products/${productId}/variants/${variantId}/${filename}`
        : `${this.localPublicUrl}/products/${productId}/${filename}`,
      storagePath,
    };
  }

  async uploadMultipleProductImages(
    files: MulterFile[],
    productId: string,
    variantId?: string,
  ): Promise<Array<{ url: string; storagePath: string }>> {
    const results = [];
    for (const file of files) {
      const result = await this.uploadProductImage(file, productId, variantId);
      results.push(result);
    }
    return results;
  }

  async deleteImage(storagePath: string): Promise<void> {
    // Try Supabase first if configured
    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucket)
          .remove([storagePath]);

        if (!error) {
          return;
        }
        console.warn('Supabase delete failed, trying local storage:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase delete error, trying local storage:', supabaseError);
      }
    }

    // Fallback to local storage
    await this.deleteFromLocalStorage(storagePath);
  }

  private async deleteFromLocalStorage(storagePath: string): Promise<void> {
    try {
      const filePath = path.join(this.localUploadDir, storagePath);
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore
      console.warn('Local file delete failed (may not exist):', error);
    }
  }

  async deleteMultipleImages(storagePaths: string[]): Promise<void> {
    // Try Supabase first if configured
    if (this.supabase && storagePaths.length > 0) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucket)
          .remove(storagePaths);

        if (!error) {
          return;
        }
        console.warn('Supabase batch delete failed, trying local storage:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase batch delete error, trying local storage:', supabaseError);
      }
    }

    // Fallback to local storage
    await Promise.all(storagePaths.map((p) => this.deleteFromLocalStorage(p)));
  }

  getPublicUrl(storagePath: string): string {
    if (this.supabase) {
      try {
        const { data } = this.supabase.storage
          .from(this.bucket)
          .getPublicUrl(storagePath);
        return data.publicUrl;
      } catch (error) {
        console.warn('Supabase getPublicUrl failed, using local URL:', error);
      }
    }
    // Fallback to local URL
    return `${this.localPublicUrl}/${storagePath}`;
  }

  private validateFile(file: MulterFile): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${this.maxFileSize / (1024 * 1024)}MB)`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Additional validation: check file signature (magic bytes)
    this.validateFileSignature(file);
  }

  private validateFileSignature(file: MulterFile): void {
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xff, 0xd8, 0xff]],
      'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
      'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
    };

    const expectedSignatures = signatures[file.mimetype];
    if (!expectedSignatures) {
      return; // Skip validation for unknown types
    }

    const buffer = file.buffer;
    const isValid = expectedSignatures.some((sig) =>
      sig.every((byte, index) => buffer[index] === byte),
    );

    if (!isValid) {
      throw new BadRequestException('File content does not match declared type');
    }
  }

  isConfigured(): boolean {
    return !!this.supabase;
  }
}
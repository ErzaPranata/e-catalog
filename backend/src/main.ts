import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  
  // CORS - Allow Vercel frontend
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:5173';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Static files for local uploads (when Supabase not configured)
  const localUploadDir = configService.get<string>('LOCAL_UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(localUploadDir));

  // Global prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Health check endpoint (for load balancers)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger (disable in production if desired)
  if (process.env.NODE_ENV !== 'production' || configService.get('ENABLE_SWAGGER')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-Catalog API')
      .setDescription('Full-stack E-Catalog & Admin Control Panel API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Categories', 'Public category endpoints')
      .addTag('Products', 'Public product endpoints')
      .addTag('Admin Categories', 'Admin category management')
      .addTag('Admin Products', 'Admin product management')
      .addTag('Admin Product Variants', 'Admin product variant management')
      .addTag('Admin Product Images', 'Admin product image management')
      .addTag('Orders', 'Public order endpoints')
      .addTag('Admin Orders', 'Admin order management')
      .addTag('Settings', 'Store settings')
      .addTag('Admin Users', 'Admin user management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
}

bootstrap();
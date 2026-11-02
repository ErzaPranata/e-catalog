import { PrismaClient, AdminRole, OrderStatus, PaymentStatus } from '@prisma/client'; import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default store settings
  const existingSettings = await prisma.storeSetting.findFirst();
  if (!existingSettings) {
    await prisma.storeSetting.create({
      data: {
        storeName: process.env.STORE_DEFAULT_NAME || 'E-Catalog Store',
        whatsappNumber: process.env.STORE_DEFAULT_WHATSAPP || '6281234567890',
        currency: 'IDR',
        storeDescription: 'Selamat datang di toko kami! Temukan produk terbaik dengan harga terjangkau.',
        storeAddress: 'Jl. Contoh No. 123, Jakarta',
        announcement: 'Gratis ongkir untuk pembelian di atas Rp 500.000!',
      },
    });
    console.log('✅ Store settings created');
  } else {
    console.log('ℹ️ Store settings already exist, skipping');
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const adminName = process.env.ADMIN_BOOTSTRAP_NAME || 'Super Admin';

  if (adminEmail && adminPassword) {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await argon2.hash(adminPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      await prisma.adminUser.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: AdminRole.SUPER_ADMIN,
          isActive: true,
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists, skipping');
    }
  } else {
    console.log('⚠️ ADMIN_BOOTSTRAP_EMAIL or ADMIN_BOOTSTRAP_PASSWORD not set, skipping admin creation');
  }

  // Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', sortOrder: 1 },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', sortOrder: 2 },
    { name: 'Home & Living', slug: 'home-living', description: 'Home decor and furniture', sortOrder: 3 },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment and apparel', sortOrder: 4 },
    { name: 'Beauty', slug: 'beauty', description: 'Beauty and personal care products', sortOrder: 5 },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      const created = await prisma.category.create({ data: { ...cat, isActive: true } });
      createdCategories.push(created);
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      createdCategories.push(existing);
      console.log(`ℹ️ Category already exists: ${cat.name}`);
    }
  }

  // Create sample products
  const electronicsCat = createdCategories.find((c) => c.slug === 'electronics');
  const fashionCat = createdCategories.find((c) => c.slug === 'fashion');
  const homeCat = createdCategories.find((c) => c.slug === 'home-living');

  if (electronicsCat) {
    // Product without variants
    const phoneSku = 'PHONE-001';
    const existingPhone = await prisma.product.findUnique({ where: { sku: phoneSku } });
    if (!existingPhone) {
      const phone = await prisma.product.create({
        data: {
          categoryId: electronicsCat.id,
          name: 'Smartphone XYZ Pro',
          slug: 'smartphone-xyz-pro',
          sku: phoneSku,
          description: 'Latest smartphone with 6.7" display, 128GB storage, and 5000mAh battery. Features triple camera system with 64MP main sensor.',
          basePrice: 5999000,
          stock: 50,
          isPublished: true,
        },
      });

      await prisma.productImage.create({
        data: {
          productId: phone.id,
          imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
          altText: 'Smartphone XYZ Pro',
          isPrimary: true,
          sortOrder: 0,
        },
      });
      console.log('✅ Product created: Smartphone XYZ Pro');
    }
  }

  if (fashionCat) {
    // Product with variants
    const shirtSku = 'SHIRT-001';
    const existingShirt = await prisma.product.findUnique({ where: { sku: shirtSku } });
    if (!existingShirt) {
      const shirt = await prisma.product.create({
        data: {
          categoryId: fashionCat.id,
          name: 'Premium Cotton T-Shirt',
          slug: 'premium-cotton-t-shirt',
          sku: shirtSku,
          description: 'High-quality 100% cotton t-shirt available in multiple colors and sizes. Comfortable fit for everyday wear.',
          basePrice: 199000,
          stock: 0, // Stock managed by variants
          isPublished: true,
        },
      });

      // Create variants
      const variants = [
        { name: 'Red - S', sku: 'SHIRT-001-RED-S', price: 199000, stock: 20, attributes: { color: 'Red', size: 'S' } },
        { name: 'Red - M', sku: 'SHIRT-001-RED-M', price: 199000, stock: 30, attributes: { color: 'Red', size: 'M' } },
        { name: 'Red - L', sku: 'SHIRT-001-RED-L', price: 199000, stock: 25, attributes: { color: 'Red', size: 'L' } },
        { name: 'Blue - S', sku: 'SHIRT-001-BLUE-S', price: 199000, stock: 15, attributes: { color: 'Blue', size: 'S' } },
        { name: 'Blue - M', sku: 'SHIRT-001-BLUE-M', price: 199000, stock: 35, attributes: { color: 'Blue', size: 'M' } },
        { name: 'Blue - L', sku: 'SHIRT-001-BLUE-L', price: 199000, stock: 20, attributes: { color: 'Blue', size: 'L' } },
        { name: 'Black - S', sku: 'SHIRT-001-BLACK-S', price: 199000, stock: 25, attributes: { color: 'Black', size: 'S' } },
        { name: 'Black - M', sku: 'SHIRT-001-BLACK-M', price: 199000, stock: 40, attributes: { color: 'Black', size: 'M' } },
        { name: 'Black - L', sku: 'SHIRT-001-BLACK-L', price: 199000, stock: 30, attributes: { color: 'Black', size: 'L' } },
      ];

      for (let i = 0; i < variants.length; i++) {
        await prisma.productVariant.create({
          data: {
            productId: shirt.id,
            ...variants[i],
            isActive: true,
          },
        });
      }

      await prisma.productImage.create({
        data: {
          productId: shirt.id,
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          altText: 'Premium Cotton T-Shirt',
          isPrimary: true,
          sortOrder: 0,
        },
      });
      console.log('✅ Product created: Premium Cotton T-Shirt (with variants)');
    }
  }

  if (homeCat) {
    // Another product without variants
    const lampSku = 'LAMP-001';
    const existingLamp = await prisma.product.findUnique({ where: { sku: lampSku } });
    if (!existingLamp) {
      const lamp = await prisma.product.create({
        data: {
          categoryId: homeCat.id,
          name: 'Modern LED Desk Lamp',
          slug: 'modern-led-desk-lamp',
          sku: lampSku,
          description: 'Adjustable LED desk lamp with touch control, 5 brightness levels, and 3 color temperatures. USB charging port included.',
          basePrice: 349000,
          stock: 30,
          isPublished: true,
        },
      });

      await prisma.productImage.create({
        data: {
          productId: lamp.id,
          imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
          altText: 'Modern LED Desk Lamp',
          isPrimary: true,
          sortOrder: 0,
        },
      });
      console.log('✅ Product created: Modern LED Desk Lamp');
    }
  }

  // Create another product with variants in electronics
  if (electronicsCat) {
    const laptopSku = 'LAPTOP-001';
    const existingLaptop = await prisma.product.findUnique({ where: { sku: laptopSku } });
    if (!existingLaptop) {
      const laptop = await prisma.product.create({
        data: {
          categoryId: electronicsCat.id,
          name: 'Ultrabook Pro 14"',
          slug: 'ultrabook-pro-14',
          sku: laptopSku,
          description: 'Lightweight ultrabook with Intel Core i7, 16GB RAM, 512GB SSD. 14" Full HD display, all-day battery life.',
          basePrice: 12999000,
          stock: 0,
          isPublished: true,
        },
      });

      const laptopVariants = [
        { name: 'Silver - 512GB', sku: 'LAPTOP-001-SILVER-512', price: 12999000, stock: 10, attributes: { color: 'Silver', storage: '512GB' } },
        { name: 'Silver - 1TB', sku: 'LAPTOP-001-SILVER-1TB', price: 14999000, stock: 5, attributes: { color: 'Silver', storage: '1TB' } },
        { name: 'Space Gray - 512GB', sku: 'LAPTOP-001-GRAY-512', price: 12999000, stock: 8, attributes: { color: 'Space Gray', storage: '512GB' } },
        { name: 'Space Gray - 1TB', sku: 'LAPTOP-001-GRAY-1TB', price: 14999000, stock: 3, attributes: { color: 'Space Gray', storage: '1TB' } },
      ];

      for (const variant of laptopVariants) {
        await prisma.productVariant.create({
          data: {
            productId: laptop.id,
            ...variant,
            isActive: true,
          },
        });
      }

      await prisma.productImage.create({
        data: {
          productId: laptop.id,
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          altText: 'Ultrabook Pro 14"',
          isPrimary: true,
          sortOrder: 0,
        },
      });
      console.log('✅ Product created: Ultrabook Pro 14" (with variants)');
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
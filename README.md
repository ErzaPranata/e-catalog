# E-Catalog

Full-stack e-catalog & admin control panel built with React, TypeScript, NestJS, Prisma, and PostgreSQL (Supabase).

## Features

### Customer Facing
- Product catalog with categories, search, filter, and pagination
- Product detail with image gallery and variants
- Shopping cart with localStorage persistence
- Checkout with WhatsApp integration
- Responsive design

### Admin Panel
- Dashboard with statistics
- Category management (CRUD)
- Product management (CRUD, variants, images)
- Order management with status workflow
- Store settings configuration
- Admin user management (Super Admin only)
- JWT-based authentication with role-based access control

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- TanStack Query (React Query)
- Zustand (cart state)
- React Hook Form + Zod
- Lucide React / Heroicons

### Backend
- NestJS 10 + Express
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- JWT Authentication
- Class Validator + Class Transformer
- Swagger/OpenAPI

### Database
- PostgreSQL via Supabase
- UUID primary keys
- Decimal for monetary values
- Proper indexes and constraints

## Project Structure

```
e-catalog/
├── frontend/                 # React application
│   ├── src/
│   │   ├── app/             # App providers, router
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature-based modules
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # API client, utilities
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   └── package.json
├── backend/                  # NestJS application
│   ├── prisma/              # Prisma schema, migrations, seed
│   ├── src/
│   │   ├── common/          # Guards, pipes, filters, decorators
│   │   ├── config/          # Configuration
│   │   ├── prisma/          # Prisma service
│   │   ├── auth/            # Authentication module
│   │   ├── categories/      # Categories module
│   │   ├── products/        # Products module
│   │   ├── product-variants/# Product variants module
│   │   ├── product-images/  # Product images module
│   │   ├── orders/          # Orders module
│   │   ├── checkout/        # Checkout module
│   │   ├── uploads/         # File uploads (Supabase Storage)
│   │   ├── settings/        # Store settings module
│   │   └── admin-users/     # Admin users module
│   └── package.json
├── docs/                    # Documentation
└── package.json             # Root package.json
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database (Supabase recommended)
- Supabase account for storage

### Installation

1. **Install dependencies**
```bash
# Root
pnpm install

# Frontend
cd frontend && pnpm install

# Backend
cd backend && pnpm install
```

2. **Configure environment variables**

Backend (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
DIRECT_URL=postgresql://user:password@host:5432/database?schema=public

JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=product-images

ADMIN_BOOTSTRAP_NAME=Super Admin
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=StrongPassword123!

STORE_DEFAULT_NAME=E-Catalog Store
STORE_DEFAULT_WHATSAPP=6281234567890
```

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_APP_NAME=E-Catalog
```

3. **Setup database**
```bash
cd backend
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend && pnpm start:dev

# Terminal 2 - Frontend
cd frontend && pnpm dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/docs

## Available Scripts

### Root
```bash
pnpm dev:frontend      # Start frontend dev server
pnpm dev:backend       # Start backend dev server
pnpm build             # Build both frontend and backend
pnpm lint              # Lint both projects
pnpm typecheck         # Type check both projects
pnpm test              # Run tests for both projects
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate    # Run migrations
pnpm prisma:seed       # Seed database
pnpm prisma:studio     # Open Prisma Studio
```

### Frontend
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # Lint
pnpm typecheck    # Type check
pnpm test         # Run tests
```

### Backend
```bash
pnpm start:dev    # Start dev server
pnpm build        # Build for production
pnpm start:prod   # Start production server
pnpm lint         # Lint
pnpm typecheck    # Type check
pnpm test         # Run tests
pnpm test:e2e     # Run e2e tests
```

## API Documentation

Swagger UI is available at `/api/docs` when running the backend.

### Main Endpoints

#### Public
- `GET /api/v1/categories` - List categories
- `GET /api/v1/products` - List products (with filters)
- `GET /api/v1/products/:slug` - Get product detail
- `POST /api/v1/orders` - Create order (checkout)

#### Admin (requires authentication)
- `POST /api/v1/auth/login` - Admin login
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/admin/categories` - List categories (admin)
- `POST /api/v1/admin/categories` - Create category
- `PATCH /api/v1/admin/categories/:id` - Update category
- `DELETE /api/v1/admin/categories/:id` - Delete category
- `GET /api/v1/admin/products` - List products (admin)
- `POST /api/v1/admin/products` - Create product
- `PATCH /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product
- `GET /api/v1/admin/products/:id/variants` - List variants
- `POST /api/v1/admin/products/:id/variants` - Create variant
- `GET /api/v1/admin/products/:id/images` - List images
- `POST /api/v1/admin/products/:id/images` - Upload image
- `GET /api/v1/admin/orders` - List orders
- `GET /api/v1/admin/orders/:id` - Get order detail
- `PATCH /api/v1/admin/orders/:id/status` - Update order status
- `PATCH /api/v1/admin/orders/:id/payment-status` - Update payment status
- `GET /api/v1/admin/settings` - Get settings
- `PATCH /api/v1/admin/settings` - Update settings
- `GET /api/v1/admin/users` - List admin users (Super Admin)
- `POST /api/v1/admin/users` - Create admin user (Super Admin)

## Database Schema

Key models:
- **Category** - Product categories
- **Product** - Products with base price and stock
- **ProductVariant** - Product variations (size, color, etc.)
- **ProductImage** - Product images with ordering
- **Order** - Customer orders
- **OrderItem** - Order line items (price snapshots)
- **AdminUser** - Admin accounts with roles
- **StoreSetting** - Store configuration

## Deployment

### Backend
1. Build: `pnpm build`
2. Set production environment variables
3. Run migrations: `pnpm prisma:migrate:prod`
4. Start: `pnpm start:prod`

### Frontend
1. Build: `pnpm build`
2. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)

### Docker
```bash
docker-compose up -d
```

## Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| DIRECT_URL | Direct PostgreSQL connection (for migrations) | Yes |
| JWT_ACCESS_SECRET | Access token secret | Yes |
| JWT_REFRESH_SECRET | Refresh token secret | Yes |
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_ANON_KEY | Supabase anon key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes |
| SUPABASE_STORAGE_BUCKET | Storage bucket name | Yes |
| ADMIN_BOOTSTRAP_EMAIL | Initial admin email | Yes |
| ADMIN_BOOTSTRAP_PASSWORD | Initial admin password | Yes |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |

## Testing

```bash
# Backend unit/integration tests
cd backend && pnpm test

# Backend e2e tests
cd backend && pnpm test:e2e

# Frontend tests
cd frontend && pnpm test
```

## License

MIT
# ============================================
# FRONTEND (Vercel) - frontend/.env.production
# ============================================
# Copy to frontend/.env.production and update with your backend URL

# API Configuration
VITE_API_URL=https://your-backend.vercel.app/api/v1

# App Configuration
VITE_APP_NAME=E-Catalog

# ============================================
# BACKEND (Vercel) - backend/.env.production
# ============================================
# Copy to backend/.env.production and set in Vercel dashboard

# Database (Supabase/PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# Frontend URL (your Vercel frontend domain)
FRONTEND_URL=https://your-frontend.vercel.app

# Supabase (for image storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=product-images

# Admin Bootstrap (first admin user)
ADMIN_BOOTSTRAP_NAME=Super Admin
ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=StrongPassword123!

# Store Defaults
STORE_DEFAULT_NAME=E-Catalog Store
STORE_DEFAULT_WHATSAPP=6281234567890

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Optional: Enable Swagger in production
# ENABLE_SWAGGER=true
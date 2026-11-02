# 🚀 Vercel Deployment Guide (Frontend + Backend)

## Architecture
```
┌─────────────────────┐         ┌─────────────────────┐
│  Frontend (Vercel)  │  ────▶  │  Backend (Vercel)   │
│  React + Vite       │  API    │  NestJS (Serverless)│
└─────────────────────┘         └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │  Supabase           │
                            │  (PostgreSQL +      │
                            │   Storage)          │
                            └─────────────────────┘
```

---

## 1. Prerequisites

- GitHub repository with code
- Supabase project (Database + Storage)
- Vercel account

---

## 2. Supabase Setup

### Create Database
1. Go to [supabase.com](https://supabase.com) → New Project
2. Save: **Project URL**, **Service Role Key**, **Database Password**
3. Get connection strings:
   - `DATABASE_URL` = `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
   - `DIRECT_URL` = same with `?connection_limit=1`

### Create Storage Bucket
1. Storage → New Bucket: `product-images`
2. Make it **Public**
3. Set policies (or use service role key for admin uploads)

---

## 3. Deploy Backend First (to get URL)

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/e-catalog.git
git push -u origin main
```

### Vercel Backend Deploy
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. **Root Directory**: `backend`
4. **Framework Preset**: Other
5. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)
```
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?connection_limit=1
JWT_ACCESS_SECRET=openssl_rand_base64_32
JWT_REFRESH_SECRET=openssl_rand_base64_32
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=product-images
ADMIN_BOOTSTRAP_EMAIL=admin@yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=StrongPassword123!
STORE_DEFAULT_NAME=E-Catalog Store
STORE_DEFAULT_WHATSAPP=6281234567890
```

### Deploy
- Click **Deploy**
- Wait for build to complete
- Copy the **backend URL** (e.g., `https://e-catalog-api.vercel.app`)

### Run Migrations (one-time)
In Vercel Dashboard → Functions → View Logs, or locally:
```bash
# Locally with production DATABASE_URL
cd backend
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

---

## 4. Deploy Frontend

### Vercel Frontend Deploy
1. New Project → Same repo
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### Environment Variables
```
VITE_API_URL=https://your-backend.vercel.app/api/v1
VITE_APP_NAME=E-Catalog
```

### Deploy
- Click **Deploy**
- Done! 🎉

---

## 5. Post-Deploy Checklist

### Test Backend
- [ ] `GET https://your-backend.vercel.app/health` → `{"status":"ok"}`
- [ ] `GET https://your-backend.vercel.app/api/docs` → Swagger UI
- [ ] `POST https://your-backend.vercel.app/api/v1/auth/login` → Admin login works

### Test Frontend
- [ ] Homepage loads
- [ ] Product catalog works
- [ ] Cart/Checkout works
- [ ] `/admin` → Login with bootstrap credentials
- [ ] Admin CRUD works
- [ ] Image upload works (uses Supabase)

### Database
- [ ] Run `prisma migrate deploy` once
- [ ] Seed admin user created
- [ ] Categories/products seeded

---

## 6. Common Issues

### Backend: "Storage not configured"
**Solution:** Add Supabase credentials to Vercel env vars. Local uploads fallback works without it.

### Backend: Prisma Client not found
**Solution:** Ensure `prisma generate` runs in build. Add to `package.json`:
```json
"build": "prisma generate && nest build"
```

### Frontend: API calls fail (CORS)
**Solution:** Set `FRONTEND_URL` in backend env vars to your frontend Vercel URL.

### Images: 404 on upload
**Solution:** 
1. Check Supabase bucket is **Public**
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Local fallback saves to `/uploads` (not persistent on Vercel)

### Database: Connection timeout
**Solution:** Use `DIRECT_URL` with `?connection_limit=1` for serverless.

---

## 7. Environment Variables Reference

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend URL + `/api/v1` |
| `VITE_APP_NAME` | ❌ | App name |

### Backend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Supabase pooled connection |
| `DIRECT_URL` | ✅ | Direct connection for migrations |
| `JWT_ACCESS_SECRET` | ✅ | 32+ char random string |
| `JWT_REFRESH_SECRET` | ✅ | 32+ char random string |
| `NODE_ENV` | ✅ | `production` |
| `FRONTEND_URL` | ✅ | Your frontend Vercel URL |
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `SUPABASE_STORAGE_BUCKET` | ✅ | `product-images` |
| `ADMIN_BOOTSTRAP_EMAIL` | ✅ | First admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | ✅ | Strong password |
| `STORE_DEFAULT_NAME` | ❌ | Store name |
| `STORE_DEFAULT_WHATSAPP` | ❌ | WhatsApp number |

---

## 8. Generate Secrets

```bash
# JWT Secrets (run locally)
openssl rand -base64 32
# Use different values for ACCESS and REFRESH
```

---

## 9. Custom Domains (Optional)

### Frontend
1. Vercel → Project → Settings → Domains
2. Add `yourdomain.com`
3. Configure DNS (CNAME to `cname.vercel-dns.com`)

### Backend
1. Add `api.yourdomain.com`
2. Update `FRONTEND_URL` to use custom domain
3. Update `VITE_API_URL` to `https://api.yourdomain.com/api/v1`

---

## 10. Monitoring

- **Vercel Analytics**: Enable in project settings
- **Supabase Logs**: Dashboard → Logs
- **Error Tracking**: Add Sentry (optional)

---

## 🎯 Quick Commands

```bash
# Local development
cd frontend && npm run dev
cd backend && npm run start:dev

# Production build test
cd frontend && npm run build && npm run preview
cd backend && npm run build && npm run start:prod

# Deploy (after pushing to GitHub)
# Vercel auto-deploys on push to main
```
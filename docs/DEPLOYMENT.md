# 🚀 Deployment Guide

Production deployment procedures for pi-cast.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring](#monitoring)

---

## Prerequisites

### Required Accounts

- [ ] GitHub account with repo access
- [ ] Vercel account (for web hosting)
- [ ] Database hosting (optional)
- [ ] Domain name configured

### Required Tools

- Node.js 20+
- Bun 1.3.10+
- Git

---

## Environment Setup

### Environment Variables

#### Web App (`apps/web/.env.production`)

```env
# Application
NEXT_PUBLIC_API_URL=https://api.pi-cast.com
NEXT_PUBLIC_APP_URL=https://pi-cast.com

# Authentication
NEXT_PUBLIC_BETTER_AUTH_URL=https://api.pi-cast.com

# OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

#### API Server (`packages/hono-server/.env.production`)

```env
# Server
PORT=3001

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=https://api.pi-cast.com

# Trusted Origins
TRUSTED_ORIGINS=https://pi-cast.com,https://api.pi-cast.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Cookies
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

# Database
DATABASE_URL=your-production-database-url

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Web Client URL
WEB_CLIENT_URL=https://pi-cast.com
```

#### Database (`packages/db/.env.production`)

```env
DATABASE_URL=your-production-database-url
```

### Secret Management

**Never commit secrets!** Use:
- Vercel Environment Variables
- GitHub Secrets
- AWS Secrets Manager
- Doppler

---

## Build Process

### 1. Install Dependencies

```bash
bun install --frozen-lockfile
```

### 2. Generate Database Schema

```bash
bun run db:generate
```

### 3. Run Database Migrations

```bash
bun run db:push
```

### 4. Type Check

```bash
bun run typecheck
```

### 5. Lint

```bash
bun run lint
```

### 6. Run Tests

```bash
bun run test
```

### 7. Build

```bash
bun run build
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

#### Web App Deployment

1. Connect GitHub repository to Vercel
2. Configure project:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `bun run build`
   - Output Directory: `.next`

3. Set environment variables in Vercel dashboard

4. Deploy:
   ```bash
   vercel --prod
   ```

#### API Server Deployment

Vercel Serverless Functions:
1. Move API to `apps/web/pages/api`
2. Deploy with web app

Or separate deployment:
1. Deploy to Vercel as separate project
2. Root Directory: `packages/hono-server`

### Option 2: Docker

#### Build Image

```dockerfile
FROM oven/bun:1.3.10 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY . .
RUN bun install --frozen-lockfile

# Build application
FROM install AS build
RUN bun run build

# Production image
FROM base AS release
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000
ENV NODE_ENV=production

CMD ["bun", "run", "apps/web/next.config.mjs"]
```

#### Build and Run

```bash
# Build image
docker build -t pi-cast .

# Run container
docker run -p 3000:3000 --env-file .env.production pi-cast
```

#### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: ghcr.io/tursodatabase/libsql-server:latest
    volumes:
      - db-data:/var/lib/sqlite
    environment:
      - SQLD_NODE=single

volumes:
  db-data:
```

### Option 3: Traditional Server (PM2)

#### Install PM2

```bash
npm install -g pm2
```

#### Create Ecosystem Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pi-cast-web',
    cwd: 'apps/web',
    script: 'bun',
    args: 'run start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }, {
    name: 'pi-cast-api',
    cwd: 'packages/hono-server',
    script: 'bun',
    args: 'run start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
  }],
};
```

#### Start Application

```bash
# Start all apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

#### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart apps
pm2 restart all

# Stop apps
pm2 stop all

# Delete apps
pm2 delete all
```

---

## Post-Deployment

### Database Setup

1. Run migrations:
   ```bash
   bun run db:push
   ```

2. Create indexes:
   ```bash
   bun run db:index
   ```

3. Verify schema:
   ```bash
   bun run db:studio
   ```

### Health Checks

1. API health:
   ```bash
   curl https://api.pi-cast.com/health
   ```

2. Web health:
   ```bash
   curl https://pi-cast.com
   ```

### Smoke Tests

1. Test authentication flow
2. Test lesson creation
3. Test playback functionality
4. Test admin features

---

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel dashboard
2. Select deployment
3. Click "Promote to Production" on previous deployment

### Docker Rollback

```bash
# Pull previous image
docker pull pi-cast:previous-tag

# Stop current container
docker stop pi-cast

# Remove current container
docker rm pi-cast

# Start previous version
docker run -d -p 3000:3000 --name pi-cast pi-cast:previous-tag
```

### PM2 Rollback

```bash
# Checkout previous version
git checkout <previous-commit>

# Rebuild
bun run build

# Restart with zero downtime
pm2 reload all
```

---

## Monitoring

### Application Monitoring

#### Vercel Analytics

- Enable in Vercel dashboard
- View Core Web Vitals
- Monitor function execution times

#### Custom Monitoring

Add logging middleware:
```typescript
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${duration}ms`);
});
```

### Error Tracking

#### Sentry Integration

1. Install Sentry:
   ```bash
   bun add @sentry/nextjs
   ```

2. Configure in `next.config.js`:
   ```javascript
   const { withSentryConfig } = require('@sentry/nextjs');
   ```

3. Set environment variables:
   ```env
   SENTRY_DSN=your-sentry-dsn
   ```

### Database Monitoring

#### Query Performance

Enable slow query logging:
```sql
PRAGMA slow_query_log = ON;
PRAGMA slow_query_threshold = 1000; -- 1 second
```

#### Connection Monitoring

Monitor connection count:
```sql
SELECT COUNT(*) FROM pragma_database_list();
```

### Alerting

#### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Configure alerts for:
- API downtime
- High error rates
- Slow response times

#### Log Alerts

Set up alerts for:
- Authentication failures
- Database errors
- Rate limit exceeded

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Database backups configured

### Post-Deployment

- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] No debug endpoints exposed
- [ ] Error messages don't leak info
- [ ] Session cookies secure

---

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache
bun cache clean
rm -rf node_modules
bun install

# Check Node version
node --version  # Should be 20+

# Check Bun version
bun --version  # Should be 1.3.10+
```

#### Database Connection Fails

- Verify DATABASE_URL format
- Check network connectivity
- Verify database credentials
- Check firewall rules

#### API Returns 500

- Check server logs
- Verify environment variables
- Check database connection
- Review recent changes

---

*Last Updated: March 2026*
*Version: 1.0.0*

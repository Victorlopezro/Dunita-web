# Supabase Integration Guide - Dunita Backend

## Overview

The Dunita backend has been successfully refactored to use **Supabase** as the primary database and API layer. This guide provides setup and deployment instructions.

---

## Architecture

### Database Layer Changes

**Previous:** Drizzle ORM + MySQL2
**Current:** Supabase REST API + PostgreSQL

### Key Modules

1. **`server/_core/supabase.ts`** - Supabase client initialization
2. **`server/db.ts`** - Database operations layer (refactored for Supabase)
3. **`server/_core/env.ts`** - Environment configuration

---

## Environment Setup

### Required Environment Variables

Set these variables in your Railway deployment:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_KEY
```

### Getting Your Credentials

1. **Sign up/Log in** to [Supabase](https://supabase.com)
2. **Create a new project** or use existing one
3. **Go to Project Settings** → API
4. Copy **Project URL** → `SUPABASE_URL`
5. Copy **Service Role Key** (Full access) → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security:** Never expose the service role key in frontend code or logs.

---

## Database Schema Setup

The backend expects these tables in Supabase PostgreSQL:

### 1. **users**
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  lastSignedIn TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2. **instalaciones** (Buildings/Structures)
```sql
CREATE TABLE IF NOT EXISTS instalaciones (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(64) NOT NULL,
  tipo VARCHAR(64) NOT NULL,
  rareza VARCHAR(20) NOT NULL CHECK (rareza IN ('legendario', 'epico', 'raro', 'comun')),
  coste INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  codigo VARCHAR(64) NOT NULL UNIQUE,
  faccion VARCHAR(64),
  medio VARCHAR(64),
  alimentacion VARCHAR(64),
  stats JSONB NOT NULL,
  efectos JSONB NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3. **estructuras_defensa** (Defense Structures)
```sql
CREATE TABLE IF NOT EXISTS estructuras_defensa (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  codigo VARCHAR(64) NOT NULL UNIQUE,
  rareza VARCHAR(20) NOT NULL CHECK (rareza IN ('legendario', 'epico', 'raro', 'comun')),
  coste INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  stats JSONB NOT NULL,
  efectos JSONB NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 4. **objetos** (Items/Objects)
```sql
CREATE TABLE IF NOT EXISTS objetos (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(64) NOT NULL,
  categoria VARCHAR(64) NOT NULL,
  rareza VARCHAR(20) NOT NULL CHECK (rareza IN ('legendario', 'epico', 'raro', 'comun')),
  coste INTEGER NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  imageUrl TEXT NOT NULL,
  efectos JSONB NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 5. **criaturas** (Creatures)
```sql
CREATE TABLE IF NOT EXISTS criaturas (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  nombreComun VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  especie VARCHAR(255) NOT NULL,
  rareza VARCHAR(20) NOT NULL CHECK (rareza IN ('legendario', 'epico', 'raro', 'comun')),
  costeCompra INTEGER NOT NULL,
  costeVenta INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  stats JSONB NOT NULL,
  habilidades JSONB NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Creating Tables in Supabase

1. Go to **Supabase Dashboard** → SQL Editor
2. Create a new query and run each CREATE TABLE statement above
3. Verify tables appear in the **Table Editor**

---

## Database Operations

### All CRUD operations maintain the same interface:

```typescript
// Read operations
getAllInstalaciones(): Promise<Instalacion[]>
getInstalacionById(id: string): Promise<Instalacion | undefined>

// Create
createInstalacion(data: InsertInstalacion): Promise<Instalacion | undefined>

// Update
updateInstalacion(id: string, data: Partial<InsertInstalacion>): Promise<Instalacion | undefined>

// Delete
deleteInstalacion(id: string): Promise<void>
```

### Error Handling

Errors are logged server-side with full details, but generic messages are returned to the client:

```typescript
- "This item already exists" (UNIQUE violation)
- "Referenced item not found" (FK violation)
- "Permission denied" (Row Level Security)
- "Operation failed: [context]" (Generic fallback)
```

---

## Deployment to Railway

### 1. Update Railway Environment

Go to **Railway Dashboard** → Your Project → Variables

Add:
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_KEY
```

### 2. Deploy

```bash
# Commit changes
git add .
git commit -m "refactor: Migrate to Supabase"

# Push to trigger Railway deployment
git push origin main
```

### 3. Verify Deployment

Check Railway logs:
```
Server running on http://localhost:PORT/
```

Test API:
```bash
curl http://your-railway-url/api/trpc/instalaciones.list
```

---

## Security Checklist

✅ Service role key stored in environment variables only
✅ No credentials hardcoded in source code
✅ Error messages don't leak sensitive data
✅ All database operations use service role key (backend only)
✅ Admin-only operations checked in routers
✅ Row Level Security can be enabled in Supabase for user isolation

---

## Monitoring & Debugging

### Check Supabase Logs

1. Go to **Supabase Dashboard** → **Logs** → SQL
2. View all queries executed
3. Monitor performance and errors

### Enable Application Logging

Server logs show all database operations:
```
[Database] Failed to get instalacion: [error details]
[Supabase] Create instalacion: [error details]
```

---

## Migration from MySQL

If migrating from existing MySQL database:

1. Export MySQL data as JSON
2. Transform to match new schema
3. Import to Supabase tables via SQL or API

Example migration script:
```sql
-- Insert users
INSERT INTO users (openId, name, email, loginMethod, role)
SELECT openId, name, email, loginMethod, role FROM legacy_users;

-- Insert instalaciones (adjust field mappings as needed)
INSERT INTO instalaciones (id, nombre, descripcion, ...)
SELECT id, nombre, descripcion, ... FROM legacy_instalaciones;
```

---

## Troubleshooting

### "Supabase not configured"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Verify credentials are correct in Supabase dashboard

### "No rows returned" (PGRST116)
- This is normal for single row queries that return no results
- Handled gracefully by returning `undefined`

### Connection Timeout
- Check Railway network connectivity
- Verify Supabase project is active
- Check firewall rules in Supabase

### JSONB Parse Errors
- Ensure stats/habilidades/efectos are valid JSON
- Use `JSON.stringify()` before sending to database

---

## API Endpoints

All existing tRPC routes work unchanged:

```typescript
/api/trpc/instalaciones.list
/api/trpc/instalaciones.getById
/api/trpc/instalaciones.create
/api/trpc/instalaciones.update
/api/trpc/instalaciones.delete

/api/trpc/estructurasDefensa.*
/api/trpc/objetos.*
/api/trpc/criaturas.*
/api/trpc/auth.*
/api/trpc/system.*
```

---

## Performance Optimization

### Indexes (Optional but Recommended)

```sql
CREATE INDEX idx_users_openId ON users(openId);
CREATE INDEX idx_instalaciones_codigo ON instalaciones(codigo);
CREATE INDEX idx_estructuras_codigo ON estructuras_defensa(codigo);
```

### Row Level Security (Optional)

Enable RLS in Supabase for user-specific data:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalaciones ENABLE ROW LEVEL SECURITY;
```

---

## Support & Next Steps

1. ✅ Installation: Supabase SDK installed
2. ✅ Configuration: Environment variables configured
3. ✅ Integration: Backend refactored to use Supabase
4. 📋 **Next**: Set up Supabase project and database schema
5. 📋 **Then**: Deploy to Railway with environment variables
6. 📋 **Finally**: Test all API endpoints

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Documentation](https://docs.railway.app/)


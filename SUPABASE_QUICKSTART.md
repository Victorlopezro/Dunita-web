# Supabase Setup - Quick Start Guide

## 🚀 Fast Track to Deployment (15 minutes)

### Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Enter project name: `dunita-db`
4. Set strong password
5. Select your region
6. Click **"Create new project"**

**⏳ Wait for initialization (2-3 minutes)**

---

### Step 2: Get Your Credentials (1 min)

Once project is ready:

1. Click **"Reveal"** next to Project URL
2. Copy the URL → Save as `SUPABASE_URL`
3. Go to **Settings** → **API**
4. Under **Project API Keys**, copy **Service Role Key** → Save as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ Keep these credentials safe! Never share publicly.

---

### Step 3: Create Database Tables (3 min)

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Copy-paste this SQL script:

```sql
-- Create all tables with proper schema

CREATE TABLE users (
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

CREATE TABLE instalaciones (
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

CREATE TABLE estructuras_defensa (
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

CREATE TABLE objetos (
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

CREATE TABLE criaturas (
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

-- Create indexes for performance
CREATE INDEX idx_users_openId ON users(openId);
CREATE INDEX idx_instalaciones_codigo ON instalaciones(codigo);
CREATE INDEX idx_estructuras_codigo ON estructuras_defensa(codigo);
```

4. Click **"Run"**
5. Verify all tables appear in **Table Editor** (left sidebar)

---

### Step 4: Update Railway (2 min)

1. Go to Railway dashboard
2. Select your Dunita project
3. Click **Variables**
4. Add these two variables:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_KEY
```

*(Replace with your actual credentials from Step 2)*

5. Click **"Save"** or similar
6. Railway auto-redeploys automatically

---

### Step 5: Verify Deployment (2 min)

Once Railway finishes redeploying:

1. Go to **Logs** in Railway
2. Look for: `Server running on http://localhost:PORT/`
3. Copy your deployment URL
4. Test the API:

```bash
curl "https://YOUR_RAILWAY_URL/api/trpc/instalaciones.list"
```

Should return:
```json
{
  "result": {
    "data": []
  }
}
```

✅ **Success!** Your backend is connected to Supabase.

---

## 🎯 What Just Happened

- ✅ Created PostgreSQL database on Supabase
- ✅ Added 5 game tables (users, instalaciones, estructuras_defensa, objetos, criaturas)
- ✅ Updated Railway environment variables
- ✅ Backend automatically uses Supabase for all database operations

---

## 📊 Testing the API

### Get all items:
```bash
curl "https://YOUR_RAILWAY_URL/api/trpc/instalaciones.list"
curl "https://YOUR_RAILWAY_URL/api/trpc/estructurasDefensa.list"
curl "https://YOUR_RAILWAY_URL/api/trpc/objetos.list"
curl "https://YOUR_RAILWAY_URL/api/trpc/criaturas.list"
```

### View in Supabase Dashboard

1. Go to Supabase **Table Editor**
2. Click on any table
3. See all rows with Supabase's UI

---

## 🔒 Security Checklist

- ✅ Service role key stored only in Railway environment
- ✅ Not hardcoded in source code
- ✅ Not exposed in frontend API responses
- ✅ All server operations protected

---

## ❌ Troubleshooting

### "Cannot connect to Supabase"
→ Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly in Railway

### "Table does not exist"
→ Make sure you ran the SQL script in Step 3 and it completed without errors

### "Permission denied"
→ Check you're using the **Service Role Key**, not the regular API key

### "Connection timeout"
→ Check your Supabase project status in the dashboard (might be sleeping)

---

## 📚 Need More Details?

- Full setup guide: `SUPABASE_INTEGRATION.md`
- Migration summary: `SUPABASE_MIGRATION_SUMMARY.md`
- Code changes: Check modified files listed in summary

---

## ✨ You're Done!

Your Dunita backend is now running on Supabase. 

**Next:** Add game data via:
- Supabase Table Editor (manual)
- API endpoints (if you implement create endpoints)
- Direct SQL inserts

Enjoy! 🎮


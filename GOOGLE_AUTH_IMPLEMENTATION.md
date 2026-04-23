# Implementación de Autenticación Google + 2FA

## ✅ Resumen de Cambios Realizados

Se ha implementado un sistema completo de autenticación con Google/Gmail y autenticación de dos factores (2FA) por correo electrónico.

---

## 📋 Cambios en la Base de Datos

### Migración SQL
- **Archivo**: `drizzle/0002_google_auth_2fa.sql`
- **Cambios**:
  - Agregada columna `googleId` a la tabla `users`
  - Agregada columna `twoFactorEnabled` (boolean) a `users`
  - Agregada columna `twoFactorSecret` a `users`
  - Creada tabla `two_factor_codes` para almacenar códigos 2FA
  - Creada tabla `oauth_sessions` para almacenar sesiones OAuth temporales

### Schema Drizzle
- **Archivo**: `drizzle/schema.ts`
- Agregadas las tablas `twoFactorCodes` y `oauthSessions`
- Actualizadas definiciones de tipos TypeScript

---

## 🔧 Cambios en el Backend

### Funciones de Base de Datos
- **Archivo**: `server/db.ts`
- Nuevas funciones:
  - `generateTwoFactorCode()` - Genera un código de 6 dígitos
  - `verifyTwoFactorCode()` - Verifica la validez del código
  - `getUserByGoogleId()` - Búsqueda por ID de Google
  - `getUserByEmail()` - Búsqueda por email
  - `createOAuthSession()` - Crea una sesión OAuth temporal
  - `getOAuthSession()` - Obtiene una sesión OAuth
  - `deleteOAuthSession()` - Elimina una sesión OAuth

### Router de Autenticación Google
- **Archivo**: `server/_core/googleAuthRouter.ts` (NUEVO)
- Implementa 4 procedimientos TRPC:
  1. **`startGoogleAuth`** - Genera la URL de autenticación de Google
  2. **`googleCallback`** - Maneja el callback de Google OAuth y genera código 2FA
  3. **`verifyTwoFactorAndAuth`** - Verifica el código 2FA y completa el login
  4. **`resendTwoFactorCode`** - Reenvía el código 2FA

### Variables de Entorno
- **Archivo**: `server/_core/env.ts`
- Agregadas variables:
  - `googleClientId`
  - `googleClientSecret`
  - `googleCallbackUri`
  - `emailUser` (Gmail)
  - `emailPassword` (contraseña de app)

### Router Principal
- **Archivo**: `server/routers.ts`
- Integrado `googleAuthRouter` dentro del router `auth`

---

## 🎨 Cambios en el Frontend

### Nuevas Páginas
1. **`client/src/pages/GoogleLoginPage.tsx`** (NUEVO)
   - Página de login con botón de Google Sign-In
   - Gestión de sesiones
   - Manejo de errores

2. **`client/src/pages/TwoFactorVerificationPage.tsx`** (NUEVO)
   - Página de verificación 2FA
   - Input de 6 dígitos con auto-enfoque
   - Botón para reenviar código (con cooldown de 60 segundos)
   - Muestra tiempo de expiración

### Componentes Actualizados
- **`client/src/App.tsx`**
  - Agregado componente `ProtectedRoute` para rutas protegidas
  - Nuevas rutas: `/auth/login` y `/auth/2fa-verify`
  - Página principal `/` ahora requiere autenticación

- **`client/src/const.ts`**
  - `getLoginUrl()` ahora apunta a `/auth/login`
  - Agregada constante `GOOGLE_CLIENT_ID`

---

## 🔐 Flujo de Autenticación

### Registro / Login:
```
1. Usuario accede a /auth/login
2. Hace clic en "Sign in with Google"
3. Se abre ventana de Google para elegir cuenta
4. Backend verifica token JWT de Google
5. Se genera código 2FA y se envía a Gmail
6. Usuario es redirigido a /auth/2fa-verify
7. Ingresa código de 6 dígitos
8. Backend verifica el código
9. Se crea/actualiza usuario en Supabase
10. Se establece cookie de sesión
11. Usuario es redirigido a home (/)
```

---

## ⚙️ Variables de Entorno Necesarias

### Backend (.env en raíz del proyecto)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_CALLBACK_URI=http://localhost:5173/auth/google/callback

# Gmail para 2FA
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Supabase (mantener existentes)
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Frontend (VITE)
```env
VITE_GOOGLE_CLIENT_ID=your_id_here
```

---

## 🚀 Pasos para Usar

### 1. Configurar Google OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto
3. Habilitar "Google+ API"
4. Crear credenciales OAuth 2.0
5. Seleccionar "Web application"
6. Agregar URIs autorizados:
   - `http://localhost:5173/auth/google/callback`
   - `https://tu-dominio.com/auth/google/callback` (producción)
7. Copiar Client ID y Client Secret

### 2. Configurar Gmail para 2FA
1. Usar tu cuenta de Gmail o crear una nueva
2. Si tienes 2FA habilitado:
   - Ir a https://myaccount.google.com/apppasswords
   - Seleccionar "Mail" y "Windows Computer"
   - Generar contraseña de 16 caracteres
   - Usar esto como `EMAIL_PASSWORD`
3. Si NO tienes 2FA:
   - Permitir "Less secure app access" (menos seguro)
   - O usar la contraseña normal

### 3. Actualizar Base de Datos
```bash
npm run db:push
```

### 4. Probar en desarrollo
```bash
npm run dev
```
1. Visitar http://localhost:5173
2. Serás redirigido a /auth/login
3. Hacer clic en botón de Google
4. Seleccionar tu cuenta
5. Recibirás un código en Gmail
6. Ingresar el código en la página de verificación
7. ¡Estás logueado!

---

## 🔒 Características de Seguridad

✅ **Token JWT verificado en servidor**
- Se verifica la firma del token de Google

✅ **Códigos 2FA con expiración**
- Códigos de 6 dígitos
- Expiran en 10 minutos
- Se marcan como usados tras verificación

✅ **Sesiones OAuth temporales**
- Expiran en 15 minutos
- Se limpian automáticamente

✅ **Contraseñas de Google no expuestas**
- Solo se usan en backend
- Protegidas con variables de entorno

✅ **Cookies de sesión seguras**
- HttpOnly
- Secure (en producción)

---

## 📁 Archivos Nuevos y Modificados

### Nuevos:
- `drizzle/0002_google_auth_2fa.sql`
- `server/_core/googleAuthRouter.ts`
- `client/src/pages/GoogleLoginPage.tsx`
- `client/src/pages/TwoFactorVerificationPage.tsx`
- `GOOGLE_AUTH_SETUP.md`
- `.env.example`

### Modificados:
- `drizzle/schema.ts`
- `server/db.ts`
- `server/routers.ts`
- `server/_core/env.ts`
- `client/src/App.tsx`
- `client/src/const.ts`

### Dependencias Instaladas:
- `google-auth-library`
- `nodemailer`

---

## 🐛 Solución de Problemas

### "El código de verificación no se envía"
- Verificar que `EMAIL_USER` y `EMAIL_PASSWORD` son correctos
- Si usas Gmail con 2FA, usar contraseña de app (16 caracteres)
- Revisar carpeta de spam

### "Google Sign-In no aparece"
- Verificar que `VITE_GOOGLE_CLIENT_ID` esté en .env
- Limpiar cache del navegador
- Revisar consola del navegador para errores

### "Session expirada"
- Las sesiones OAuth expiran en 15 minutos
- Volver a intentar el login

### "Código inválido"
- Los códigos expiran en 10 minutos
- Usar botón "Reenviar código"
- Revisar spam

---

## 📚 Documentación Adicional

Ver `GOOGLE_AUTH_SETUP.md` para:
- Instrucciones detalladas de configuración de Google Cloud
- Configuración de Gmail App Passwords
- Pasos específicos de testing
- Troubleshooting avanzado

---

**¡La implementación está completa y lista para usar!** 🎉

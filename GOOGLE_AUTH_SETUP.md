# Google OAuth & 2FA Configuration Guide

## Environment Variables Required

Add the following variables to your `.env` file in the project root:

### Google OAuth Configuration
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URI=http://localhost:5173/auth/google/callback
```

### Frontend Configuration (VITE variables)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Email Configuration (for 2FA codes)
```env
EMAIL_USER=your_gmail_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

### Existing Supabase Configuration
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## How to Set Up Google OAuth

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)
7. Copy your Client ID and Client Secret

### 2. Set Email Configuration for 2FA

Since the app uses Gmail to send 2FA codes:

1. Use your Gmail account or a new one created for the app
2. Enable "Less secure app access" or use an [App Password](https://myaccount.google.com/apppasswords)
3. If using 2-Factor Authentication on your Google account:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Generate a 16-character password
   - Use this password as `EMAIL_PASSWORD`

---

## Database Migrations

Before deploying, run the following migration to add the new tables:

```bash
npm run db:push
```

This will create:
- `two_factor_codes` - Stores 2FA codes and their expiration
- `oauth_sessions` - Temporary storage for OAuth state
- New columns in `users` table: `googleId`, `twoFactorEnabled`, `twoFactorSecret`

---

## Testing the Implementation

1. **Local Development:**
   ```bash
   npm run dev
   ```

2. **Visit the login page:** http://localhost:5173/auth/login

3. **Click "Sign in with Google"**

4. **After selecting your Google account:**
   - A verification code will be sent to your email
   - Enter the 6-digit code on the verification page
   - You'll be logged in and redirected to the home page

---

## Features Implemented

✅ **Google OAuth 2.0 Authentication**
- Sign up with Google (new account)
- Sign in with Google (existing account)
- User data saved to Supabase

✅ **Two-Factor Authentication (2FA)**
- 6-digit code sent to email after Google OAuth
- 10-minute code expiration
- Resend code functionality with 60-second cooldown
- Code marked as used after verification

✅ **Protected Routes**
- Home page and dashboard require authentication
- Automatic redirect to login for unauthenticated users

✅ **User Management**
- New users registered in Supabase
- User profile data (name, email, role) stored
- Last signed-in timestamp tracked

---

## Security Notes

- 🔒 All backend operations use Supabase Service Role Key
- 🔒 2FA codes are time-limited (10 minutes)
- 🔒 OAuth sessions are time-limited (15 minutes)
- 🔒 Codes are marked as used after verification
- 🔒 Google ID tokens are verified server-side

---

## Troubleshooting

**Issue:** "Failed to send email"
- Ensure EMAIL_USER and EMAIL_PASSWORD are correct
- Check Gmail App Passwords if using 2FA
- Verify email account allows "Less secure apps"

**Issue:** "Google Sign-In button not appearing"
- Verify VITE_GOOGLE_CLIENT_ID is set in .env
- Check browser console for errors
- Clear browser cache and reload

**Issue:** "Code invalid or expired"
- Codes expire after 10 minutes
- Use the "Resend Code" button to get a new one
- Check spam folder for the email

**Issue:** "Session expired"
- OAuth sessions expire after 15 minutes of inactivity
- Go back to login and start the process again

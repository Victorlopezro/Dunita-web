export const ENV = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "72399654872-7heh46a7jqdlo9ddogechhgnakldei7d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "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",
  GOOGLE_CALLBACK_URI: process.env.GOOGLE_CALLBACK_URI ?? "https://scmkmhrbdhqohbqjxrei.supabase.co/auth/v1/callback",
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  // Supabase configuration
  supabaseUrl: process.env.SUPABASE_URL ?? "https://scmkmhrbdhqohbqjxrei.supabase.co",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // Legacy database URL (deprecated, kept for backwards compatibility)
  databaseUrl: process.env.DATABASE_URL ?? "https://scmkmhrbdhqohbqjxrei.supabase.co",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google OAuth configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "72399654872-7heh46a7jqdlo9ddogechhgnakldei7d.apps.googleusercontent.com",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "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",
  googleCallbackUri: process.env.GOOGLE_CALLBACK_URI ?? "https://scmkmhrbdhqohbqjxrei.supabase.co/auth/v1/callback",
  // Email configuration for 2FA
  emailUser: process.env.EMAIL_USER ?? "",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
};

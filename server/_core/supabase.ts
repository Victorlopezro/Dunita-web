import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

/**
 * Supabase Client Module
 * 
 * SECURITY: Uses service role key for backend operations only.
 * Never expose credentials in frontend responses.
 * All database operations should go through this module.
 */

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize and get the Supabase client.
 * Uses service role key for admin operations.
 * 
 * @throws Error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  supabaseClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Safe error handler for Supabase operations.
 * Logs detailed errors server-side but returns generic errors to client.
 * 
 * @param error - The error from Supabase
 * @param context - Context string for logging
 * @returns Safe error message to return to client
 */
export function handleSupabaseError(error: unknown, context: string): string {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // Log detailed error server-side only
  console.error(`[Supabase] ${context}:`, errorMsg);

  // Return generic error to client (don't leak details)
  if (errorMsg.includes("UNIQUE violation")) {
    return "This item already exists";
  }
  if (errorMsg.includes("violates foreign key")) {
    return "Referenced item not found";
  }
  if (errorMsg.includes("permission denied")) {
    return "Permission denied";
  }
  
  // Generic fallback
  return `Operation failed: ${context}`;
}

/**
 * Ensure database is available.
 * @returns true if Supabase is configured, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  return !!(ENV.supabaseUrl && ENV.supabaseServiceRoleKey);
}

export default getSupabaseClient;

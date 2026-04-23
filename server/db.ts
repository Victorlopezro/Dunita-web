import { getSupabaseClient, handleSupabaseError, isSupabaseConfigured } from "./_core/supabase";
import { ENV } from "./_core/env";
import {
  InsertUser,
  InsertInstalacion,
  InsertEstructuraDefensa,
  InsertObjeto,
  InsertCriatura,
  User,
  Instalacion,
  EstructuraDefensa,
  Objeto,
  Criatura,
} from "../drizzle/schema";

/**
 * Database Layer Module - Refactored for Supabase
 * 
 * IMPORTANT: This module uses Supabase service role key for backend operations.
 * All functions are async and handle errors gracefully.
 * 
 * Migration notes:
 * - Replaced Drizzle ORM with Supabase REST API
 * - Maintained all existing function signatures for compatibility
 * - Added comprehensive error handling
 * - All operations are server-side only (service role key)
 */

/**
 * Table name constants
 */
const TABLES = {
  USERS: "users",
  INSTALACIONES: "instalaciones",
  ESTRUCTURAS_DEFENSA: "estructuras_defensa",
  OBJETOS: "objetos",
  CRIATURAS: "criaturas",
} as const;

/**
 * Check if database is available
 */
export async function getDb(): Promise<boolean> {
  return isSupabaseConfigured();
}

// ============================================================
// USER OPERATIONS
// ============================================================

/**
 * Upsert user - creates or updates based on openId
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot upsert user: Supabase not configured");
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const timestamp = new Date();

    // Prepare user data
    const userData: any = {
      openId: user.openId,
      lastSignedIn: timestamp,
    };

    // Optional profile fields
    if (user.name !== undefined) userData.name = user.name ?? null;
    if (user.email !== undefined) userData.email = user.email ?? null;
    if (user.loginMethod !== undefined) userData.loginMethod = user.loginMethod ?? null;
    if ((user as any).nickname !== undefined) userData.nickname = (user as any).nickname ?? null;
    if ((user as any).passwordHash !== undefined) userData.passwordHash = (user as any).passwordHash ?? null;
    if ((user as any).birthDate !== undefined) userData.birthDate = (user as any).birthDate ?? null;
    if ((user as any).googleId !== undefined) userData.googleId = (user as any).googleId ?? null;

    // Set role
    if (user.role !== undefined) {
      userData.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      userData.role = "admin";
    } else {
      userData.role = "user";
    }

    // Try to get existing user
    const { data: existing } = await supabase
      .from(TABLES.USERS)
      .select("id")
      .eq("openId", user.openId)
      .single();

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from(TABLES.USERS)
        .update(userData)
        .eq("openId", user.openId);

      if (error) throw error;
    } else {
      // Insert new user
      const { error } = await supabase.from(TABLES.USERS).insert([userData]);

      if (error) throw error;
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by nickname
 */
export async function getUserByNickname(nickname: string): Promise<User | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get user: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("*")
      .eq("nickname", nickname)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as User | undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by nickname:", error);
    return undefined;
  }
}

/**
 * Get user by openId
 */
export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get user: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("*")
      .eq("openId", openId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is expected
      throw error;
    }

    return data as User | undefined;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return undefined;
  }
}

// ============================================================
// INSTALACIONES (Buildings/Structures)
// ============================================================

/**
 * Get all instalaciones
 */
export async function getAllInstalaciones(): Promise<Instalacion[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get instalaciones: Supabase not configured");
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(TABLES.INSTALACIONES).select("*");

    if (error) throw error;

    return (data as Instalacion[]) || [];
  } catch (error) {
    console.error("[Database] Failed to get all instalaciones:", error);
    return [];
  }
}

/**
 * Get instalacion by id
 */
export async function getInstalacionById(id: string): Promise<Instalacion | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get instalacion: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.INSTALACIONES)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as Instalacion | undefined;
  } catch (error) {
    console.error("[Database] Failed to get instalacion:", error);
    return undefined;
  }
}

/**
 * Create instalacion
 */
export async function createInstalacion(data: InsertInstalacion): Promise<Instalacion | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.INSTALACIONES).insert([data]);

    if (error) throw error;

    return getInstalacionById(data.id);
  } catch (error) {
    console.error("[Database] Failed to create instalacion:", error);
    throw new Error(handleSupabaseError(error, "Create instalacion"));
  }
}

/**
 * Update instalacion
 */
export async function updateInstalacion(
  id: string,
  data: Partial<InsertInstalacion>
): Promise<Instalacion | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.INSTALACIONES)
      .update(data)
      .eq("id", id);

    if (error) throw error;

    return getInstalacionById(id);
  } catch (error) {
    console.error("[Database] Failed to update instalacion:", error);
    throw new Error(handleSupabaseError(error, "Update instalacion"));
  }
}

/**
 * Delete instalacion
 */
export async function deleteInstalacion(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.INSTALACIONES).delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("[Database] Failed to delete instalacion:", error);
    throw new Error(handleSupabaseError(error, "Delete instalacion"));
  }
}

// ============================================================
// ESTRUCTURAS DE DEFENSA (Defense Structures)
// ============================================================

/**
 * Get all estructuras de defensa
 */
export async function getAllEstructurasDefensa(): Promise<EstructuraDefensa[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get estructuras defensa: Supabase not configured");
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(TABLES.ESTRUCTURAS_DEFENSA).select("*");

    if (error) throw error;

    return (data as EstructuraDefensa[]) || [];
  } catch (error) {
    console.error("[Database] Failed to get all estructuras defensa:", error);
    return [];
  }
}

/**
 * Get estructura defensa by id
 */
export async function getEstructuraDefensaById(id: string): Promise<EstructuraDefensa | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get estructura defensa: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.ESTRUCTURAS_DEFENSA)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as EstructuraDefensa | undefined;
  } catch (error) {
    console.error("[Database] Failed to get estructura defensa:", error);
    return undefined;
  }
}

/**
 * Create estructura defensa
 */
export async function createEstructuraDefensa(
  data: InsertEstructuraDefensa
): Promise<EstructuraDefensa | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.ESTRUCTURAS_DEFENSA).insert([data]);

    if (error) throw error;

    return getEstructuraDefensaById(data.id);
  } catch (error) {
    console.error("[Database] Failed to create estructura defensa:", error);
    throw new Error(handleSupabaseError(error, "Create estructura defensa"));
  }
}

/**
 * Update estructura defensa
 */
export async function updateEstructuraDefensa(
  id: string,
  data: Partial<InsertEstructuraDefensa>
): Promise<EstructuraDefensa | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.ESTRUCTURAS_DEFENSA)
      .update(data)
      .eq("id", id);

    if (error) throw error;

    return getEstructuraDefensaById(id);
  } catch (error) {
    console.error("[Database] Failed to update estructura defensa:", error);
    throw new Error(handleSupabaseError(error, "Update estructura defensa"));
  }
}

/**
 * Delete estructura defensa
 */
export async function deleteEstructuraDefensa(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(TABLES.ESTRUCTURAS_DEFENSA)
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("[Database] Failed to delete estructura defensa:", error);
    throw new Error(handleSupabaseError(error, "Delete estructura defensa"));
  }
}

// ============================================================
// OBJETOS (Items/Objects)
// ============================================================

/**
 * Get all objetos
 */
export async function getAllObjetos(): Promise<Objeto[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get objetos: Supabase not configured");
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(TABLES.OBJETOS).select("*");

    if (error) throw error;

    return (data as Objeto[]) || [];
  } catch (error) {
    console.error("[Database] Failed to get all objetos:", error);
    return [];
  }
}

/**
 * Get objeto by id
 */
export async function getObjetoById(id: string): Promise<Objeto | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get objeto: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.OBJETOS)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as Objeto | undefined;
  } catch (error) {
    console.error("[Database] Failed to get objeto:", error);
    return undefined;
  }
}

/**
 * Create objeto
 */
export async function createObjeto(data: InsertObjeto): Promise<Objeto | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.OBJETOS).insert([data]);

    if (error) throw error;

    return getObjetoById(data.id);
  } catch (error) {
    console.error("[Database] Failed to create objeto:", error);
    throw new Error(handleSupabaseError(error, "Create objeto"));
  }
}

/**
 * Update objeto
 */
export async function updateObjeto(
  id: string,
  data: Partial<InsertObjeto>
): Promise<Objeto | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.OBJETOS).update(data).eq("id", id);

    if (error) throw error;

    return getObjetoById(id);
  } catch (error) {
    console.error("[Database] Failed to update objeto:", error);
    throw new Error(handleSupabaseError(error, "Update objeto"));
  }
}

/**
 * Delete objeto
 */
export async function deleteObjeto(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.OBJETOS).delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("[Database] Failed to delete objeto:", error);
    throw new Error(handleSupabaseError(error, "Delete objeto"));
  }
}

// ============================================================
// CRIATURAS (Creatures)
// ============================================================

/**
 * Get all criaturas
 */
export async function getAllCriaturas(): Promise<Criatura[]> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get criaturas: Supabase not configured");
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from(TABLES.CRIATURAS).select("*");

    if (error) throw error;

    return (data as Criatura[]) || [];
  } catch (error) {
    console.error("[Database] Failed to get all criaturas:", error);
    return [];
  }
}

/**
 * Get criatura by id
 */
export async function getCriaturaById(id: string): Promise<Criatura | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get criatura: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.CRIATURAS)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as Criatura | undefined;
  } catch (error) {
    console.error("[Database] Failed to get criatura:", error);
    return undefined;
  }
}

/**
 * Create criatura
 */
export async function createCriatura(data: InsertCriatura): Promise<Criatura | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.CRIATURAS).insert([data]);

    if (error) throw error;

    return getCriaturaById(data.id);
  } catch (error) {
    console.error("[Database] Failed to create criatura:", error);
    throw new Error(handleSupabaseError(error, "Create criatura"));
  }
}

/**
 * Update criatura
 */
export async function updateCriatura(
  id: string,
  data: Partial<InsertCriatura>
): Promise<Criatura | undefined> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.CRIATURAS).update(data).eq("id", id);

    if (error) throw error;

    return getCriaturaById(id);
  } catch (error) {
    console.error("[Database] Failed to update criatura:", error);
    throw new Error(handleSupabaseError(error, "Update criatura"));
  }
}

/**
 * Delete criatura
 */
export async function deleteCriatura(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(TABLES.CRIATURAS).delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("[Database] Failed to delete criatura:", error);
    throw new Error(handleSupabaseError(error, "Delete criatura"));
  }
}

// ============================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================

/**
 * Generate and store 2FA code for user
 */
export async function generateTwoFactorCode(userId: number, email: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error } = await supabase.from("two_factor_codes").insert([
      {
        userId,
        code,
        email,
        expiresAt,
        used: false,
      },
    ]);

    if (error) throw error;

    return code;
  } catch (error) {
    console.error("[Database] Failed to generate 2FA code:", error);
    throw new Error(handleSupabaseError(error, "Generate 2FA code"));
  }
}

/**
 * Verify 2FA code
 */
export async function verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("two_factor_codes")
      .select("*")
      .eq("userId", userId)
      .eq("code", code)
      .eq("used", false)
      .gt("expiresAt", new Date())
      .single();

    if (error || !data) {
      return false;
    }

    // Mark code as used
    await supabase.from("two_factor_codes").update({ used: true }).eq("id", data.id);

    return true;
  } catch (error) {
    console.error("[Database] Failed to verify 2FA code:", error);
    return false;
  }
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get user: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("*")
      .eq("googleId", googleId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as User | undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by googleId:", error);
    return undefined;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!isSupabaseConfigured()) {
    console.warn("[Database] Cannot get user: Supabase not configured");
    return undefined;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data as User | undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by email:", error);
    return undefined;
  }
}

/**
 * Create OAuth session for temporary storage
 */
export async function createOAuthSession(
  googleIdToken: string,
  email: string,
  name: string | undefined,
  googleId: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  try {
    const supabase = getSupabaseClient();
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { error } = await supabase.from("oauth_sessions").insert([
      {
        id: sessionId,
        googleIdToken,
        email,
        name: name || null,
        googleId,
        expiresAt,
      },
    ]);

    if (error) throw error;

    return sessionId;
  } catch (error) {
    console.error("[Database] Failed to create OAuth session:", error);
    throw new Error(handleSupabaseError(error, "Create OAuth session"));
  }
}

/**
 * Get OAuth session
 */
export async function getOAuthSession(sessionId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("oauth_sessions")
      .select("*")
      .eq("id", sessionId)
      .gt("expiresAt", new Date())
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("[Database] Failed to get OAuth session:", error);
    return null;
  }
}

/**
 * Delete OAuth session
 */
export async function deleteOAuthSession(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const supabase = getSupabaseClient();
    await supabase.from("oauth_sessions").delete().eq("id", sessionId);
  } catch (error) {
    console.error("[Database] Failed to delete OAuth session:", error);
  }
}

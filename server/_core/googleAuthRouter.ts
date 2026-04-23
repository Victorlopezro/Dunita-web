import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { publicProcedure, router, protectedProcedure } from "./trpc";
import { z } from "zod";
import * as db from "../db";
import { OAuth2Client } from "google-auth-library";
import { ENV } from "./env";
import nodemailer from "nodemailer";

/**
 * Google Auth OAuth2 Client
 */
const googleOAuth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_CALLBACK_URI || "",
});

/**
 * Email transporter for 2FA codes
 */
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

/**
 * Send 2FA code via email
 */
async function sendTwoFactorCodeEmail(email: string, code: string): Promise<void> {
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Tu código de verificación - Dune Dominion",
      html: `
        <h2>Código de Verificación</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; font-weight: bold;">${code}</h1>
        <p>Este código expira en 10 minutos.</p>
        <p>Si no solicitaste este código, ignora este mensaje.</p>
      `,
    });
  } catch (error) {
    console.error("[Auth] Failed to send 2FA email:", error);
    throw new Error("No se pudo enviar el código de verificación");
  }
}

export const googleAuthRouter = router({
  /**
   * Start Google OAuth flow
   */
  startGoogleAuth: publicProcedure
    .input(
      z.object({
        redirectUri: z.string().url(),
      })
    )
    .query(({ input }) => {
      try {
        const authUrl = googleOAuth2Client.generateAuthUrl({
          access_type: "offline",
          scope: ["profile", "email"],
          redirect_uri: input.redirectUri,
        });

        return { authUrl };
      } catch (error) {
        console.error("[Auth] Failed to generate auth URL:", error);
        throw new Error("No se pudo iniciar el flujo de autenticación");
      }
    }),

  /**
   * Callback from Google OAuth
   */
  googleCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Exchange code for tokens
        const { tokens } = await googleOAuth2Client.getToken({
          code: input.code,
          redirect_uri: input.redirectUri,
        });

        // Get user info from Google
        const ticket = await googleOAuth2Client.verifyIdToken({
          idToken: tokens.id_token!,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Invalid Google token payload");
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;

        // Check if user already exists
        let user = await db.getUserByGoogleId(googleId);

        if (!user) {
          // Check if email is already registered
          const existingUser = await db.getUserByEmail(email!);
          if (existingUser) {
            throw new Error("Este email ya está registrado");
          }
        }

        // Create OAuth session for 2FA
        const sessionId = await db.createOAuthSession(
          tokens.id_token!,
          email!,
          name,
          googleId
        );

        // Generate and send 2FA code
        const tempUserId = user?.id || -1; // Use -1 for new users
        const code = await db.generateTwoFactorCode(tempUserId, email!);
        await sendTwoFactorCodeEmail(email!, code);

        return {
          sessionId,
          email,
          isNewUser: !user,
          requiresTwoFactor: true,
        };
      } catch (error) {
        console.error("[Auth] Google callback error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Error en la autenticación de Google"
        );
      }
    }),

  /**
   * Verify 2FA code and complete login/registration
   */
  verifyTwoFactorAndAuth: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        code: z.string().min(6).max(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get OAuth session
        const session = await db.getOAuthSession(input.sessionId);
        if (!session) {
          throw new Error("Sesión expirada");
        }

        // Check if user exists
        let user = await db.getUserByGoogleId(session.googleId);

        if (!user) {
          // New user - verify 2FA code for new user
          // Create temporary verification - we'll use email-based approach
          const existingUser = await db.getUserByEmail(session.email);
          if (existingUser) {
            throw new Error("Este email ya está registrado");
          }

          // Generate a unique openId for new user
          const newOpenId = `google_${session.googleId}`;

          // Create new user
          await db.upsertUser({
            openId: newOpenId,
            googleId: session.googleId,
            email: session.email,
            name: session.name || undefined,
            loginMethod: "google",
            role: "user",
          });

          // Get the newly created user
          user = await db.getUserByGoogleId(session.googleId);
          if (!user) {
            throw new Error("No se pudo crear la cuenta");
          }
        }

        // Verify 2FA code
        const isValidCode = await db.verifyTwoFactorCode(user.id, input.code);
        if (!isValidCode) {
          throw new Error("Código de verificación inválido o expirado");
        }

        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          googleId: user.googleId || undefined,
          email: user.email || undefined,
          name: user.name || undefined,
          loginMethod: user.loginMethod || undefined,
          role: user.role,
        });

        // Clean up OAuth session
        await db.deleteOAuthSession(input.sessionId);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.openId, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        console.error("[Auth] 2FA verification error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Error en la verificación"
        );
      }
    }),

  /**
   * Resend 2FA code
   */
  resendTwoFactorCode: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get OAuth session
        const session = await db.getOAuthSession(input.sessionId);
        if (!session) {
          throw new Error("Sesión expirada");
        }

        // Generate new code
        const tempUserId = -1; // Temporary ID for new users
        const code = await db.generateTwoFactorCode(tempUserId, session.email);

        // Send via email
        await sendTwoFactorCodeEmail(session.email, code);

        return { success: true };
      } catch (error) {
        console.error("[Auth] Resend 2FA code error:", error);
        throw new Error(
          error instanceof Error ? error.message : "Error al reenenviar el código"
        );
      }
    }),
});

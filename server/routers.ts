import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { googleAuthRouter } from "./_core/googleAuthRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Create combined auth router
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
  google: googleAuthRouter,
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,

  // ============================================================
  // INSTALACIONES (Buildings) API
  // ============================================================
  instalaciones: router({
    list: publicProcedure.query(() => db.getAllInstalaciones()),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => db.getInstalacionById(input.id)),
    create: protectedProcedure.input(z.object({
      id: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      categoria: z.string(),
      tipo: z.string(),
      rareza: z.enum(["legendario", "epico", "raro", "comun"]),
      coste: z.number(),
      imageUrl: z.string(),
      codigo: z.string(),
      faccion: z.string().optional(),
      medio: z.string().optional(),
      alimentacion: z.string().optional(),
      stats: z.object({ seguridad: z.number(), capacidad: z.number(), ingresos: z.number(), mantenimiento: z.number() }),
      efectos: z.array(z.string()),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can create items");
      return db.createInstalacion(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(),
      data: z.object({
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        coste: z.number().optional(),
        imageUrl: z.string().optional(),
        stats: z.object({ seguridad: z.number(), capacidad: z.number(), ingresos: z.number(), mantenimiento: z.number() }).optional(),
        efectos: z.array(z.string()).optional(),
      }),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can update items");
      return db.updateInstalacion(input.id, input.data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can delete items");
      return db.deleteInstalacion(input.id);
    }),
  }),

  // ============================================================
  // ESTRUCTURAS DE DEFENSA (Defense Structures) API
  // ============================================================
  estructurasDefensa: router({
    list: publicProcedure.query(() => db.getAllEstructurasDefensa()),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => db.getEstructuraDefensaById(input.id)),
    create: protectedProcedure.input(z.object({
      id: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      codigo: z.string(),
      rareza: z.enum(["legendario", "epico", "raro", "comun"]),
      coste: z.number(),
      imageUrl: z.string(),
      stats: z.object({ defensa: z.number(), durabilidad: z.number() }),
      efectos: z.array(z.string()),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can create items");
      return db.createEstructuraDefensa(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(),
      data: z.object({
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        coste: z.number().optional(),
        imageUrl: z.string().optional(),
        stats: z.object({ defensa: z.number(), durabilidad: z.number() }).optional(),
        efectos: z.array(z.string()).optional(),
      }),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can update items");
      return db.updateEstructuraDefensa(input.id, input.data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can delete items");
      return db.deleteEstructuraDefensa(input.id);
    }),
  }),

  // ============================================================
  // OBJETOS (Items) API
  // ============================================================
  objetos: router({
    list: publicProcedure.query(() => db.getAllObjetos()),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => db.getObjetoById(input.id)),
    create: protectedProcedure.input(z.object({
      id: z.string(),
      nombre: z.string(),
      descripcion: z.string(),
      tipo: z.string(),
      categoria: z.string(),
      rareza: z.enum(["legendario", "epico", "raro", "comun"]),
      coste: z.number(),
      cantidad: z.number().default(1),
      imageUrl: z.string(),
      efectos: z.array(z.string()),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can create items");
      return db.createObjeto(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(),
      data: z.object({
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        coste: z.number().optional(),
        cantidad: z.number().optional(),
        imageUrl: z.string().optional(),
        efectos: z.array(z.string()).optional(),
      }),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can update items");
      return db.updateObjeto(input.id, input.data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can delete items");
      return db.deleteObjeto(input.id);
    }),
  }),

  // ============================================================
  // CRIATURAS (Creatures) API
  // ============================================================
  criaturas: router({
    list: publicProcedure.query(() => db.getAllCriaturas()),
    getById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => db.getCriaturaById(input.id)),
    create: protectedProcedure.input(z.object({
      id: z.string(),
      nombre: z.string(),
      nombreComun: z.string(),
      descripcion: z.string(),
      especie: z.string(),
      rareza: z.enum(["legendario", "epico", "raro", "comun"]),
      costeCompra: z.number(),
      costeVenta: z.number(),
      imageUrl: z.string(),
      stats: z.object({ ataque: z.number(), defensa: z.number(), velocidad: z.number(), resistencia: z.number() }),
      habilidades: z.array(z.string()),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can create items");
      return db.createCriatura(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.string(),
      data: z.object({
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        costeCompra: z.number().optional(),
        costeVenta: z.number().optional(),
        imageUrl: z.string().optional(),
        stats: z.object({ ataque: z.number(), defensa: z.number(), velocidad: z.number(), resistencia: z.number() }).optional(),
        habilidades: z.array(z.string()).optional(),
      }),
    })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can update items");
      return db.updateCriatura(input.id, input.data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can delete items");
      return db.deleteCriatura(input.id);
    }),
  }),

  // ============================================================
  // GAME STATS API
  // ============================================================
  stats: router({
    summary: publicProcedure.query(async () => {
      const [instalaciones, estructuras, objetos, criaturas] = await Promise.all([
        db.getAllInstalaciones(),
        db.getAllEstructurasDefensa(),
        db.getAllObjetos(),
        db.getAllCriaturas(),
      ]);

      return {
        totalInstalaciones: instalaciones.length,
        totalEstructuras: estructuras.length,
        totalObjetos: objetos.length,
        totalCriaturas: criaturas.length,
        totalItems: instalaciones.length + estructuras.length + objetos.length + criaturas.length,
        rarezaDistribution: {
          legendario: [
            ...instalaciones.filter(i => i.rareza === "legendario"),
            ...estructuras.filter(e => e.rareza === "legendario"),
            ...objetos.filter(o => o.rareza === "legendario"),
            ...criaturas.filter(c => c.rareza === "legendario"),
          ].length,
          epico: [
            ...instalaciones.filter(i => i.rareza === "epico"),
            ...estructuras.filter(e => e.rareza === "epico"),
            ...objetos.filter(o => o.rareza === "epico"),
            ...criaturas.filter(c => c.rareza === "epico"),
          ].length,
          raro: [
            ...instalaciones.filter(i => i.rareza === "raro"),
            ...estructuras.filter(e => e.rareza === "raro"),
            ...objetos.filter(o => o.rareza === "raro"),
            ...criaturas.filter(c => c.rareza === "raro"),
          ].length,
          comun: [
            ...instalaciones.filter(i => i.rareza === "comun"),
            ...estructuras.filter(e => e.rareza === "comun"),
            ...objetos.filter(o => o.rareza === "comun"),
            ...criaturas.filter(c => c.rareza === "comun"),
          ].length,
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

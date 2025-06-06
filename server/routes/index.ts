import type { Express } from "express";
import { createServer } from "http";
import { registerUserRoutes } from './userRoutes';
import { registerItemRoutes } from './itemRoutes';
import { registerPaymentRoutes } from './paymentRoutes';
import { registerComponentRoutes } from './componentRoutes';

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Register all route modules (webhooks are registered separately before JSON middleware)
  await registerUserRoutes(app);
  await registerItemRoutes(app);
  await registerPaymentRoutes(app);
  await registerComponentRoutes(app);

  return server;
}
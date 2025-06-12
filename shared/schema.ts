import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SubscriptionType = {
  FREE: "free",
  PRO: "pro"
} as const;

export type SubscriptionType = typeof SubscriptionType[keyof typeof SubscriptionType];

// Quality scoring interfaces
export interface ComponentQualityScore {
  codeQuality: number;        // TypeScript compliance, best practices (0-100)
  accessibility: number;     // WCAG compliance score (0-100)
  designConsistency: number; // shadcn/ui pattern adherence (0-100)
  performance: number;       // Bundle size, render optimization (0-100)
  overall: number;           // Weighted average (0-100)
}

export interface ValidationError {
  type: 'typescript' | 'eslint' | 'accessibility' | 'runtime';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

export const users = pgTable("users", {
  firebaseId: text("firebase_id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  isPremium: boolean("is_premium").notNull().default(false),
  subscriptionType: text("subscription_type", { enum: ["free", "pro"] }).notNull().default("free"),
  emailNotifications: boolean("email_notifications").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  item: text("item").notNull(),
  userId: text("user_id").notNull().references(() => users.firebaseId),
});

export const components = pgTable("components", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  prompt: text("prompt").notNull(),
  screenshot: text("screenshot"), // URL string for the screenshot
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  version: integer("version").notNull().default(1),
  userId: text("user_id").notNull().references(() => users.firebaseId),
  // Quality tracking fields
  qualityScore: jsonb("quality_score"), // ComponentQualityScore interface
  userRating: integer("user_rating"), // 1-5 star rating
  validationErrors: jsonb("validation_errors"), // TypeScript/ESLint errors
  accessibilityScore: integer("accessibility_score"), // WCAG compliance score (0-100)
});

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  components: many(components),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.firebaseId],
  }),
}));

export const componentsRelations = relations(components, ({ one }) => ({
  user: one(users, {
    fields: [components.userId],
    references: [users.firebaseId],
  }),
}));

export const insertUserSchema = createInsertSchema(users, {
  firebaseId: z.string(),
  email: z.string().email(),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postalCode: z.string().default(""),
  isPremium: z.boolean().default(false),
  subscriptionType: z.enum(["free", "pro"]).default("free"),
  emailNotifications: z.boolean().default(false),
});

export const insertItemSchema = createInsertSchema(items, {
  userId: z.string(),
  item: z.string(),
});

// Zod schemas for quality tracking
export const componentQualityScoreSchema = z.object({
  codeQuality: z.number().min(0).max(100),
  accessibility: z.number().min(0).max(100),
  designConsistency: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
});

export const validationErrorSchema = z.object({
  type: z.enum(['typescript', 'eslint', 'accessibility', 'runtime']),
  message: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  severity: z.enum(['error', 'warning', 'info']),
});

export const insertComponentSchema = createInsertSchema(components, {
  id: z.string(),
  name: z.string().min(1, "Component name is required"),
  description: z.string().min(1, "Component description is required"),
  code: z.string().min(1, "Component code is required"),
  prompt: z.string().min(1, "Component prompt is required"),
  screenshot: z.string().optional(),
  version: z.number().int().positive().default(1),
  userId: z.string(),
  qualityScore: componentQualityScoreSchema.optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  validationErrors: z.array(validationErrorSchema).optional(),
  accessibilityScore: z.number().int().min(0).max(100).optional(),
});

export const updateComponentSchema = createInsertSchema(components, {
  name: z.string().min(1, "Component name is required").optional(),
  description: z.string().min(1, "Component description is required").optional(),
  code: z.string().min(1, "Component code is required").optional(),
  prompt: z.string().min(1, "Component prompt is required").optional(),
  screenshot: z.string().optional(),
  version: z.number().int().positive().optional(),
  qualityScore: componentQualityScoreSchema.optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  validationErrors: z.array(validationErrorSchema).optional(),
  accessibilityScore: z.number().int().min(0).max(100).optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type UpdateComponent = z.infer<typeof updateComponentSchema>;
export type Component = typeof components.$inferSelect;

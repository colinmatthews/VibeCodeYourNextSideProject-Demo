import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SubscriptionType = {
  FREE: "free",
  PRO: "pro"
} as const;

export type SubscriptionType = typeof SubscriptionType[keyof typeof SubscriptionType];

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

export const insertComponentSchema = createInsertSchema(components, {
  id: z.string(),
  name: z.string().min(1, "Component name is required"),
  description: z.string().min(1, "Component description is required"),
  code: z.string().min(1, "Component code is required"),
  prompt: z.string().min(1, "Component prompt is required"),
  screenshot: z.string().optional(),
  version: z.number().int().positive().default(1),
  userId: z.string(),
});

export const updateComponentSchema = createInsertSchema(components, {
  name: z.string().min(1, "Component name is required").optional(),
  description: z.string().min(1, "Component description is required").optional(),
  code: z.string().min(1, "Component code is required").optional(),
  prompt: z.string().min(1, "Component prompt is required").optional(),
  screenshot: z.string().optional(),
  version: z.number().int().positive().optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type UpdateComponent = z.infer<typeof updateComponentSchema>;
export type Component = typeof components.$inferSelect;

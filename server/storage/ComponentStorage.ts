import { type Component, type InsertComponent, type UpdateComponent, components } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db";

export class ComponentStorage {
  async getComponentsByUserId(userId: string): Promise<Component[]> {
    return db
      .select()
      .from(components)
      .where(eq(components.userId, userId))
      .orderBy(desc(components.createdAt));
  }

  async getComponentById(id: string, userId: string): Promise<Component | undefined> {
    const [component] = await db
      .select()
      .from(components)
      .where(and(eq(components.id, id), eq(components.userId, userId)));
    return component;
  }

  async createComponent(component: InsertComponent): Promise<Component> {
    const [newComponent] = await db
      .insert(components)
      .values({
        ...component,
        updatedAt: new Date(),
      })
      .returning();
    return newComponent;
  }

  async updateComponent(id: string, userId: string, data: UpdateComponent): Promise<Component> {
    const [updatedComponent] = await db
      .update(components)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(components.id, id), eq(components.userId, userId)))
      .returning();
    return updatedComponent;
  }

  async deleteComponent(id: string, userId: string): Promise<void> {
    await db
      .delete(components)
      .where(and(eq(components.id, id), eq(components.userId, userId)));
  }

  async getComponentCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(components)
      .where(eq(components.userId, userId));
    return result[0]?.count || 0;
  }
} 
import type { Express } from "express";
import { storage } from "../storage/index";
import { insertComponentSchema, updateComponentSchema } from "@shared/schema";

export async function registerComponentRoutes(app: Express) {
  // GET /api/components - Get all components for the authenticated user
  app.get("/api/components", async (req, res) => {
    const userId = req.query.userId?.toString();
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      const components = await storage.getComponentsByUserId(userId);
      res.json({
        message: "Components retrieved successfully",
        components: components,
      });
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ 
        message: "Failed to fetch components",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/components/:id - Get a specific component
  app.get("/api/components/:id", async (req, res) => {
    const userId = req.query.userId?.toString();
    const componentId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    try {
      const component = await storage.getComponentById(componentId, userId);
      
      if (!component) {
        return res.status(404).json({ 
          message: "Component not found" 
        });
      }
      
      res.json({
        message: "Component retrieved successfully",
        component: component,
      });
    } catch (error) {
      console.error("Error fetching component:", error);
      res.status(500).json({ 
        message: "Failed to fetch component",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // POST /api/components - Create a new component
  app.post("/api/components", async (req, res) => {
    try {
      console.log("[Components] Received component data:", req.body);
      const { userId, ...componentData } = req.body;
      console.log("[Components] Parsed userId:", userId);

      if (!userId) {
        console.error("[Components] Invalid user ID");
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate component data
      const validatedData = insertComponentSchema.parse({
        ...componentData,
        userId: userId,
      });

      const newComponent = await storage.createComponent(validatedData);
      console.log("[Components] Component created:", newComponent);
      
      res.status(201).json({
        message: "Component created successfully",
        component: newComponent,
      });
    } catch (error) {
      console.error("[Components] Error creating component:", error);
      res.status(500).json({ 
        message: "Failed to create component",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PUT /api/components/:id - Update a component
  app.put("/api/components/:id", async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      const componentId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if component exists and belongs to user
      const existingComponent = await storage.getComponentById(componentId, userId);
      if (!existingComponent) {
        return res.status(404).json({ 
          message: "Component not found" 
        });
      }

      // Validate update data
      const validatedData = updateComponentSchema.parse(req.body);
      
      const updatedComponent = await storage.updateComponent(componentId, userId, validatedData);
      
      res.json({
        message: "Component updated successfully",
        component: updatedComponent,
      });
    } catch (error) {
      console.error("Error updating component:", error);
      res.status(500).json({ 
        message: "Failed to update component",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // DELETE /api/components/:id - Delete a component
  app.delete("/api/components/:id", async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      const componentId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if component exists and belongs to user
      const existingComponent = await storage.getComponentById(componentId, userId);
      if (!existingComponent) {
        return res.status(404).json({ 
          message: "Component not found" 
        });
      }
      
      await storage.deleteComponent(componentId, userId);
      
      res.json({
        message: "Component deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting component:", error);
      res.status(500).json({ 
        message: "Failed to delete component",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/components/stats/count - Get component count for the user
  app.get("/api/components/stats/count", async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const count = await storage.getComponentCount(userId);
      
      res.json({
        message: "Component count retrieved successfully",
        count: count,
      });
    } catch (error) {
      console.error("Error fetching component count:", error);
      res.status(500).json({ 
        message: "Failed to fetch component count",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
} 
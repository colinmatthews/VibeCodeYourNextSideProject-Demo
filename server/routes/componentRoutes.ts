import type { Express } from "express";
import { storage } from "../storage/index";
import { insertComponentSchema, updateComponentSchema } from "@shared/schema";
import { validateComponentQuality } from "../lib/qualityValidation";

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

  // Phase 1: New API endpoints for quality validation

  // POST /api/components/validate - Pre-generation code validation
  app.post("/api/components/validate", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ 
          error: "Code is required for validation" 
        });
      }
      
      console.log("Validating component code...");
      const validationResult = await validateComponentQuality(code);
      
      res.json({
        message: "Component validation completed",
        ...validationResult
      });
    } catch (error) {
      console.error("Error validating component:", error);
      res.status(500).json({ 
        message: "Failed to validate component",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PUT /api/components/:id/rating - User rating submission (1-5 stars)
  app.put("/api/components/:id/rating", async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      const componentId = req.params.id;
      const { rating } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: "Rating must be a number between 1 and 5" 
        });
      }
      
      // Check if component exists and belongs to user
      const existingComponent = await storage.getComponentById(componentId, userId);
      if (!existingComponent) {
        return res.status(404).json({ 
          message: "Component not found" 
        });
      }
      
      // Update component with user rating
      const updatedComponent = await storage.updateComponent(componentId, userId, {
        userRating: rating
      });
      
      res.json({
        message: "Component rating updated successfully",
        component: updatedComponent,
      });
    } catch (error) {
      console.error("Error updating component rating:", error);
      res.status(500).json({ 
        message: "Failed to update component rating",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/admin/quality-metrics - Quality analytics dashboard data
  app.get("/api/admin/quality-metrics", async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get all components for the user
      const components = await storage.getComponentsByUserId(userId);
      
      // Calculate quality metrics
      const totalComponents = components.length;
      const ratedComponents = components.filter(c => c.userRating).length;
      const avgRating = ratedComponents > 0 ? 
        components.reduce((sum, c) => sum + (c.userRating || 0), 0) / ratedComponents : 0;
      
      const qualityScores = components
        .filter(c => c.qualityScore)
        .map(c => c.qualityScore);
      
      const avgQualityScore = qualityScores.length > 0 ?
        qualityScores.reduce((sum, score) => sum + (score?.overall || 0), 0) / qualityScores.length : 0;
      
      const accessibilityScores = components
        .filter(c => c.accessibilityScore)
        .map(c => c.accessibilityScore);
      
      const avgAccessibilityScore = accessibilityScores.length > 0 ?
        accessibilityScores.reduce((sum, score) => sum + (score || 0), 0) / accessibilityScores.length : 0;
      
      // Component type distribution
      const componentTypes: { [key: string]: number } = {};
      components.forEach(component => {
        // Basic type detection based on component name/description
        const lowerName = (component.name + ' ' + component.description).toLowerCase();
        let type = 'display';
        
        if (lowerName.includes('form') || lowerName.includes('input')) type = 'form';
        else if (lowerName.includes('nav') || lowerName.includes('menu')) type = 'navigation';
        else if (lowerName.includes('button') || lowerName.includes('interactive')) type = 'interactive';
        else if (lowerName.includes('chart') || lowerName.includes('data')) type = 'data-visualization';
        else if (lowerName.includes('layout') || lowerName.includes('grid')) type = 'layout';
        
        componentTypes[type] = (componentTypes[type] || 0) + 1;
      });
      
      // Recent components with quality scores
      const recentComponents = components
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.name,
          createdAt: c.createdAt,
          qualityScore: c.qualityScore?.overall || 0,
          userRating: c.userRating || 0,
          accessibilityScore: c.accessibilityScore || 0
        }));
      
      res.json({
        message: "Quality metrics retrieved successfully",
        metrics: {
          overview: {
            totalComponents,
            ratedComponents,
            avgRating: Math.round(avgRating * 10) / 10,
            avgQualityScore: Math.round(avgQualityScore),
            avgAccessibilityScore: Math.round(avgAccessibilityScore)
          },
          distribution: {
            componentTypes,
            qualityScoreDistribution: {
              excellent: qualityScores.filter(s => (s?.overall || 0) >= 90).length,
              good: qualityScores.filter(s => (s?.overall || 0) >= 70 && (s?.overall || 0) < 90).length,
              fair: qualityScores.filter(s => (s?.overall || 0) >= 50 && (s?.overall || 0) < 70).length,
              poor: qualityScores.filter(s => (s?.overall || 0) < 50).length
            }
          },
          recentComponents
        }
      });
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      res.status(500).json({ 
        message: "Failed to fetch quality metrics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
} 
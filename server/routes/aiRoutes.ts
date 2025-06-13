import type { Express, Request, Response } from "express";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { vercel } from '@ai-sdk/vercel';
import { validateComponentQuality, analyzeComponent } from '../lib/qualityValidation';
import { enhancePromptForQuality } from '../lib/promptEnhancement';
import { 
  selectOptimalPromptStrategy, 
  selectOptimalAIProvider,
  enhancePromptWithContext,
  updateStrategyPerformance,
  updateProviderPerformance,
  type GenerationContext,
  type AIProviderPerformance,
  PROMPT_STRATEGIES
} from '../lib/aiQualityEnhancement';

// Phase 3: In-memory storage for performance metrics (in production, use database)
const providerPerformanceCache: AIProviderPerformance[] = [];

// Provider factory with intelligent selection
function getAIProvider(preferredProvider?: 'vercel' | 'openai' | 'anthropic') {
  const vercelKey = process.env.VERCEL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  // If a specific provider is requested and available, use it
  if (preferredProvider) {
    if (preferredProvider === 'vercel' && vercelKey) {
      return { provider: vercel('v0-1.0-md'), name: 'vercel' as const };
    } else if (preferredProvider === 'openai' && openaiKey) {
      return { provider: openai('gpt-4o'), name: 'openai' as const };
    } else if (preferredProvider === 'anthropic' && anthropicKey) {
      return { provider: anthropic('claude-3-5-sonnet-20241022'), name: 'anthropic' as const };
    }
  }
  
  // Fallback to default priority
  if (vercelKey) {
    return { provider: vercel('v0-1.0-md'), name: 'vercel' as const };
  } else if (openaiKey) {
    return { provider: openai('gpt-4o'), name: 'openai' as const };
  } else if (anthropicKey) {
    return { provider: anthropic('claude-3-5-sonnet-20241022'), name: 'anthropic' as const };
  } else {
    throw new Error('No AI provider API key found. Please set VERCEL_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }
}

interface GenerationRequest {
  prompt: string;
  targetComponent?: string;
  originalComponentCode?: string;
  originalName?: string;
  originalCreatedAt?: string;
  originalVersion?: number;
  image?: string; // Base64 encoded image data
}

// Legacy function - replaced by enhanced prompt system
function generateSystemPrompt(hasImage: boolean = false): string {
  // This function is now handled by enhancePromptForQuality
  // Keeping for backward compatibility
  const { systemPrompt } = enhancePromptForQuality("", hasImage);
  return systemPrompt;
}

function parseAIResponse(xmlString: string, isEdit: boolean): { name: string; description: string; code: string } {
  try {
    console.log("Parsing AI response XML (first 200 chars):", xmlString.substring(0, 200) + "...");

    const nameMatch = xmlString.match(
      isEdit ? /<component_edit>[\s\S]*?<name>(.*?)<\/name>/ : /<component>[\s\S]*?<name>(.*?)<\/name>/
    );
    const descriptionMatch = xmlString.match(
      isEdit
        ? /<component_edit>[\s\S]*?<description>(.*?)<\/description>/
        : /<component>[\s\S]*?<description>(.*?)<\/description>/
    );
    const codeMatch = xmlString.match(
      isEdit ? /<component_edit>[\s\S]*?<code>([\s\S]*?)<\/code>/ : /<component>[\s\S]*?<code>([\s\S]*?)<\/code>/
    );

    if (!nameMatch || !descriptionMatch || !codeMatch) {
      console.error("Failed to parse AI response XML. Full response:", xmlString);
      throw new Error("Invalid XML structure from AI. Check console for full response.");
    }

    let code = codeMatch[1].trim();
    
    // Remove CDATA wrapper if present
    code = code.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
    
    // Remove markdown code blocks if present
    code = code.replace(/^```(jsx?|javascript)?\n/, "").replace(/\n```$/, "");
    
    // Clean up any remaining whitespace
    code = code.trim();

    return {
      name: nameMatch[1].trim(),
      description: descriptionMatch[1].trim(),
      code: code,
    };
  } catch (error) {
    console.error("Error parsing AI XML:", error);
    throw new Error("Could not parse component data from AI's response.");
  }
}

export async function registerAIRoutes(app: Express) {
  // Component generation endpoint
  app.post('/api/ai/generate-component', async (req: Request, res: Response) => {
    try {
      const request: GenerationRequest = req.body;

      if (!request || typeof request.prompt !== "string") {
        return res.status(400).json({
          error: "Invalid request: prompt (string) is required."
        });
      }

      // Phase 3: Context-aware AI enhancement
      console.log("Setting up context-aware generation...");
      
      // Create generation context
      const generationContext: GenerationContext = {
        userPrompt: request.prompt,
        componentType: 'display', // Will be detected by prompt enhancement
        complexityLevel: 'medium', // Will be detected by prompt enhancement
        previousAttempts: [], // In production, fetch from database
        userQualityPreferences: {
          priorityWeights: {
            codeQuality: 0.3,
            accessibility: 0.3,
            designConsistency: 0.2,
            performance: 0.2
          },
          minAcceptableScore: 70
        }
      };

      // Select optimal prompt strategy based on context
      const selectedStrategy = selectOptimalPromptStrategy(generationContext, PROMPT_STRATEGIES);
      console.log(`Selected prompt strategy: ${selectedStrategy.name}`);

      // Select optimal AI provider based on performance history
      const optimalProvider = selectOptimalAIProvider(generationContext, providerPerformanceCache);
      console.log(`Selected AI provider: ${optimalProvider}`);

      const aiProvider = getAIProvider(optimalProvider);
      const model = aiProvider.provider;
      
      let userPrompt: string | Array<any>;
      const hasImage = !!request.image;

      // Enhanced prompt generation with quality focus and context
      const promptEnhancement = enhancePromptForQuality(request.prompt, hasImage);
      
      // Apply context-aware enhancements
      const contextualPrompts = enhancePromptWithContext(
        request.prompt,
        generationContext,
        selectedStrategy
      );

      // Update generation context with detected component type and complexity
      generationContext.componentType = promptEnhancement.config.componentType || 'display';
      generationContext.complexityLevel = promptEnhancement.config.complexityLevel;

      if (request.targetComponent && request.originalComponentCode) {
        // Edit existing component
        if (hasImage) {
          userPrompt = [
            {
              type: "text",
              text: `
<request type="edit_component">
  <original_code><![CDATA[${request.originalComponentCode}]]></original_code>
  <edit_instruction>${contextualPrompts.userPrompt}</edit_instruction>
  <image_analysis>Analyze the provided image and incorporate any design elements or changes shown in the image into the existing component.</image_analysis>
  <thinking_process>...</thinking_process>
  Your output MUST be in the following XML format:
  <component_edit><name>...</name><description>...</description><code><![CDATA[...]]></code></component_edit>
</request>`
            },
            {
              type: "image",
              image: request.image
            }
          ];
        } else {
          userPrompt = `
<request type="edit_component">
  <original_code><![CDATA[${request.originalComponentCode}]]></original_code>
  <edit_instruction>${contextualPrompts.userPrompt}</edit_instruction>
  <thinking_process>...</thinking_process>
  Your output MUST be in the following XML format:
  <component_edit><name>...</name><description>...</description><code><![CDATA[...]]></code></component_edit>
</request>`;
        }
      } else {
        // Generate new component
        if (hasImage) {
          userPrompt = [
            {
              type: "text",
              text: `
<request type="new_component">
  <description_prompt>${contextualPrompts.userPrompt}</description_prompt>
  <image_analysis>Analyze the provided image and recreate the exact UI/component shown. Match the design, layout, colors, typography, and functionality as closely as possible.</image_analysis>
  <thinking_process>...</thinking_process>
  Your output MUST be in the following XML format:
  <component><name>...</name><description>...</description><code><![CDATA[...]]></code></component>
</request>`
            },
            {
              type: "image",
              image: request.image
            }
          ];
        } else {
          userPrompt = `
<request type="new_component">
  <description_prompt>${contextualPrompts.userPrompt}</description_prompt>
  <thinking_process>...</thinking_process>
  Your output MUST be in the following XML format:
  <component><name>...</name><description>...</description><code><![CDATA[...]]></code></component>
</request>`;
        }
      }

      console.log("Generating component with AI SDK...", hasImage ? "(with image)" : "(text only)");
      
      const { text } = await generateText({
        model,
        system: contextualPrompts.systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        maxTokens: 4000,
        temperature: 0.7,
      });

      console.log("AI generation successful. Parsing response...");
      const parsed = parseAIResponse(text, !!request.targetComponent);

      console.log("Running quality validation...");
      // Phase 1: Quality validation pipeline
      const qualityResult = await validateComponentQuality(parsed.code);
      
      console.log("Quality validation complete:", {
        score: qualityResult.qualityScore.overall,
        isValid: qualityResult.isValid,
        errorCount: qualityResult.validationErrors.length
      });

      // Phase 3: Update performance metrics
      console.log("Updating performance metrics...");
      
      // Update strategy performance
      updateStrategyPerformance(selectedStrategy.id, qualityResult.qualityScore);
      
      // Update provider performance
      updateProviderPerformance(
        aiProvider.name,
        generationContext.componentType,
        generationContext.complexityLevel,
        qualityResult.qualityScore,
        providerPerformanceCache
      );

      const component = {
        id: request.targetComponent || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: parsed.name,
        description: parsed.description,
        code: parsed.code,
        prompt: request.prompt,
        createdAt: request.targetComponent ? new Date(request.originalCreatedAt || Date.now()) : new Date(),
        updatedAt: new Date(),
        version: request.targetComponent ? (request.originalVersion || 0) + 1 : 1,
        // Phase 1: Quality tracking fields
        qualityScore: qualityResult.qualityScore,
        validationErrors: qualityResult.validationErrors,
        accessibilityScore: qualityResult.accessibilityScore,
        // Phase 3: AI enhancement tracking
        promptStrategy: selectedStrategy.id,
        aiProvider: aiProvider.name,
        componentType: generationContext.componentType,
        complexityLevel: generationContext.complexityLevel
      };

      console.log("Component generation successful:", component.name);
      console.log("Quality score:", qualityResult.qualityScore.overall);
      console.log("Strategy used:", selectedStrategy.name);
      console.log("Provider used:", aiProvider.name);
      
      res.json(component);

    } catch (error) {
      console.error("Component generation error:", error);
      res.status(500).json({
        error: "Failed to generate component. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health check endpoint for AI
  app.get('/api/ai/health', async (req: Request, res: Response) => {
    try {
      const vercelKey = process.env.VERCEL_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      
      res.json({
        status: 'ok',
        providers: {
          vercel: !!vercelKey,
          openai: !!openaiKey,
          anthropic: !!anthropicKey
        },
        activeProvider: vercelKey ? 'vercel' : openaiKey ? 'openai' : anthropicKey ? 'anthropic' : 'none'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Phase 3: AI performance metrics endpoint
  app.get('/api/ai/performance-metrics', async (req: Request, res: Response) => {
    try {
      res.json({
        message: 'AI performance metrics retrieved successfully',
        metrics: {
          providers: providerPerformanceCache,
          strategies: PROMPT_STRATEGIES.map(strategy => ({
            id: strategy.id,
            name: strategy.name,
            description: strategy.description,
            targetComponentTypes: strategy.targetComponentTypes,
            successMetrics: strategy.successMetrics
          })),
          totalGenerations: providerPerformanceCache.reduce((sum, p) => sum + p.generationCount, 0),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Error fetching AI performance metrics:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 
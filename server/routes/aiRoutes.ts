import type { Express, Request, Response } from "express";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { vercel } from '@ai-sdk/vercel';
import { validateGeneratedCode, type ValidationResult } from '../lib/quality-validation.js';

// Provider factory based on environment
function getAIProvider() {
  const vercelKey = process.env.VERCEL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (vercelKey) {
    return vercel('v0-1.0-md');
  } else if (openaiKey) {
    return openai('gpt-4o');
  } else if (anthropicKey) {
    return anthropic('claude-3-5-sonnet-20241022');
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
  componentType?: 'form' | 'display' | 'navigation' | 'layout' | 'interactive' | 'data-visualization';
}

function detectComponentType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('form') || lowerPrompt.includes('input') || lowerPrompt.includes('submit') || lowerPrompt.includes('login') || lowerPrompt.includes('signup')) {
    return 'form';
  } else if (lowerPrompt.includes('nav') || lowerPrompt.includes('menu') || lowerPrompt.includes('header') || lowerPrompt.includes('footer') || lowerPrompt.includes('sidebar')) {
    return 'navigation';
  } else if (lowerPrompt.includes('chart') || lowerPrompt.includes('graph') || lowerPrompt.includes('data') || lowerPrompt.includes('analytics') || lowerPrompt.includes('dashboard')) {
    return 'data-visualization';
  } else if (lowerPrompt.includes('modal') || lowerPrompt.includes('dialog') || lowerPrompt.includes('tooltip') || lowerPrompt.includes('dropdown') || lowerPrompt.includes('accordion')) {
    return 'interactive';
  } else if (lowerPrompt.includes('layout') || lowerPrompt.includes('grid') || lowerPrompt.includes('container') || lowerPrompt.includes('section')) {
    return 'layout';
  }
  return 'display';
}

function getComponentSpecificGuidance(componentType: string): string {
  switch (componentType) {
    case 'form':
      return `
**FORM COMPONENT GUIDELINES**:
- Always include proper form validation and error handling
- Use semantic HTML form elements (form, input, label, button)
- Include ARIA labels and proper accessibility attributes
- Implement proper form state management with useState
- Include loading states for form submission
- Use proper input types (email, password, tel, etc.)
- Include proper error display and validation feedback`;

    case 'navigation':
      return `
**NAVIGATION COMPONENT GUIDELINES**:
- Use semantic navigation elements (nav, ul, li)
- Include proper ARIA landmarks and navigation roles
- Implement active/current state styling
- Consider mobile responsiveness and hamburger menus
- Use proper focus management for keyboard navigation
- Include proper link semantics and hover states`;

    case 'data-visualization':
      return `
**DATA VISUALIZATION GUIDELINES**:
- Use proper semantic markup for tables and lists
- Include proper ARIA labels for charts and graphs
- Implement responsive design for different screen sizes
- Use meaningful color schemes with proper contrast
- Include loading states for data fetching
- Provide alternative text descriptions for visual data`;

    case 'interactive':
      return `
**INTERACTIVE COMPONENT GUIDELINES**:
- Implement proper keyboard navigation (Enter, Escape, Arrow keys)
- Include proper ARIA states (expanded, selected, pressed)
- Use semantic HTML elements where possible
- Implement proper focus management
- Include smooth animations and transitions
- Handle edge cases and error states`;

    case 'layout':
      return `
**LAYOUT COMPONENT GUIDELINES**:
- Use CSS Grid or Flexbox for responsive layouts
- Implement proper responsive breakpoints
- Consider content hierarchy and visual flow
- Use semantic HTML landmarks (main, section, aside)
- Ensure proper spacing and typography scales
- Test across different viewport sizes`;

    default:
      return `
**DISPLAY COMPONENT GUIDELINES**:
- Focus on clean, readable typography
- Use proper content hierarchy with headings
- Implement responsive design patterns
- Include proper color contrast for accessibility
- Use semantic HTML elements for content structure
- Consider loading states if displaying dynamic content`;
  }
}

function generateSystemPrompt(hasImage: boolean = false, componentType: string = 'display'): string {
  const componentGuidance = getComponentSpecificGuidance(componentType);
  
  const basePrompt = `You are an expert React and Tailwind CSS developer specializing in high-quality, accessible component generation. Your task is to generate or modify React functional components with exceptional quality standards.

**CORE DEVELOPMENT RULES**:
1. The generated code must be a single React functional component.
2. React hooks (useState, useEffect, useCallback, useMemo, useRef) are available globally - you can use them directly without imports.
3. Do NOT include any import statements (React, useState, etc.) - they are provided in the runtime environment.
4. Style components using Tailwind CSS with semantic class names and consistent spacing.
5. The component code should be self-contained and renderable without any external dependencies.
6. After the component function definition, you MUST include a \`render()\` call to display an example of the component.
7. Structure your response using the XML format specified in the user's prompt.
8. IMPORTANT: Event handlers like onClick, onChange, onSubmit should use arrow function syntax: \`(e) => { ... }\` or \`() => { ... }\`.

**QUALITY STANDARDS**:
9. **TypeScript Compatibility**: Write clean, type-safe code that would pass TypeScript compilation.
10. **Accessibility First**: Follow WCAG 2.1 AA guidelines:
    - Use semantic HTML elements (button, nav, main, section, article)
    - Include proper ARIA labels and roles
    - Ensure proper color contrast ratios
    - Implement keyboard navigation support
    - Provide alt text for images
11. **Performance Optimization**:
    - Minimize inline objects and functions that cause re-renders
    - Use useMemo/useCallback for expensive operations
    - Implement proper state management patterns
12. **Design System Consistency**:
    - Use consistent spacing patterns (multiples of 4: p-4, m-8, etc.)
    - Follow modern design principles with proper visual hierarchy
    - Implement responsive design with mobile-first approach
    - Use consistent color schemes and typography

**THEME GUIDELINES**:
13. **LIGHT THEME BY DEFAULT**: Generate components with light themes unless specifically requested otherwise.
    - Primary backgrounds: bg-white, bg-gray-50, bg-gray-100
    - Text colors: text-gray-900, text-gray-800, text-gray-700
    - Accent colors: Use vibrant colors like blue-600, indigo-600, green-600, purple-600
    - Borders: border-gray-200, border-gray-300
    - Hover states: hover:bg-gray-100, hover:bg-gray-200

${componentGuidance}

**ERROR HANDLING & EDGE CASES**:
14. Include proper error boundaries and fallback states
15. Handle loading states appropriately
16. Validate props and provide sensible defaults
17. Consider empty states and error scenarios`;

  if (hasImage) {
    return basePrompt + `

**IMAGE ANALYSIS INSTRUCTIONS**:
14. **ANALYZE THE PROVIDED IMAGE CAREFULLY**: Study the image to understand the layout, design patterns, colors, typography, spacing, and interactive elements.
15. **RECREATE EXACTLY**: Generate a React component that matches the image as closely as possible. Pay attention to:
    - Layout and positioning of elements
    - Colors, fonts, and sizing
    - Spacing and margins/padding
    - Interactive elements (buttons, inputs, etc.)
    - Overall visual hierarchy and design
16. **PRESERVE DESIGN INTENT**: If the image shows a dark theme, recreate it as dark. If it shows specific colors, match them closely using Tailwind classes or custom styles.
17. **EXTRACT TEXT CONTENT**: Use any visible text from the image in your component (for labels, headings, placeholder text, etc.).
18. **INFER FUNCTIONALITY**: Based on the UI elements visible, implement appropriate interactive behavior (forms, buttons, navigation, etc.).`;
  }
  
  return basePrompt;
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

      const model = getAIProvider();
      
      // Detect component type for enhanced prompt engineering
      const componentType = request.componentType || detectComponentType(request.prompt);
      console.log("Detected component type:", componentType);
      
      let userPrompt: string | Array<any>;
      const hasImage = !!request.image;

      if (request.targetComponent && request.originalComponentCode) {
        // Edit existing component
        if (hasImage) {
          userPrompt = [
            {
              type: "text",
              text: `
<request type="edit_component">
  <original_code><![CDATA[${request.originalComponentCode}]]></original_code>
  <edit_instruction>${request.prompt}</edit_instruction>
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
  <edit_instruction>${request.prompt}</edit_instruction>
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
  <description_prompt>${request.prompt}</description_prompt>
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
  <description_prompt>${request.prompt}</description_prompt>
  <thinking_process>...</thinking_process>
  Your output MUST be in the following XML format:
  <component><name>...</name><description>...</description><code><![CDATA[...]]></code></component>
</request>`;
        }
      }

      console.log("Generating component with AI SDK...", hasImage ? "(with image)" : "(text only)");
      
      const { text } = await generateText({
        model,
        system: generateSystemPrompt(hasImage, componentType),
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

      console.log("Validating generated code quality...");
      const validation = await validateGeneratedCode(parsed.code);

      const component = {
        id: request.targetComponent || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: parsed.name,
        description: parsed.description,
        code: parsed.code,
        prompt: request.prompt,
        createdAt: request.targetComponent ? new Date(request.originalCreatedAt || Date.now()) : new Date(),
        updatedAt: new Date(),
        version: request.targetComponent ? (request.originalVersion || 0) + 1 : 1,
        qualityScore: validation.qualityScore,
        validationErrors: validation.errors,
        accessibilityScore: validation.qualityScore.accessibility,
      };

      console.log("Component generation successful:", component.name, 
                 `Quality Score: ${validation.qualityScore.overall}/100`);
      
      // Return component with validation results
      res.json({
        ...component,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          qualityScore: validation.qualityScore,
        }
      });

    } catch (error) {
      console.error("Component generation error:", error);
      res.status(500).json({
        error: "Failed to generate component. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Pre-generation code validation endpoint
  app.post('/api/components/validate', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          error: 'Invalid request: code (string) is required.'
        });
      }

      console.log("Validating component code...");
      const validation = await validateGeneratedCode(code);

      res.json({
        isValid: validation.isValid,
        errors: validation.errors,
        qualityScore: validation.qualityScore,
      });

    } catch (error) {
      console.error("Code validation error:", error);
      res.status(500).json({
        error: "Failed to validate component code. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Component rating endpoint
  app.put('/api/components/:id/rating', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!id || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Invalid request: component ID and rating (1-5) are required.'
        });
      }

      // Note: This would need to be connected to your actual database
      // For now, just returning success response
      console.log(`Component ${id} rated: ${rating}/5`);

      res.json({
        success: true,
        componentId: id,
        rating: rating,
        message: 'Rating saved successfully'
      });

    } catch (error) {
      console.error("Component rating error:", error);
      res.status(500).json({
        error: "Failed to save component rating. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Quality metrics endpoint (for future dashboard)
  app.get('/api/admin/quality-metrics', async (req: Request, res: Response) => {
    try {
      // Note: This would need to be connected to your actual database
      // For now, returning mock data structure
      const metrics = {
        totalComponents: 0,
        averageQualityScore: 0,
        averageUserRating: 0,
        qualityTrends: [],
        componentsByType: {},
        validationStats: {
          totalValidated: 0,
          passRate: 0,
          commonErrors: []
        }
      };

      res.json(metrics);

    } catch (error) {
      console.error("Quality metrics error:", error);
      res.status(500).json({
        error: "Failed to fetch quality metrics. Please try again.",
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
} 
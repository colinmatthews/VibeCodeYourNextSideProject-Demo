import type { Express, Request, Response } from "express";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { vercel } from '@ai-sdk/vercel';

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
}

function generateSystemPrompt(hasImage: boolean = false): string {
  const basePrompt = `You are an expert React and Tailwind CSS developer. Your task is to generate or modify React functional components.
You MUST follow these rules:
1. The generated code must be a single React functional component.
2. React hooks (useState, useEffect, useCallback, useMemo, useRef) are available globally - you can use them directly without imports.
3. Do NOT include any import statements (React, useState, etc.) - they are provided in the runtime environment.
4. Style components using Tailwind CSS with inline styles where needed for custom styling.
5. Use a modern, clean design with good spacing, typography, and visual hierarchy.
6. The component code should be self-contained and renderable without any external dependencies.
7. After the component function definition, you MUST include a \`render()\` call to display an example of the component. For example: \`render(<MyComponent prop1="example" />);\`. If the component takes no props, use \`render(<MyComponent />);\`.
8. Ensure the component is responsive and accessible where appropriate.
9. Structure your response using the XML format specified in the user's prompt.
10. IMPORTANT: Event handlers like onClick, onChange, onSubmit should use arrow function syntax: \`(e) => { ... }\` or \`() => { ... }\`.
11. **LIGHT THEME BY DEFAULT**: Generate components with light themes unless specifically requested otherwise. Use light backgrounds (white, gray-50, gray-100) and dark text (gray-900, gray-800, gray-700). For accent colors, use bright, vibrant colors that work well on light backgrounds.
12. **Color Guidelines**: 
    - Primary backgrounds: bg-white, bg-gray-50, bg-gray-100
    - Text colors: text-gray-900, text-gray-800, text-gray-700
    - Accent colors: Use vibrant colors like blue-600, indigo-600, green-600, purple-600, etc.
    - Borders: border-gray-200, border-gray-300
    - Hover states: hover:bg-gray-100, hover:bg-gray-200
13. Use appropriate spacing and styling to make the component visually appealing and functional with the light theme aesthetic.`;

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
        system: generateSystemPrompt(hasImage),
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

      const component = {
        id: request.targetComponent || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: parsed.name,
        description: parsed.description,
        code: parsed.code,
        prompt: request.prompt,
        createdAt: request.targetComponent ? new Date(request.originalCreatedAt || Date.now()) : new Date(),
        updatedAt: new Date(),
        version: request.targetComponent ? (request.originalVersion || 0) + 1 : 1,
      };

      console.log("Component generation successful:", component.name);
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
} 
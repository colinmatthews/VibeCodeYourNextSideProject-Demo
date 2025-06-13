/**
 * Phase 1: Enhanced AI Prompt Engineering
 * Component-type detection and quality-focused prompt generation
 */

import { ComponentAnalysis } from './qualityValidation';

export interface PromptEnhancementConfig {
  componentType?: 'form' | 'navigation' | 'display' | 'layout' | 'interactive' | 'data-visualization';
  complexityLevel: 'simple' | 'medium' | 'complex';
  qualityFocus: boolean;
  accessibilityRequired: boolean;
}

/**
 * Detects component type from user prompt
 */
export function detectComponentType(prompt: string): PromptEnhancementConfig['componentType'] {
  const lowerPrompt = prompt.toLowerCase();
  
  // Form-related keywords
  if (lowerPrompt.match(/\b(form|input|submit|login|register|contact|signup|field|validation)\b/)) {
    return 'form';
  }
  
  // Navigation-related keywords  
  if (lowerPrompt.match(/\b(nav|navigation|menu|sidebar|breadcrumb|header|footer|tabs)\b/)) {
    return 'navigation';
  }
  
  // Interactive component keywords
  if (lowerPrompt.match(/\b(button|toggle|switch|modal|dialog|dropdown|accordion|carousel)\b/)) {
    return 'interactive';
  }
  
  // Data visualization keywords
  if (lowerPrompt.match(/\b(chart|graph|table|data|dashboard|analytics|visualization|plot)\b/)) {
    return 'data-visualization';
  }
  
  // Layout-related keywords
  if (lowerPrompt.match(/\b(layout|grid|container|wrapper|card|section|panel|split)\b/)) {
    return 'layout';
  }
  
  // Default to display component
  return 'display';
}

/**
 * Determines complexity level from prompt
 */
export function determineComplexity(prompt: string): PromptEnhancementConfig['complexityLevel'] {
  const complexKeywords = [
    'dynamic', 'interactive', 'state', 'animation', 'realtime', 'complex', 
    'advanced', 'multiple', 'integration', 'api', 'responsive'
  ];
  
  const mediumKeywords = [
    'form', 'validation', 'toggle', 'dropdown', 'modal', 'tabs', 'accordion'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const complexMatches = complexKeywords.filter(keyword => lowerPrompt.includes(keyword));
  const mediumMatches = mediumKeywords.filter(keyword => lowerPrompt.includes(keyword));
  
  if (complexMatches.length >= 2) return 'complex';
  if (mediumMatches.length >= 1 || complexMatches.length >= 1) return 'medium';
  return 'simple';
}

/**
 * Generates component-type-specific guidelines
 */
export function getComponentTypeGuidelines(componentType: PromptEnhancementConfig['componentType']): string {
  switch (componentType) {
    case 'form':
      return `
**FORM COMPONENT GUIDELINES:**
- Use semantic form elements (<form>, <fieldset>, <legend>)
- Include proper form validation with visual feedback
- Add accessible labels (htmlFor attribute) for all inputs
- Implement proper error states and success states
- Use appropriate input types (email, tel, password, etc.)
- Include form submission handling with loading states
- Ensure keyboard navigation works correctly
- Add ARIA attributes for screen readers (aria-describedby, aria-invalid)
- Use consistent spacing and visual hierarchy
- Include helpful placeholder text and validation messages`;

    case 'navigation':
      return `
**NAVIGATION COMPONENT GUIDELINES:**
- Use semantic navigation elements (<nav>, <ul>, <li>)
- Include proper ARIA landmarks (role="navigation")
- Implement keyboard navigation (Tab, Enter, Arrow keys)
- Add active/current state indicators
- Ensure mobile responsiveness with collapsible menu
- Include skip navigation links for accessibility
- Use consistent styling across navigation items
- Implement proper focus management
- Add breadcrumbs for complex navigation structures
- Consider search functionality for large menus`;

    case 'interactive':
      return `
**INTERACTIVE COMPONENT GUIDELINES:**
- Use appropriate ARIA attributes (aria-expanded, aria-pressed)
- Implement proper focus management and visual focus indicators
- Add keyboard event handlers (onKeyDown, onKeyPress)
- Include loading and disabled states
- Provide clear visual feedback for user actions
- Use semantic button elements for clickable items
- Implement proper state management with useState
- Add animation/transitions for smooth interactions
- Ensure touch targets are at least 44x44px for mobile
- Include descriptive aria-label attributes`;

    case 'data-visualization':
      return `
**DATA VISUALIZATION GUIDELINES:**
- Use semantic table elements for tabular data
- Include proper headers and captions for tables
- Implement responsive design for different screen sizes
- Add ARIA labels for chart elements and data points
- Provide alternative text descriptions for visual data
- Include keyboard navigation for interactive charts
- Use consistent color schemes with sufficient contrast
- Implement data loading and error states
- Add tooltips and legends for complex visualizations
- Consider screen reader accessibility for data representation`;

    case 'layout':
      return `
**LAYOUT COMPONENT GUIDELINES:**
- Use CSS Grid or Flexbox for responsive layouts
- Implement proper semantic structure (main, section, aside)
- Ensure consistent spacing using Tailwind spacing utilities
- Add responsive breakpoints for mobile, tablet, desktop
- Use landmark roles for better accessibility
- Implement proper heading hierarchy (h1, h2, h3, etc.)
- Ensure content reflows properly on different screen sizes
- Add skip links for keyboard navigation
- Use consistent container max-widths and margins
- Consider dark mode compatibility`;

    case 'display':
    default:
      return `
**DISPLAY COMPONENT GUIDELINES:**
- Use appropriate semantic HTML elements
- Implement responsive design principles
- Add proper alt text for images and media
- Use consistent typography and spacing
- Ensure adequate color contrast (4.5:1 minimum)
- Include proper heading structure
- Add focus indicators for interactive elements
- Use meaningful link text (avoid "click here")
- Implement proper content hierarchy
- Consider loading states for dynamic content`;
  }
}

/**
 * Generates quality-focused system prompt
 */
export function generateEnhancedSystemPrompt(config: PromptEnhancementConfig, hasImage: boolean = false): string {
  const basePrompt = `You are an expert React and Tailwind CSS developer specializing in high-quality, accessible component development. Your task is to generate exceptional React functional components that meet modern web standards.

**CORE REQUIREMENTS:**
1. Generate a single React functional component with clean, semantic code
2. React hooks (useState, useEffect, useCallback, useMemo, useRef) are available globally
3. Do NOT include import statements - they are provided in the runtime environment
4. Use Tailwind CSS for styling with modern design principles
5. Component must be self-contained and immediately renderable
6. Include a render() call at the end: \`render(<ComponentName />);\`
7. Use arrow function syntax for event handlers: \`(e) => { ... }\`

**QUALITY STANDARDS:**
8. **TypeScript Best Practices**: Use proper types, avoid 'any', follow React patterns
9. **Accessibility First**: WCAG 2.1 AA compliance, semantic HTML, ARIA attributes
10. **Performance Optimized**: Efficient renders, proper memoization when needed
11. **Design Consistency**: Follow modern UI patterns, consistent spacing and colors
12. **Light Theme Default**: Use light backgrounds (bg-white, bg-gray-50) unless specified otherwise

**DESIGN SYSTEM:**
- Primary backgrounds: bg-white, bg-gray-50, bg-gray-100
- Text colors: text-gray-900, text-gray-800, text-gray-700
- Accent colors: blue-600, indigo-600, green-600, purple-600 (vibrant colors)
- Borders: border-gray-200, border-gray-300
- Hover states: hover:bg-gray-100, hover:bg-gray-200
- Spacing: Use Tailwind spacing utilities (p-4, m-2, space-y-4, etc.)
- Border radius: rounded-lg, rounded-md for modern look`;

  // Add component-specific guidelines
  const typeGuidelines = getComponentTypeGuidelines(config.componentType);
  const enhancedPrompt = basePrompt + '\n' + typeGuidelines;

  // Add complexity-specific guidance
  const complexityGuidance = getComplexityGuidance(config.complexityLevel);
  const finalPrompt = enhancedPrompt + '\n' + complexityGuidance;

  // Add image analysis instructions if applicable
  if (hasImage) {
    return finalPrompt + `

**IMAGE ANALYSIS INSTRUCTIONS:**
13. **ANALYZE THE PROVIDED IMAGE**: Study layout, colors, typography, spacing, and functionality
14. **RECREATE EXACTLY**: Match the design as closely as possible using Tailwind classes
15. **PRESERVE DESIGN INTENT**: Maintain the color scheme and theme shown in image
16. **EXTRACT TEXT CONTENT**: Use visible text from image in the component
17. **INFER FUNCTIONALITY**: Implement appropriate interactive behavior based on UI elements`;
  }

  return finalPrompt;
}

/**
 * Generates complexity-specific guidance
 */
function getComplexityGuidance(complexity: PromptEnhancementConfig['complexityLevel']): string {
  switch (complexity) {
    case 'simple':
      return `
**SIMPLE COMPONENT FOCUS:**
- Keep the component focused and single-purpose
- Use minimal state management
- Prioritize clarity and readability
- Include basic accessibility features
- Use standard Tailwind utilities`;

    case 'medium':
      return `
**MEDIUM COMPLEXITY FOCUS:**
- Implement proper state management with useState
- Add interactive features with event handlers
- Include form validation if applicable
- Implement responsive design breakpoints
- Add proper error handling and edge cases
- Use useEffect for side effects when needed`;

    case 'complex':
      return `
**COMPLEX COMPONENT FOCUS:**
- Use multiple hooks (useState, useEffect, useMemo, useCallback)
- Implement advanced interactivity and state management
- Add comprehensive error handling and loading states
- Include advanced accessibility features (ARIA live regions, focus management)
- Optimize performance with memoization
- Handle complex user interactions and edge cases
- Consider component composition and reusability`;

    default:
      return '';
  }
}

/**
 * Enhances user prompt with quality requirements
 */
export function enhanceUserPrompt(originalPrompt: string, config: PromptEnhancementConfig): string {
  const qualityRequirements = config.qualityFocus ? `
  
<quality_requirements>
- Ensure TypeScript best practices and type safety
- Include comprehensive accessibility features (ARIA labels, semantic HTML)
- Implement responsive design for mobile, tablet, and desktop
- Use modern design patterns with consistent spacing and colors
- Add proper error handling and edge case considerations
- Optimize for performance with minimal re-renders
- Follow React hooks best practices
</quality_requirements>` : '';

  const accessibilityNote = config.accessibilityRequired ? `

<accessibility_focus>
This component will be evaluated for WCAG 2.1 AA compliance. Please ensure:
- All interactive elements are keyboard accessible
- Color contrast ratios meet accessibility standards
- Screen reader compatibility with proper ARIA attributes
- Semantic HTML structure for better navigation
- Focus management and visual focus indicators
</accessibility_focus>` : '';

  return originalPrompt + qualityRequirements + accessibilityNote;
}

/**
 * Main prompt enhancement function
 */
export function enhancePromptForQuality(originalPrompt: string, hasImage: boolean = false): {
  systemPrompt: string;
  userPrompt: string;
  config: PromptEnhancementConfig;
} {
  const componentType = detectComponentType(originalPrompt);
  const complexityLevel = determineComplexity(originalPrompt);
  
  const config: PromptEnhancementConfig = {
    componentType,
    complexityLevel,
    qualityFocus: true,
    accessibilityRequired: true
  };

  const systemPrompt = generateEnhancedSystemPrompt(config, hasImage);
  const userPrompt = enhanceUserPrompt(originalPrompt, config);

  return {
    systemPrompt,
    userPrompt,
    config
  };
}
/**
 * Phase 3: AI Quality Enhancement
 * Context-aware generation, A/B testing for prompts, and quality-based AI provider selection
 */

import type { ComponentQualityScore, ValidationError } from '@shared/schema';
import type { ComponentAnalysis } from './qualityValidation';
import type { PromptEnhancementConfig } from './promptEnhancement';

export interface QualityHistory {
  componentId: string;
  qualityScore: ComponentQualityScore;
  promptStrategy: string;
  aiProvider: string;
  componentType: string;
  userRating?: number;
  createdAt: Date;
}

export interface PromptStrategy {
  id: string;
  name: string;
  description: string;
  systemPromptModifier: string;
  userPromptEnhancer: (prompt: string, context: GenerationContext) => string;
  targetComponentTypes: string[];
  successMetrics: {
    avgQualityScore: number;
    avgUserRating: number;
    generationCount: number;
    successRate: number;
  };
}

export interface GenerationContext {
  userPrompt: string;
  componentType: string;
  complexityLevel: 'simple' | 'medium' | 'complex';
  previousAttempts: QualityHistory[];
  userQualityPreferences: {
    priorityWeights: {
      codeQuality: number;
      accessibility: number;
      designConsistency: number;
      performance: number;
    };
    minAcceptableScore: number;
  };
}

export interface AIProviderPerformance {
  provider: 'vercel' | 'openai' | 'anthropic';
  qualityMetrics: {
    avgQualityScore: number;
    avgCodeQuality: number;
    avgAccessibility: number;
    avgDesignConsistency: number;
    avgPerformance: number;
  };
  componentTypePerformance: Record<string, number>;
  complexityPerformance: Record<string, number>;
  generationCount: number;
  lastUpdated: Date;
}

// Predefined prompt strategies for A/B testing
export const PROMPT_STRATEGIES: PromptStrategy[] = [
  {
    id: 'quality-first',
    name: 'Quality-First Strategy',
    description: 'Emphasizes code quality and best practices above all else',
    systemPromptModifier: `
**QUALITY-FIRST APPROACH:**
- Prioritize TypeScript best practices and type safety
- Ensure comprehensive error handling and edge cases
- Focus on clean, maintainable code structure
- Implement proper React patterns and hooks usage
- Validate all interactive elements and state management`,
    userPromptEnhancer: (prompt, context) => `
${prompt}

QUALITY REQUIREMENTS:
- Ensure TypeScript compilation without errors
- Implement comprehensive error handling
- Use proper React patterns and best practices
- Add detailed comments for complex logic
- Target quality score: 85+ overall`,
    targetComponentTypes: ['interactive', 'form', 'data-visualization'],
    successMetrics: { avgQualityScore: 0, avgUserRating: 0, generationCount: 0, successRate: 0 }
  },
  {
    id: 'accessibility-focused',
    name: 'Accessibility-Focused Strategy',
    description: 'Prioritizes WCAG compliance and inclusive design',
    systemPromptModifier: `
**ACCESSIBILITY-FIRST APPROACH:**
- Implement comprehensive ARIA attributes and semantic HTML
- Ensure keyboard navigation and screen reader compatibility
- Validate color contrast ratios (4.5:1 minimum)
- Add proper focus management and visual indicators
- Include alternative content for all media elements`,
    userPromptEnhancer: (prompt, context) => `
${prompt}

ACCESSIBILITY REQUIREMENTS:
- WCAG 2.1 AA compliance mandatory
- Include comprehensive ARIA attributes
- Ensure keyboard navigation support
- Validate color contrast ratios
- Target accessibility score: 90+ (excellent)`,
    targetComponentTypes: ['form', 'navigation', 'interactive'],
    successMetrics: { avgQualityScore: 0, avgUserRating: 0, generationCount: 0, successRate: 0 }
  },
  {
    id: 'design-consistency',
    name: 'Design Consistency Strategy',
    description: 'Focuses on visual coherence and design system adherence',
    systemPromptModifier: `
**DESIGN-FIRST APPROACH:**
- Follow established design system patterns and components
- Use consistent spacing, typography, and color schemes
- Implement responsive design principles across all breakpoints
- Ensure visual hierarchy and information architecture
- Maintain brand consistency and aesthetic cohesion`,
    userPromptEnhancer: (prompt, context) => `
${prompt}

DESIGN REQUIREMENTS:
- Follow shadcn/ui design patterns consistently
- Use systematic spacing and typography scales
- Implement responsive design for all devices
- Maintain visual consistency and hierarchy
- Target design consistency score: 85+`,
    targetComponentTypes: ['layout', 'navigation', 'display'],
    successMetrics: { avgQualityScore: 0, avgUserRating: 0, generationCount: 0, successRate: 0 }
  },
  {
    id: 'performance-optimized',
    name: 'Performance-Optimized Strategy',
    description: 'Emphasizes rendering performance and optimization',
    systemPromptModifier: `
**PERFORMANCE-FIRST APPROACH:**
- Optimize component rendering with memoization techniques
- Minimize bundle size and avoid unnecessary dependencies
- Implement efficient state management patterns
- Use lazy loading and code splitting where appropriate
- Ensure minimal re-renders and optimal React patterns`,
    userPromptEnhancer: (prompt, context) => `
${prompt}

PERFORMANCE REQUIREMENTS:
- Implement useMemo and useCallback for optimization
- Minimize component size and complexity
- Avoid unnecessary re-renders and state updates
- Use efficient data structures and algorithms
- Target performance score: 85+`,
    targetComponentTypes: ['data-visualization', 'interactive', 'layout'],
    successMetrics: { avgQualityScore: 0, avgUserRating: 0, generationCount: 0, successRate: 0 }
  },
  {
    id: 'user-experience',
    name: 'User Experience Strategy',
    description: 'Balances all quality aspects for optimal user satisfaction',
    systemPromptModifier: `
**BALANCED UX APPROACH:**
- Create intuitive and user-friendly interactions
- Balance technical quality with usability
- Implement progressive enhancement and graceful degradation
- Focus on user feedback and iterative improvement
- Ensure cross-browser compatibility and reliability`,
    userPromptEnhancer: (prompt, context) => `
${prompt}

USER EXPERIENCE REQUIREMENTS:
- Prioritize intuitive user interactions
- Balance quality across all dimensions
- Implement user-friendly error states and feedback
- Ensure reliable cross-browser functionality
- Target overall user satisfaction and quality balance`,
    targetComponentTypes: ['interactive', 'form', 'navigation', 'display'],
    successMetrics: { avgQualityScore: 0, avgUserRating: 0, generationCount: 0, successRate: 0 }
  }
];

/**
 * Selects the best prompt strategy based on context and historical performance
 */
export function selectOptimalPromptStrategy(
  context: GenerationContext,
  strategies: PromptStrategy[] = PROMPT_STRATEGIES
): PromptStrategy {
  // Filter strategies that are suitable for the component type
  const suitableStrategies = strategies.filter(strategy =>
    strategy.targetComponentTypes.includes(context.componentType) ||
    strategy.targetComponentTypes.includes('all')
  );

  if (suitableStrategies.length === 0) {
    return strategies.find(s => s.id === 'user-experience') || strategies[0];
  }

  // If we have previous attempts, learn from them
  if (context.previousAttempts.length > 0) {
    const lastAttempt = context.previousAttempts[context.previousAttempts.length - 1];
    
    // If last attempt was poor quality, try a different strategy
    if (lastAttempt.qualityScore.overall < context.userQualityPreferences.minAcceptableScore) {
      const lastStrategy = lastAttempt.promptStrategy;
      const alternativeStrategies = suitableStrategies.filter(s => s.id !== lastStrategy);
      
      if (alternativeStrategies.length > 0) {
        // Select strategy that addresses the lowest scoring dimension
        const { codeQuality, accessibility, designConsistency, performance } = lastAttempt.qualityScore;
        const scores = { codeQuality, accessibility, designConsistency, performance };
        const lowestDimension = Object.keys(scores).reduce((a, b) => 
          scores[a as keyof typeof scores] < scores[b as keyof typeof scores] ? a : b
        );

        if (lowestDimension === 'codeQuality') {
          return strategies.find(s => s.id === 'quality-first') || alternativeStrategies[0];
        } else if (lowestDimension === 'accessibility') {
          return strategies.find(s => s.id === 'accessibility-focused') || alternativeStrategies[0];
        } else if (lowestDimension === 'designConsistency') {
          return strategies.find(s => s.id === 'design-consistency') || alternativeStrategies[0];
        } else if (lowestDimension === 'performance') {
          return strategies.find(s => s.id === 'performance-optimized') || alternativeStrategies[0];
        }
      }
    }
  }

  // Select based on user preferences
  const { priorityWeights } = context.userQualityPreferences;
  const topPriority = Object.keys(priorityWeights).reduce((a, b) => 
    priorityWeights[a as keyof typeof priorityWeights] > priorityWeights[b as keyof typeof priorityWeights] ? a : b
  );

  const priorityStrategyMap: Record<string, string> = {
    codeQuality: 'quality-first',
    accessibility: 'accessibility-focused',
    designConsistency: 'design-consistency',
    performance: 'performance-optimized'
  };

  const preferredStrategy = strategies.find(s => s.id === priorityStrategyMap[topPriority]);
  if (preferredStrategy && suitableStrategies.includes(preferredStrategy)) {
    return preferredStrategy;
  }

  // Default to balanced approach
  return strategies.find(s => s.id === 'user-experience') || suitableStrategies[0];
}

/**
 * Selects the best AI provider based on historical performance
 */
export function selectOptimalAIProvider(
  context: GenerationContext,
  providerPerformance: AIProviderPerformance[]
): 'vercel' | 'openai' | 'anthropic' {
  if (providerPerformance.length === 0) {
    return 'vercel'; // Default fallback
  }

  // Filter providers based on component type performance
  const sortedProviders = providerPerformance
    .filter(provider => provider.generationCount > 5) // Ensure sufficient data
    .sort((a, b) => {
      // Weight by component type performance if available
      const aTypeScore = a.componentTypePerformance[context.componentType] || a.qualityMetrics.avgQualityScore;
      const bTypeScore = b.componentTypePerformance[context.componentType] || b.qualityMetrics.avgQualityScore;
      
      // Weight by complexity performance
      const aComplexityScore = a.complexityPerformance[context.complexityLevel] || aTypeScore;
      const bComplexityScore = b.complexityPerformance[context.complexityLevel] || bTypeScore;
      
      return bComplexityScore - aComplexityScore;
    });

  if (sortedProviders.length > 0) {
    return sortedProviders[0].provider;
  }

  // Fallback to provider with highest overall quality
  const bestOverallProvider = providerPerformance.reduce((best, current) =>
    current.qualityMetrics.avgQualityScore > best.qualityMetrics.avgQualityScore ? current : best
  );

  return bestOverallProvider.provider;
}

/**
 * Updates strategy performance metrics based on generation results
 */
export function updateStrategyPerformance(
  strategyId: string,
  qualityScore: ComponentQualityScore,
  userRating?: number,
  strategies: PromptStrategy[] = PROMPT_STRATEGIES
): void {
  const strategy = strategies.find(s => s.id === strategyId);
  if (!strategy) return;

  const { successMetrics } = strategy;
  const newCount = successMetrics.generationCount + 1;

  // Update rolling averages
  successMetrics.avgQualityScore = (
    (successMetrics.avgQualityScore * successMetrics.generationCount) + qualityScore.overall
  ) / newCount;

  if (userRating) {
    successMetrics.avgUserRating = (
      (successMetrics.avgUserRating * successMetrics.generationCount) + userRating
    ) / newCount;
  }

  successMetrics.generationCount = newCount;
  
  // Update success rate (quality score >= 70)
  const successfulGenerations = successMetrics.successRate * (newCount - 1) + (qualityScore.overall >= 70 ? 1 : 0);
  successMetrics.successRate = successfulGenerations / newCount;
}

/**
 * Updates AI provider performance metrics
 */
export function updateProviderPerformance(
  provider: 'vercel' | 'openai' | 'anthropic',
  componentType: string,
  complexityLevel: string,
  qualityScore: ComponentQualityScore,
  providerPerformance: AIProviderPerformance[]
): void {
  let providerData = providerPerformance.find(p => p.provider === provider);
  
  if (!providerData) {
    providerData = {
      provider,
      qualityMetrics: {
        avgQualityScore: 0,
        avgCodeQuality: 0,
        avgAccessibility: 0,
        avgDesignConsistency: 0,
        avgPerformance: 0
      },
      componentTypePerformance: {},
      complexityPerformance: {},
      generationCount: 0,
      lastUpdated: new Date()
    };
    providerPerformance.push(providerData);
  }

  const newCount = providerData.generationCount + 1;
  const { qualityMetrics } = providerData;

  // Update overall metrics
  qualityMetrics.avgQualityScore = (
    (qualityMetrics.avgQualityScore * providerData.generationCount) + qualityScore.overall
  ) / newCount;

  qualityMetrics.avgCodeQuality = (
    (qualityMetrics.avgCodeQuality * providerData.generationCount) + qualityScore.codeQuality
  ) / newCount;

  qualityMetrics.avgAccessibility = (
    (qualityMetrics.avgAccessibility * providerData.generationCount) + qualityScore.accessibility
  ) / newCount;

  qualityMetrics.avgDesignConsistency = (
    (qualityMetrics.avgDesignConsistency * providerData.generationCount) + qualityScore.designConsistency
  ) / newCount;

  qualityMetrics.avgPerformance = (
    (qualityMetrics.avgPerformance * providerData.generationCount) + qualityScore.performance
  ) / newCount;

  // Update component type performance
  const currentTypeScore = providerData.componentTypePerformance[componentType] || 0;
  const typeCount = Math.max(1, Math.round(newCount / Object.keys(providerData.componentTypePerformance).length));
  providerData.componentTypePerformance[componentType] = (
    (currentTypeScore * (typeCount - 1)) + qualityScore.overall
  ) / typeCount;

  // Update complexity performance
  const currentComplexityScore = providerData.complexityPerformance[complexityLevel] || 0;
  const complexityCount = Math.max(1, Math.round(newCount / Object.keys(providerData.complexityPerformance).length));
  providerData.complexityPerformance[complexityLevel] = (
    (currentComplexityScore * (complexityCount - 1)) + qualityScore.overall
  ) / complexityCount;

  providerData.generationCount = newCount;
  providerData.lastUpdated = new Date();
}

/**
 * Context-aware prompt enhancement using historical data
 */
export function enhancePromptWithContext(
  originalPrompt: string,
  context: GenerationContext,
  selectedStrategy: PromptStrategy
): { systemPrompt: string; userPrompt: string } {
  // Base enhancement
  const enhancedUserPrompt = selectedStrategy.userPromptEnhancer(originalPrompt, context);

  // Add context from previous attempts
  let contextualEnhancement = '';
  if (context.previousAttempts.length > 0) {
    const lastAttempt = context.previousAttempts[context.previousAttempts.length - 1];
    
    if (lastAttempt.qualityScore.overall < 70) {
      contextualEnhancement += `

IMPROVEMENT FOCUS (based on previous attempt):
- Previous quality score: ${lastAttempt.qualityScore.overall}/100
- Areas needing improvement: ${getImprovementAreas(lastAttempt.qualityScore)}
- Avoid the patterns that led to these issues
- Focus on addressing the specific weaknesses identified`;
    }
  }

  // Add user preference guidance
  const preferenceGuidance = generatePreferenceGuidance(context.userQualityPreferences);

  const finalSystemPrompt = selectedStrategy.systemPromptModifier + preferenceGuidance;
  const finalUserPrompt = enhancedUserPrompt + contextualEnhancement;

  return {
    systemPrompt: finalSystemPrompt,
    userPrompt: finalUserPrompt
  };
}

/**
 * Helper function to identify improvement areas
 */
function getImprovementAreas(qualityScore: ComponentQualityScore): string {
  const areas = [];
  
  if (qualityScore.codeQuality < 70) areas.push('code quality and TypeScript best practices');
  if (qualityScore.accessibility < 70) areas.push('accessibility and WCAG compliance');
  if (qualityScore.designConsistency < 70) areas.push('design consistency and visual patterns');
  if (qualityScore.performance < 70) areas.push('performance optimization');

  return areas.join(', ');
}

/**
 * Helper function to generate user preference guidance
 */
function generatePreferenceGuidance(preferences: GenerationContext['userQualityPreferences']): string {
  const { priorityWeights, minAcceptableScore } = preferences;
  
  const sortedPriorities = Object.entries(priorityWeights)
    .sort(([,a], [,b]) => b - a)
    .map(([key]) => key);

  return `

USER QUALITY PREFERENCES:
- Primary focus: ${sortedPriorities[0]} (highest priority)
- Secondary focus: ${sortedPriorities[1]}
- Minimum acceptable overall score: ${minAcceptableScore}/100
- Ensure all quality dimensions meet user expectations`;
}
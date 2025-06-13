/**
 * Phase 1: Component Quality Validation Pipeline
 * Comprehensive validation and scoring system for AI-generated components
 */

import * as ts from 'typescript';
import { ComponentQualityScore, ValidationError } from '@shared/schema';
import { validateVisualQuality, type VisualQualityResult } from './visualQualityAssurance';

export interface QualityValidationResult {
  qualityScore: ComponentQualityScore;
  validationErrors: ValidationError[];
  accessibilityScore: number;
  isValid: boolean;
  compilationSuccess: boolean;
  // Phase 2: Visual quality integration
  visualQuality: VisualQualityResult;
}

export interface ComponentAnalysis {
  componentType: 'form' | 'navigation' | 'display' | 'layout' | 'interactive' | 'data-visualization';
  hasInteractivity: boolean;
  usesHooks: boolean;
  hasAccessibilityFeatures: boolean;
  tailwindClasses: string[];
  complexityScore: number;
}

/**
 * Validates TypeScript code compilation
 */
export function validateTypeScriptCode(code: string): { success: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  try {
    // Create a TypeScript program with the component code
    const sourceFile = ts.createSourceFile(
      'component.tsx',
      code,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.TSX
    );

    // Basic syntax validation
    const syntaxErrors = sourceFile.parseDiagnostics;
    
    syntaxErrors.forEach(diagnostic => {
      const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start || 0);
      errors.push({
        type: 'typescript',
        severity: 'error',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        line: position?.line ? position.line + 1 : undefined,
        column: position?.character ? position.character + 1 : undefined,
        rule: 'typescript-syntax'
      });
    });

    // Additional TypeScript best practices validation
    validateBestPractices(sourceFile, errors);

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  } catch (error) {
    errors.push({
      type: 'typescript',
      severity: 'error',
      message: `Compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rule: 'typescript-compilation'
    });
    
    return { success: false, errors };
  }
}

/**
 * Validates React best practices
 */
function validateBestPractices(sourceFile: ts.SourceFile, errors: ValidationError[]) {
  function visit(node: ts.Node) {
    // Check for inline event handlers (prefer arrow functions)
    if (ts.isJsxAttribute(node) && node.name.text.startsWith('on')) {
      const initializer = node.initializer;
      if (ts.isJsxExpression(initializer) && initializer.expression) {
        if (!ts.isArrowFunction(initializer.expression) && !ts.isIdentifier(initializer.expression)) {
          errors.push({
            type: 'best-practices',
            severity: 'warning',
            message: 'Event handlers should use arrow function syntax for consistency',
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            rule: 'arrow-function-handlers'
          });
        }
      }
    }

    // Check for missing key props in mapped elements
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const parent = node.parent;
      if (ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
        const propAccess = parent.expression as ts.PropertyAccessExpression;
        if (propAccess.name.text === 'map') {
          const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
          const hasKey = attributes.properties.some(prop => 
            ts.isJsxAttribute(prop) && prop.name?.text === 'key'
          );
          if (!hasKey) {
            errors.push({
              type: 'best-practices',
              severity: 'warning',
              message: 'Elements in maps should have key props',
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
              rule: 'missing-key-prop'
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

/**
 * Analyzes component for type detection and complexity
 */
export function analyzeComponent(code: string): ComponentAnalysis {
  const lowerCode = code.toLowerCase();
  
  // Component type detection
  let componentType: ComponentAnalysis['componentType'] = 'display';
  
  if (lowerCode.includes('form') || lowerCode.includes('input') || lowerCode.includes('submit')) {
    componentType = 'form';
  } else if (lowerCode.includes('nav') || lowerCode.includes('menu') || lowerCode.includes('breadcrumb')) {
    componentType = 'navigation';
  } else if (lowerCode.includes('button') || lowerCode.includes('onclick') || lowerCode.includes('toggle')) {
    componentType = 'interactive';
  } else if (lowerCode.includes('chart') || lowerCode.includes('graph') || lowerCode.includes('data')) {
    componentType = 'data-visualization';
  } else if (lowerCode.includes('grid') || lowerCode.includes('flex') || lowerCode.includes('container')) {
    componentType = 'layout';
  }

  // Interactivity detection
  const hasInteractivity = /on[A-Z]\w+/.test(code) || code.includes('useState') || code.includes('useEffect');
  
  // Hooks usage detection
  const usesHooks = /use[A-Z]\w+/.test(code);
  
  // Accessibility features detection
  const hasAccessibilityFeatures = code.includes('aria-') || code.includes('role=') || 
    code.includes('alt=') || code.includes('tabIndex') || code.includes('htmlFor');
  
  // Extract Tailwind classes
  const tailwindMatches = code.match(/className="([^"]*)"/g) || [];
  const tailwindClasses = tailwindMatches
    .map(match => match.replace(/className="([^"]*)"/, '$1'))
    .join(' ')
    .split(' ')
    .filter(cls => cls.length > 0);

  // Calculate complexity score based on various factors
  const complexityScore = Math.min(100, 
    (code.length / 50) + // Length factor
    (hasInteractivity ? 20 : 0) + // Interactivity
    (usesHooks ? 15 : 0) + // Hooks usage
    (tailwindClasses.length / 2) + // Styling complexity
    (hasAccessibilityFeatures ? 10 : 0) // Accessibility features
  );

  return {
    componentType,
    hasInteractivity,
    usesHooks,
    hasAccessibilityFeatures,
    tailwindClasses,
    complexityScore
  };
}

/**
 * Validates accessibility compliance (WCAG 2.1 AA)
 */
export function validateAccessibility(code: string, analysis: ComponentAnalysis): { score: number; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let score = 100;

  // Check for semantic HTML
  if (!code.includes('<main') && !code.includes('<section') && !code.includes('<article') && 
      !code.includes('<nav') && !code.includes('<header') && !code.includes('<footer')) {
    if (analysis.componentType !== 'display') {
      errors.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Consider using semantic HTML elements (main, section, nav, etc.)',
        rule: 'semantic-html'
      });
      score -= 10;
    }
  }

  // Check for ARIA attributes where needed
  if (analysis.hasInteractivity && !analysis.hasAccessibilityFeatures) {
    errors.push({
      type: 'accessibility',
      severity: 'error',
      message: 'Interactive components should include ARIA attributes',
      rule: 'aria-attributes'
    });
    score -= 20;
  }

  // Check for images without alt text
  const imgMatches = code.match(/<img[^>]*>/g) || [];
  imgMatches.forEach(img => {
    if (!img.includes('alt=')) {
      errors.push({
        type: 'accessibility',
        severity: 'error',
        message: 'Images must have alt attributes',
        rule: 'img-alt'
      });
      score -= 15;
    }
  });

  // Check for form inputs without labels
  if (analysis.componentType === 'form') {
    if (code.includes('<input') && !code.includes('htmlFor') && !code.includes('aria-label')) {
      errors.push({
        type: 'accessibility',
        severity: 'error',
        message: 'Form inputs should have associated labels',
        rule: 'form-labels'
      });
      score -= 15;
    }
  }

  // Check for color contrast indicators (basic heuristic)
  const hasLightText = analysis.tailwindClasses.some(cls => cls.includes('text-white') || cls.includes('text-gray-100'));
  const hasDarkBackground = analysis.tailwindClasses.some(cls => cls.includes('bg-gray-900') || cls.includes('bg-black'));
  
  if (hasLightText && !hasDarkBackground) {
    errors.push({
      type: 'accessibility',
      severity: 'warning',
      message: 'Verify color contrast ratios meet WCAG standards',
      rule: 'color-contrast'
    });
    score -= 5;
  }

  return { score: Math.max(0, score), errors };
}

/**
 * Validates design consistency with shadcn/ui patterns
 */
export function validateDesignConsistency(code: string, analysis: ComponentAnalysis): { score: number; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let score = 100;

  // Check for consistent spacing patterns
  const spacingClasses = analysis.tailwindClasses.filter(cls => /^(p|m|space)-/.test(cls));
  if (spacingClasses.length === 0 && code.length > 100) {
    errors.push({
      type: 'design',
      severity: 'warning',
      message: 'Consider using Tailwind spacing utilities for consistent spacing',
      rule: 'spacing-utilities'
    });
    score -= 10;
  }

  // Check for color scheme consistency (light theme preference)
  const darkColors = analysis.tailwindClasses.filter(cls => 
    cls.includes('bg-gray-900') || cls.includes('bg-black') || cls.includes('text-white')
  );
  const lightColors = analysis.tailwindClasses.filter(cls => 
    cls.includes('bg-white') || cls.includes('bg-gray-50') || cls.includes('text-gray-900')
  );

  if (darkColors.length > lightColors.length) {
    errors.push({
      type: 'design',
      severity: 'info',
      message: 'Component uses dark theme - consider light theme for consistency',
      rule: 'light-theme-preference'
    });
    score -= 5;
  }

  // Check for consistent border radius usage
  const hasRounded = analysis.tailwindClasses.some(cls => cls.includes('rounded'));
  if (!hasRounded && (analysis.componentType === 'interactive' || analysis.componentType === 'form')) {
    errors.push({
      type: 'design',
      severity: 'warning',
      message: 'Interactive components should use rounded corners for modern design',
      rule: 'border-radius'
    });
    score -= 8;
  }

  return { score: Math.max(0, score), errors };
}

/**
 * Validates performance considerations
 */
export function validatePerformance(code: string, analysis: ComponentAnalysis): { score: number; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let score = 100;

  // Check for excessive inline styles
  const inlineStyleMatches = code.match(/style\s*=\s*{[^}]*}/g) || [];
  if (inlineStyleMatches.length > 3) {
    errors.push({
      type: 'performance',
      severity: 'warning',
      message: 'Excessive inline styles can impact performance - consider using Tailwind classes',
      rule: 'inline-styles'
    });
    score -= 10;
  }

  // Check for large component size
  if (code.length > 2000) {
    errors.push({
      type: 'performance',
      severity: 'warning',
      message: 'Large component detected - consider breaking into smaller components',
      rule: 'component-size'
    });
    score -= 15;
  }

  // Check for missing useMemo/useCallback on complex computations
  if (analysis.usesHooks && analysis.complexityScore > 50) {
    if (!code.includes('useMemo') && !code.includes('useCallback')) {
      errors.push({
        type: 'performance',
        severity: 'info',
        message: 'Consider using useMemo/useCallback for performance optimization',
        rule: 'memoization'
      });
      score -= 5;
    }
  }

  return { score: Math.max(0, score), errors };
}

/**
 * Main quality validation function
 */
export async function validateComponentQuality(code: string): Promise<QualityValidationResult> {
  const analysis = analyzeComponent(code);
  const tsValidation = validateTypeScriptCode(code);
  const accessibilityResult = validateAccessibility(code, analysis);
  const designResult = validateDesignConsistency(code, analysis);
  const performanceResult = validatePerformance(code, analysis);
  
  // Phase 2: Visual quality validation
  const visualQuality = await validateVisualQuality(code);

  // Combine all validation errors including visual quality issues
  const allErrors = [
    ...tsValidation.errors,
    ...accessibilityResult.errors,
    ...designResult.errors,
    ...performanceResult.errors,
    ...visualQuality.colorContrastIssues,
    ...visualQuality.responsiveValidation.flatMap(r => r.issues)
  ];

  // Calculate quality score including visual consistency
  const codeQuality = tsValidation.success ? 
    Math.max(0, 100 - (tsValidation.errors.length * 10)) : 
    Math.max(0, 50 - (tsValidation.errors.filter(e => e.severity === 'error').length * 15));

  // Incorporate visual consistency into design score
  const enhancedDesignScore = Math.round((designResult.score + visualQuality.visualConsistencyScore) / 2);

  const qualityScore: ComponentQualityScore = {
    codeQuality,
    accessibility: accessibilityResult.score,
    designConsistency: enhancedDesignScore,
    performance: performanceResult.score,
    overall: Math.round((codeQuality + accessibilityResult.score + enhancedDesignScore + performanceResult.score) / 4)
  };

  return {
    qualityScore,
    validationErrors: allErrors,
    accessibilityScore: accessibilityResult.score,
    isValid: tsValidation.success && allErrors.filter(e => e.severity === 'error').length === 0,
    compilationSuccess: tsValidation.success,
    visualQuality
  };
}
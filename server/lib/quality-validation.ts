import * as ts from 'typescript';
import type { ComponentQualityScore, ValidationError } from '../../shared/schema.js';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  qualityScore: ComponentQualityScore;
  compiledCode?: string;
}

/**
 * Validates TypeScript code compilation and returns errors
 */
export function validateTypeScript(code: string): { errors: ValidationError[]; isValid: boolean } {
  const errors: ValidationError[] = [];
  
  try {
    // Create a TypeScript compiler host
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    };

    // Add React types to the code implicitly
    const wrappedCode = `
import React from 'react';
${code}
`;

    // Create source file
    const sourceFile = ts.createSourceFile(
      'component.tsx',
      wrappedCode,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.TSX
    );

    // Create program
    const program = ts.createProgram(['component.tsx'], compilerOptions, {
      getSourceFile: (fileName) => fileName === 'component.tsx' ? sourceFile : undefined,
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
    });

    // Get diagnostics
    const diagnostics = ts.getPreEmitDiagnostics(program);

    for (const diagnostic of diagnostics) {
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        
        errors.push({
          type: 'typescript',
          message,
          line: line + 1,
          column: character + 1,
          severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
        });
      }
    }
  } catch (error) {
    errors.push({
      type: 'typescript',
      message: `Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
  }

  return {
    errors: errors.filter(e => e.severity === 'error'), // Only return errors, not warnings
    isValid: errors.filter(e => e.severity === 'error').length === 0,
  };
}

/**
 * Validates React component code for best practices
 */
export function validateReactBestPractices(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for common React anti-patterns
  if (code.includes('document.getElementById') || code.includes('document.querySelector')) {
    errors.push({
      type: 'eslint',
      message: 'Avoid direct DOM manipulation in React components. Use refs or state management instead.',
      severity: 'warning',
    });
  }

  // Check for missing key props in lists
  if (code.includes('.map(') && !code.includes('key=')) {
    errors.push({
      type: 'eslint',
      message: 'Missing key prop in list items. Each child in a list should have a unique key prop.',
      severity: 'warning',
    });
  }

  // Check for inline event handlers (performance concern)
  const inlineHandlerPattern = /\w+={(.*?)=>/g;
  const matches = code.match(inlineHandlerPattern);
  if (matches && matches.length > 3) {
    errors.push({
      type: 'eslint',
      message: 'Consider extracting inline event handlers to improve performance.',
      severity: 'info',
    });
  }

  return errors;
}

/**
 * Validates accessibility best practices
 */
export function validateAccessibility(code: string): { errors: ValidationError[]; score: number } {
  const errors: ValidationError[] = [];
  let score = 100;

  // Check for alt text on images
  const imgPattern = /<img[^>]*>/g;
  const imgMatches = code.match(imgPattern) || [];
  for (const img of imgMatches) {
    if (!img.includes('alt=')) {
      errors.push({
        type: 'accessibility',
        message: 'Image elements must have alt text for accessibility.',
        severity: 'error',
      });
      score -= 15;
    }
  }

  // Check for form labels
  const inputPattern = /<input[^>]*>/g;
  const inputMatches = code.match(inputPattern) || [];
  const labelPattern = /<label[^>]*>/g;
  const labelMatches = code.match(labelPattern) || [];
  
  if (inputMatches.length > labelMatches.length) {
    errors.push({
      type: 'accessibility',
      message: 'Form inputs should be associated with labels for accessibility.',
      severity: 'warning',
    });
    score -= 10;
  }

  // Check for semantic HTML
  if (code.includes('<div') && !code.includes('<main') && !code.includes('<section') && !code.includes('<article')) {
    errors.push({
      type: 'accessibility',
      message: 'Consider using semantic HTML elements (main, section, article) instead of div for better accessibility.',
      severity: 'info',
    });
    score -= 5;
  }

  // Check for button accessibility
  const buttonPattern = /onClick.*?=/g;
  const buttonMatches = code.match(buttonPattern) || [];
  const actualButtonPattern = /<button[^>]*>/g;
  const actualButtonMatches = code.match(actualButtonPattern) || [];
  
  if (buttonMatches.length > actualButtonMatches.length) {
    errors.push({
      type: 'accessibility',
      message: 'Use button elements for clickable actions instead of divs with onClick handlers.',
      severity: 'warning',
    });
    score -= 10;
  }

  return { errors, score: Math.max(0, score) };
}

/**
 * Calculates code quality score based on various metrics
 */
export function calculateCodeQuality(code: string, tsValidation: { isValid: boolean; errors: ValidationError[] }): number {
  let score = 100;

  // TypeScript compliance (40% weight)
  if (!tsValidation.isValid) {
    score -= tsValidation.errors.length * 10;
  }

  // Code length and complexity (20% weight)
  const lines = code.split('\n').length;
  if (lines > 200) {
    score -= 15; // Very long components
  } else if (lines > 100) {
    score -= 5; // Moderately long components
  }

  // React best practices (30% weight)
  const reactErrors = validateReactBestPractices(code);
  score -= reactErrors.filter(e => e.severity === 'error').length * 10;
  score -= reactErrors.filter(e => e.severity === 'warning').length * 5;

  // Code structure (10% weight)
  if (!code.includes('function ') && !code.includes('const ')) {
    score -= 10; // No clear component definition
  }

  if (!code.includes('render(')) {
    score -= 5; // Missing render call
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates design consistency score based on Tailwind/shadcn patterns
 */
export function calculateDesignConsistency(code: string): number {
  let score = 100;

  // Check for Tailwind CSS usage
  if (!code.includes('className=')) {
    score -= 20; // No styling
  }

  // Check for consistent spacing patterns
  const spacingPatterns = ['p-', 'm-', 'px-', 'py-', 'mx-', 'my-'];
  const hasSpacing = spacingPatterns.some(pattern => code.includes(pattern));
  if (!hasSpacing) {
    score -= 15;
  }

  // Check for color consistency (using standard Tailwind colors)
  const colorPatterns = ['bg-', 'text-', 'border-'];
  const hasColors = colorPatterns.some(pattern => code.includes(pattern));
  if (!hasColors) {
    score -= 10;
  }

  // Check for responsive design patterns
  const responsivePatterns = ['sm:', 'md:', 'lg:', 'xl:'];
  const hasResponsive = responsivePatterns.some(pattern => code.includes(pattern));
  if (!hasResponsive) {
    score -= 10;
  }

  // Check for modern design patterns
  if (!code.includes('rounded') && !code.includes('shadow')) {
    score -= 10; // No modern styling
  }

  return Math.max(0, score);
}

/**
 * Calculates performance score based on code analysis
 */
export function calculatePerformance(code: string): number {
  let score = 100;

  // Check for heavy operations in render
  if (code.includes('JSON.parse') || code.includes('JSON.stringify')) {
    score -= 15; // Heavy operations that should be memoized
  }

  // Check for inline objects/arrays that cause re-renders
  const inlineObjectPattern = /=\s*\{[^}]*\}/g;
  const inlineObjects = code.match(inlineObjectPattern) || [];
  if (inlineObjects.length > 3) {
    score -= 10;
  }

  // Check for expensive operations
  if (code.includes('sort(') || code.includes('filter(') || code.includes('reduce(')) {
    score -= 5; // Array operations that might need memoization
  }

  // Check for proper React optimization patterns
  if (code.includes('useMemo') || code.includes('useCallback')) {
    score += 10; // Bonus for using optimization hooks
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Main validation function that combines all quality checks
 */
export async function validateGeneratedCode(code: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  
  // TypeScript validation
  const tsValidation = validateTypeScript(code);
  errors.push(...tsValidation.errors);
  
  // React best practices
  const reactErrors = validateReactBestPractices(code);
  errors.push(...reactErrors);
  
  // Accessibility validation
  const accessibilityValidation = validateAccessibility(code);
  errors.push(...accessibilityValidation.errors);
  
  // Calculate quality scores
  const codeQuality = calculateCodeQuality(code, tsValidation);
  const accessibility = accessibilityValidation.score;
  const designConsistency = calculateDesignConsistency(code);
  const performance = calculatePerformance(code);
  
  // Calculate weighted overall score
  const overall = Math.round(
    codeQuality * 0.4 +
    accessibility * 0.3 +
    designConsistency * 0.2 +
    performance * 0.1
  );
  
  const qualityScore: ComponentQualityScore = {
    codeQuality,
    accessibility,
    designConsistency,
    performance,
    overall,
  };
  
  return {
    isValid: tsValidation.isValid && errors.filter(e => e.severity === 'error').length === 0,
    errors,
    qualityScore,
  };
}
/**
 * Phase 2: Visual Quality Assurance
 * Responsive design validation, screenshot comparison, and color contrast validation
 */

import type { ValidationError } from '@shared/schema';

export interface ResponsiveBreakpoint {
  name: string;
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface ResponsiveValidationResult {
  breakpoint: ResponsiveBreakpoint;
  isValid: boolean;
  issues: ValidationError[];
  recommendations: string[];
}

export interface VisualQualityResult {
  responsiveValidation: ResponsiveValidationResult[];
  colorContrastIssues: ValidationError[];
  visualConsistencyScore: number;
  recommendations: string[];
}

// Standard responsive breakpoints for validation
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { name: 'mobile-sm', width: 320, height: 568, deviceType: 'mobile' },
  { name: 'mobile-lg', width: 414, height: 736, deviceType: 'mobile' },
  { name: 'tablet', width: 768, height: 1024, deviceType: 'tablet' },
  { name: 'desktop-sm', width: 1024, height: 768, deviceType: 'desktop' },
  { name: 'desktop-lg', width: 1440, height: 900, deviceType: 'desktop' }
];

/**
 * Validates responsive design patterns in component code
 */
export function validateResponsiveDesign(code: string): ResponsiveValidationResult[] {
  return RESPONSIVE_BREAKPOINTS.map(breakpoint => {
    const issues: ValidationError[] = [];
    const recommendations: string[] = [];

    // Check for responsive classes
    const hasResponsiveClasses = /\b(sm|md|lg|xl|2xl):/g.test(code);
    if (!hasResponsiveClasses && breakpoint.deviceType !== 'desktop') {
      issues.push({
        type: 'design',
        severity: 'warning',
        message: `No responsive classes found for ${breakpoint.deviceType} devices`,
        rule: 'responsive-design'
      });
      recommendations.push(`Add ${breakpoint.name}: prefixed classes for better ${breakpoint.deviceType} experience`);
    }

    // Check for fixed widths that might not work on mobile
    const fixedWidthMatches = code.match(/\bw-\[\d+px\]/g);
    if (fixedWidthMatches && breakpoint.deviceType === 'mobile') {
      issues.push({
        type: 'design',
        severity: 'warning',
        message: 'Fixed pixel widths detected - may not work well on mobile',
        rule: 'mobile-friendly-widths'
      });
      recommendations.push('Use relative widths (w-full, w-1/2) or responsive classes instead of fixed pixel widths');
    }

    // Check for appropriate text sizes
    const hasSmallText = /\btext-xs\b/g.test(code);
    if (hasSmallText && breakpoint.deviceType === 'mobile') {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Very small text detected - may be hard to read on mobile',
        rule: 'mobile-text-size'
      });
      recommendations.push('Consider using sm:text-xs md:text-sm for better mobile readability');
    }

    // Check for touch-friendly interactions
    const hasButtons = /\b(button|btn|onClick)\b/gi.test(code);
    if (hasButtons && breakpoint.deviceType === 'mobile') {
      const hasTouchFriendlySize = /\b(p-[3-9]|py-[3-9]|px-[3-9]|h-\d+|min-h-\d+)\b/g.test(code);
      if (!hasTouchFriendlySize) {
        issues.push({
          type: 'accessibility',
          severity: 'warning',
          message: 'Interactive elements may be too small for touch devices',
          rule: 'touch-target-size'
        });
        recommendations.push('Ensure interactive elements have minimum 44px touch targets (p-3 or h-11)');
      }
    }

    // Check for horizontal scrolling issues
    const hasWideElements = /\b(w-screen|min-w-\[|\w+-\[\d{4,}px\])/g.test(code);
    if (hasWideElements && breakpoint.width < 768) {
      issues.push({
        type: 'design',
        severity: 'warning',
        message: 'Wide elements detected that may cause horizontal scrolling',
        rule: 'horizontal-scroll'
      });
      recommendations.push('Use overflow-x-auto or responsive sizing to prevent horizontal scrolling');
    }

    return {
      breakpoint,
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations
    };
  });
}

/**
 * Validates color contrast ratios for accessibility
 */
export function validateColorContrast(code: string): ValidationError[] {
  const issues: ValidationError[] = [];

  // Common problematic color combinations
  const contrastIssues = [
    { bg: 'bg-gray-100', text: 'text-gray-400', ratio: 2.6 },
    { bg: 'bg-white', text: 'text-gray-300', ratio: 2.8 },
    { bg: 'bg-yellow-100', text: 'text-yellow-400', ratio: 3.2 },
    { bg: 'bg-blue-100', text: 'text-blue-300', ratio: 3.1 },
    { bg: 'bg-gray-900', text: 'text-gray-600', ratio: 4.1 }
  ];

  contrastIssues.forEach(({ bg, text, ratio }) => {
    if (code.includes(bg) && code.includes(text)) {
      if (ratio < 4.5) {
        issues.push({
          type: 'accessibility',
          severity: 'error',
          message: `Low contrast ratio (${ratio}:1) between ${bg} and ${text}`,
          rule: 'color-contrast'
        });
      } else if (ratio < 7) {
        issues.push({
          type: 'accessibility',
          severity: 'warning',
          message: `Moderate contrast ratio (${ratio}:1) - consider higher contrast for AAA compliance`,
          rule: 'color-contrast'
        });
      }
    }
  });

  // Check for custom colors that might have contrast issues
  const customColorMatches = code.match(/\[(#[0-9a-fA-F]{6}|rgb\([\d,\s]+\))\]/g);
  if (customColorMatches) {
    issues.push({
      type: 'accessibility',
      severity: 'info',
      message: 'Custom colors detected - please verify contrast ratios manually',
      rule: 'custom-color-contrast'
    });
  }

  return issues;
}

/**
 * Validates visual consistency patterns
 */
export function validateVisualConsistency(code: string): { score: number; issues: ValidationError[] } {
  const issues: ValidationError[] = [];
  let score = 100;

  // Check for consistent spacing patterns
  const spacingClasses = code.match(/\b(p|m|space)-[\w-]+/g) || [];
  const uniqueSpacingValues = new Set(spacingClasses);
  
  if (uniqueSpacingValues.size > 8) {
    issues.push({
      type: 'design',
      severity: 'warning',
      message: 'Too many different spacing values - consider using a consistent spacing scale',
      rule: 'spacing-consistency'
    });
    score -= 10;
  }

  // Check for consistent border radius usage
  const borderRadiusClasses = code.match(/\brounded[\w-]*/g) || [];
  const uniqueBorderRadius = new Set(borderRadiusClasses);
  
  if (uniqueBorderRadius.size > 4) {
    issues.push({
      type: 'design',
      severity: 'warning',
      message: 'Inconsistent border radius usage - stick to 2-3 radius values',
      rule: 'border-radius-consistency'
    });
    score -= 8;
  }

  // Check for consistent color scheme
  const colorClasses = code.match(/\b(bg|text|border)-[\w-]+/g) || [];
  const colorSchemes = {
    gray: colorClasses.filter(c => c.includes('gray')).length,
    blue: colorClasses.filter(c => c.includes('blue')).length,
    green: colorClasses.filter(c => c.includes('green')).length,
    red: colorClasses.filter(c => c.includes('red')).length,
    yellow: colorClasses.filter(c => c.includes('yellow')).length
  };

  const activeSchemes = Object.values(colorSchemes).filter(count => count > 0).length;
  if (activeSchemes > 4) {
    issues.push({
      type: 'design',
      severity: 'warning',
      message: 'Too many color schemes - consider limiting to 2-3 primary colors',
      rule: 'color-scheme-consistency'
    });
    score -= 12;
  }

  // Check for consistent typography
  const textSizeClasses = code.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/g) || [];
  const uniqueTextSizes = new Set(textSizeClasses);
  
  if (uniqueTextSizes.size > 6) {
    issues.push({
      type: 'design',
      severity: 'warning',
      message: 'Too many text sizes - consider using a typographic scale',
      rule: 'typography-consistency'
    });
    score -= 10;
  }

  // Check for consistent component structure
  const hasConsistentStructure = checkComponentStructure(code);
  if (!hasConsistentStructure) {
    issues.push({
      type: 'design',
      severity: 'info',
      message: 'Consider organizing elements with consistent structure patterns',
      rule: 'component-structure'
    });
    score -= 5;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * Helper function to check component structure consistency
 */
function checkComponentStructure(code: string): boolean {
  // Check for semantic structure
  const hasSemanticElements = /\b(header|main|section|article|aside|nav|footer)\b/g.test(code);
  const hasContainerElements = /\b(container|wrapper|content)\b/gi.test(code);
  
  // Look for consistent naming patterns
  const classNames = code.match(/className="([^"]*)"/g) || [];
  const hasConsistentNaming = classNames.some(className => 
    className.includes('flex') || 
    className.includes('grid') || 
    className.includes('space-')
  );

  return hasSemanticElements || hasContainerElements || hasConsistentNaming;
}

/**
 * Main visual quality validation function
 */
export async function validateVisualQuality(code: string): Promise<VisualQualityResult> {
  const responsiveValidation = validateResponsiveDesign(code);
  const colorContrastIssues = validateColorContrast(code);
  const visualConsistencyResult = validateVisualConsistency(code);

  // Calculate overall recommendations
  const recommendations: string[] = [];
  
  // Responsive recommendations
  const responsiveIssues = responsiveValidation.flatMap(r => r.issues);
  if (responsiveIssues.length > 0) {
    recommendations.push('Implement responsive design patterns for all device types');
  }

  // Color contrast recommendations
  if (colorContrastIssues.length > 0) {
    recommendations.push('Review color combinations for WCAG AA compliance (4.5:1 contrast ratio)');
  }

  // Visual consistency recommendations
  if (visualConsistencyResult.score < 80) {
    recommendations.push('Establish and follow a consistent design system');
  }

  // Specific device recommendations
  const mobileIssues = responsiveValidation
    .filter(r => r.breakpoint.deviceType === 'mobile')
    .flatMap(r => r.issues);
  
  if (mobileIssues.length > 0) {
    recommendations.push('Optimize component for mobile devices with touch-friendly interactions');
  }

  return {
    responsiveValidation,
    colorContrastIssues,
    visualConsistencyScore: visualConsistencyResult.score,
    recommendations
  };
}

/**
 * Screenshot comparison utilities (placeholder for future implementation)
 * This would require browser automation tools like Puppeteer or Playwright
 */
export interface ScreenshotComparisonResult {
  similarity: number;
  differences: {
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
  }[];
  passed: boolean;
}

export async function compareComponentScreenshots(
  originalComponent: string,
  updatedComponent: string,
  breakpoint: ResponsiveBreakpoint
): Promise<ScreenshotComparisonResult> {
  // Placeholder implementation
  // In a real implementation, this would:
  // 1. Render both components in a headless browser
  // 2. Take screenshots at the specified breakpoint
  // 3. Compare pixel differences
  // 4. Return similarity score and difference highlights
  
  return {
    similarity: 95,
    differences: [],
    passed: true
  };
}

/**
 * Generate responsive design test cases
 */
export function generateResponsiveTestCases(code: string) {
  return RESPONSIVE_BREAKPOINTS.map(breakpoint => ({
    breakpoint,
    testCode: `
// Test case for ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})
function ${breakpoint.name}Test() {
  return (
    <div style={{ width: '${breakpoint.width}px', height: '${breakpoint.height}px' }}>
      ${code.replace(/^function\s+\w+/, 'function TestComponent')}
    </div>
  );
}
    `.trim()
  }));
}
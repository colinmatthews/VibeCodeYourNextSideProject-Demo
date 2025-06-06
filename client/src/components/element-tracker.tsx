import { useMemo } from 'react';

interface ElementTrackerProps {
  code: string;
  onCodeUpdate?: (newCode: string) => void;
}

export function ElementTracker({ code, onCodeUpdate }: ElementTrackerProps) {
  // For now, let's just return the original code without modification
  // We'll handle element tracking differently
  const trackedCode = useMemo(() => {
    return code;
  }, [code]);

  return { trackedCode };
}

function addElementPaths(code: string): string {
  // Add data-element-path attributes to JSX elements
  let pathCounter = 0;
  
  // This regex matches JSX opening tags (both self-closing and regular)
  const jsxElementRegex = /<(\w+)(\s[^>]*?)?(\/?)>/g;
  
  return code.replace(jsxElementRegex, (match, tagName, attributes = '', selfClosing = '') => {
    const path = `element-${pathCounter++}`;
    
    // Check if data-element-path already exists
    if (attributes && attributes.includes('data-element-path')) {
      return match;
    }
    
    // Ensure proper spacing for attributes
    const spacer = attributes && !attributes.startsWith(' ') ? ' ' : '';
    const dataAttribute = ` data-element-path="${path}"`;
    
    // Handle self-closing tags differently
    if (selfClosing) {
      return `<${tagName}${attributes}${dataAttribute} />`;
    } else {
      return `<${tagName}${attributes}${dataAttribute}>`;
    }
  });
}

export function updateElementStyles(code: string, elementPath: string, styles: Record<string, string>): string {
  // Convert styles to React style object format
  const styleObject = Object.entries(styles)
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => `${key}: '${value}'`)
    .join(', ');

  if (!styleObject) return code;

  const styleString = `{{${styleObject}}}`;

  // Find the element with the specific data-element-path and update/add style attribute
  // Handle both existing style attributes (string or object) and elements without styles
  // Use a more robust pattern that matches React style objects with double braces
  const elementRegex = new RegExp(
    `(<[^>]*data-element-path="${elementPath}"[^>]*?)(?:\\s+style=(?:["'][^"']*["']|\\{\\{[^}]+\\}\\}))?([^>]*>)`,
    'g'
  );

  return code.replace(elementRegex, `$1 style=${styleString}$2`);
} 
import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Palette, Move, Type, Layers } from 'lucide-react';

interface SelectedElement {
  element: HTMLElement;
  rect: DOMRect;
  tagName: string;
  className: string;
  id: string;
  dataPath?: string;
}

interface CSSProperties {
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  padding: string;
  margin: string;
  borderRadius: string;
  border: string;
  opacity: string;
  transform: string;
  width: string;
  height: string;
}

interface UISelectorProps {
  isActive: boolean;
  onClose: () => void;
  componentId?: string;
  componentCode?: string;
  onCodeUpdate?: (componentId: string, newCode: string) => void;
}

export function UISelector({ isActive, onClose, componentId, componentCode, onCodeUpdate }: UISelectorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [cssProperties, setCssProperties] = useState<CSSProperties>({
    backgroundColor: '',
    color: '',
    fontSize: '',
    fontWeight: '',
    padding: '',
    margin: '',
    borderRadius: '',
    border: '',
    opacity: '',
    transform: '',
    width: '',
    height: ''
  });
  const [originalCode, setOriginalCode] = useState<string>('');
  const [currentWorkingCode, setCurrentWorkingCode] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      // Save changes before deactivating if there are unsaved changes
      if (hasUnsavedChanges && componentId && onCodeUpdate && currentWorkingCode) {
        console.log('Saving changes before deactivating UI selector');
        onCodeUpdate(componentId, currentWorkingCode);
        setHasUnsavedChanges(false);
      }
      
      setSelectedElement(null);
      setHoveredElement(null);
      return;
    }

    // Store original code when selector becomes active for a new component
    if (componentCode && componentCode !== originalCode) {
      setOriginalCode(componentCode);
      setCurrentWorkingCode(componentCode);
      setHasUnsavedChanges(false);
      console.log('Original code stored for component:', componentId, componentCode.substring(0, 200) + '...');
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (selectedElement) return;
      
      const target = e.target as HTMLElement;
      if (target === overlayRef.current || target.closest('.ui-selector-overlay')) {
        return;
      }

      // Only target elements within the component preview
      const componentPreview = document.querySelector('.component-preview-area');
      if (!componentPreview || !componentPreview.contains(target)) {
        setHoveredElement(null);
        return;
      }
      
      setHoveredElement(target);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === overlayRef.current || target.closest('.ui-selector-overlay')) {
        return;
      }

      // Only target elements within the component preview
      const componentPreview = document.querySelector('.component-preview-area');
      if (!componentPreview || !componentPreview.contains(target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(target);
      
      setSelectedElement({
        element: target,
        rect,
        tagName: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id,
        dataPath: target.getAttribute('data-element-path') || undefined
      });

      // Extract current CSS properties
      setCssProperties({
        backgroundColor: rgbToHex(computedStyle.backgroundColor) || '',
        color: rgbToHex(computedStyle.color) || '',
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
        borderRadius: computedStyle.borderRadius,
        border: computedStyle.border,
        opacity: computedStyle.opacity,
        transform: computedStyle.transform,
        width: computedStyle.width,
        height: computedStyle.height
      });

      setHoveredElement(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isActive, selectedElement, componentCode, originalCode, componentId, onCodeUpdate, hasUnsavedChanges, currentWorkingCode]);

  // Update working code when component code changes from external source
  useEffect(() => {
    if (componentCode && isActive && componentCode !== currentWorkingCode && !hasUnsavedChanges) {
      setOriginalCode(componentCode);
      setCurrentWorkingCode(componentCode);
      console.log('Updated working code from external change:', componentCode.substring(0, 200) + '...');
    }
  }, [componentCode, isActive, currentWorkingCode, hasUnsavedChanges]);

  const rgbToHex = (rgb: string): string => {
    if (rgb.startsWith('#')) return rgb;
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '';
    
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const updateCSSProperty = (property: keyof CSSProperties, value: string) => {
    if (!selectedElement) return;

    setCssProperties(prev => ({ ...prev, [property]: value }));
    
    // Apply the change immediately to the DOM
    const element = selectedElement.element;
    (element.style as any)[property] = value;

    // Update the working code and mark as having unsaved changes
    updateComponentCode();
    setHasUnsavedChanges(true);
  };

  const updateComponentCode = () => {
    if (!componentId || !selectedElement || !currentWorkingCode) return;

    // Create a style object from current CSS properties
    const styles: { [key: string]: string } = {};
    
    Object.entries(cssProperties).forEach(([key, value]) => {
      if (value && value.trim()) {
        styles[key] = value;
      }
    });

    // Update the working code
    const updatedCode = addInlineStylesToElement(currentWorkingCode, selectedElement, styles);
    
    // Debug logging
    console.log('Updating working code:', {
      componentId,
      originalLength: currentWorkingCode.length,
      updatedLength: updatedCode.length,
      styles,
      element: selectedElement
    });
    
    setCurrentWorkingCode(updatedCode);
    
    // Immediately call onCodeUpdate to persist changes
    if (onCodeUpdate) {
      onCodeUpdate(componentId, updatedCode);
    }
  };

  const saveChanges = () => {
    if (componentId && onCodeUpdate && currentWorkingCode) {
      console.log('Manually saving changes');
      onCodeUpdate(componentId, currentWorkingCode);
      setOriginalCode(currentWorkingCode); // Update original to current working version
      setHasUnsavedChanges(false);
    }
  };

  const revertChanges = () => {
    if (originalCode) {
      console.log('Reverting changes to original code');
      setCurrentWorkingCode(originalCode);
      setHasUnsavedChanges(false);
      if (componentId && onCodeUpdate) {
        onCodeUpdate(componentId, originalCode);
      }
      // Reset selected element to refresh its properties
      setSelectedElement(null);
    }
  };

  const addInlineStylesToElement = (code: string, element: SelectedElement, styles: Record<string, string>): string => {
    // Convert styles to React style object format
    const styleObject = Object.entries(styles)
      .filter(([_, value]) => value && value.trim())
      .map(([key, value]) => `${key}: '${value}'`)
      .join(', ');

    if (!styleObject) return code;

    const styleString = `{{${styleObject}}}`;

    // Try to match the element by its characteristics and handle both existing styles and no styles
    let targetPattern = '';
    let matchDescription = '';
    
    if (element.id) {
      // Match by ID - escape special regex characters
      const escapedId = element.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match both existing style attributes (string or object) and elements without styles
      // Use a more robust pattern that matches balanced braces for React style objects
      targetPattern = `(<${element.tagName}[^>]*?\\bid\\s*=\\s*["']${escapedId}["'][^>]*?)(?:\\s+style\\s*=\\s*(?:["'][^"']*["']|\\{\\{[^}]+\\}\\}))?([^>]*?>)`;
      matchDescription = `by ID: ${element.id}`;
    } else if (element.className) {
      // Match by first class name - escape special regex characters
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        const firstClass = classes[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        targetPattern = `(<${element.tagName}[^>]*?\\bclassName\\s*=\\s*["'][^"']*\\b${firstClass}\\b[^"']*["'][^>]*?)(?:\\s+style\\s*=\\s*(?:["'][^"']*["']|\\{\\{[^}]+\\}\\}))?([^>]*?>)`;
        matchDescription = `by class: ${firstClass}`;
      }
    } else {
      // Fallback: match first occurrence of the tag
      targetPattern = `(<${element.tagName}(?:\\s[^>]*?)?)(?:\\s+style\\s*=\\s*(?:["'][^"']*["']|\\{\\{[^}]+\\}\\}))?([^>]*?>)`;
      matchDescription = `by tag: ${element.tagName}`;
    }

    console.log('Attempting to match element:', {
      pattern: targetPattern,
      description: matchDescription,
      element: element,
      styleString
    });

    if (targetPattern) {
      const regex = new RegExp(targetPattern, 'gi');
      const matches = code.match(regex);
      console.log('Pattern matches found:', matches?.length || 0);
      
      if (matches && matches.length > 0) {
        const result = code.replace(regex, `$1 style=${styleString}$2`);
        console.log('Code updated successfully');
        return result;
      } else {
        console.log('No matches found for pattern');
      }
    }

    console.log('Returning original code unchanged');
    return code;
  };

  const getElementDescription = (element: SelectedElement) => {
    let description = element.tagName;
    if (element.id) description += `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        description += `.${classes.slice(0, 2).join('.')}${classes.length > 2 ? '...' : ''}`;
      }
    }
    return description;
  };

  if (!isActive) return null;

  // Get the preview container bounds for relative positioning
  const getRelativePosition = (elementRect: DOMRect) => {
    const previewContainer = document.querySelector('.component-preview-area');
    if (!previewContainer) {
      return { left: elementRect.left, top: elementRect.top };
    }
    
    const containerRect = previewContainer.getBoundingClientRect();
    return {
      left: elementRect.left - containerRect.left,
      top: elementRect.top - containerRect.top
    };
  };

  return (
    <>
      {/* Highlights - positioned relative to component preview */}
      <div className="ui-selector-overlay absolute inset-0 z-50 pointer-events-none">
        {/* Hover Highlight */}
        {hoveredElement && !selectedElement && (() => {
          const rect = hoveredElement.getBoundingClientRect();
          const pos = getRelativePosition(rect);
          return (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          );
        })()}

        {/* Selection Highlight */}
        {selectedElement && (() => {
          const pos = getRelativePosition(selectedElement.rect);
          return (
            <div
              className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: selectedElement.rect.width,
                height: selectedElement.rect.height,
              }}
            />
          );
        })()}
      </div>

      {/* Controls Panel */}
      <div className="h-full w-full p-4 overflow-y-auto">
        <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-400" />
              <h3 className="text-white font-medium">UI Selector</h3>
              {hasUnsavedChanges && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Unsaved changes" />
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedElement ? (
            <div className="space-y-4">
              {/* Element Info */}
              <div className="bg-gray-700 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">Selected Element</span>
                </div>
                <code className="text-xs text-indigo-300">
                  {getElementDescription(selectedElement)}
                </code>
              </div>

              {/* CSS Properties */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </h4>
                
                {/* Background Color */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Background</label>
                  <input
                    type="color"
                    value={cssProperties.backgroundColor || '#000000'}
                    onChange={(e) => updateCSSProperty('backgroundColor', e.target.value)}
                    className="w-8 h-6 rounded border border-gray-600"
                  />
                  <input
                    type="text"
                    value={cssProperties.backgroundColor}
                    onChange={(e) => updateCSSProperty('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="#ffffff"
                  />
                </div>

                {/* Text Color */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Color</label>
                  <input
                    type="color"
                    value={cssProperties.color || '#000000'}
                    onChange={(e) => updateCSSProperty('color', e.target.value)}
                    className="w-8 h-6 rounded border border-gray-600"
                  />
                  <input
                    type="text"
                    value={cssProperties.color}
                    onChange={(e) => updateCSSProperty('color', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="#000000"
                  />
                </div>

                {/* Typography */}
                <h4 className="text-sm font-medium text-white flex items-center gap-2 mt-4">
                  <Type className="h-4 w-4" />
                  Typography
                </h4>

                {/* Font Size */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Size</label>
                  <input
                    type="text"
                    value={cssProperties.fontSize}
                    onChange={(e) => updateCSSProperty('fontSize', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="16px"
                  />
                </div>

                {/* Font Weight */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Weight</label>
                  <select
                    value={cssProperties.fontWeight}
                    onChange={(e) => updateCSSProperty('fontWeight', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                  </select>
                </div>

                {/* Layout */}
                <h4 className="text-sm font-medium text-white flex items-center gap-2 mt-4">
                  <Move className="h-4 w-4" />
                  Layout
                </h4>

                {/* Padding */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Padding</label>
                  <input
                    type="text"
                    value={cssProperties.padding}
                    onChange={(e) => updateCSSProperty('padding', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="10px"
                  />
                </div>

                {/* Margin */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Margin</label>
                  <input
                    type="text"
                    value={cssProperties.margin}
                    onChange={(e) => updateCSSProperty('margin', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="10px"
                  />
                </div>

                {/* Border Radius */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Radius</label>
                  <input
                    type="text"
                    value={cssProperties.borderRadius}
                    onChange={(e) => updateCSSProperty('borderRadius', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="4px"
                  />
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-300 w-16">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={cssProperties.opacity || '1'}
                    onChange={(e) => updateCSSProperty('opacity', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-300 w-8">
                    {Math.round(parseFloat(cssProperties.opacity || '1') * 100)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-600">
                <button
                  onClick={() => setSelectedElement(null)}
                  className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  Deselect
                </button>
                {hasUnsavedChanges && (
                  <>
                    <button
                      onClick={saveChanges}
                      className="flex-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={revertChanges}
                      className="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Revert
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-2">
                <Eye className="h-8 w-8 mx-auto mb-2" />
              </div>
              <p className="text-sm text-gray-300">
                Click on any element to select and edit its properties
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
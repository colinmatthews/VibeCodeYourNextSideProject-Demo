import React, { useState, useEffect } from 'react'
import { X, Palette, Type, Move, Layers, Eye } from 'lucide-react'

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

interface UISelectorControlsProps {
  selectedElement: SelectedElement | null;
  onClose: () => void;
  componentId?: string;
  componentCode?: string;
  onCodeUpdate?: (componentId: string, newCode: string) => void;
}

export function UISelectorControls({ 
  selectedElement, 
  onClose, 
  componentId, 
  componentCode, 
  onCodeUpdate 
}: UISelectorControlsProps) {
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
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Extract current styles when element is selected
  useEffect(() => {
    if (!selectedElement) {
      setCssProperties({
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
      setHasUnsavedChanges(false);
      return;
    }

    const computedStyle = window.getComputedStyle(selectedElement.element);
    
    setCssProperties({
      backgroundColor: rgbToHex(computedStyle.backgroundColor) || '',
      color: rgbToHex(computedStyle.color) || '',
      fontSize: computedStyle.fontSize || '',
      fontWeight: computedStyle.fontWeight || '',
      padding: computedStyle.padding || '',
      margin: computedStyle.margin || '',
      borderRadius: computedStyle.borderRadius || '',
      border: computedStyle.border || '',
      opacity: computedStyle.opacity || '',
      transform: computedStyle.transform || '',
      width: computedStyle.width || '',
      height: computedStyle.height || ''
    });
    
    setHasUnsavedChanges(false);
  }, [selectedElement]);

  const rgbToHex = (rgb: string): string => {
    if (rgb.startsWith('#')) return rgb;
    if (rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff';
    
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return '#ffffff';
    
    const [r, g, b] = result.map(num => parseInt(num));
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const updateCSSProperty = (property: keyof CSSProperties, value: string) => {
    setCssProperties(prev => ({
      ...prev,
      [property]: value
    }));
    setHasUnsavedChanges(true);
  };

  const updateComponentCode = () => {
    if (!selectedElement || !componentCode || !componentId) return;

    try {
      const updatedCode = addInlineStylesToElement(componentCode, selectedElement, cssProperties);
      onCodeUpdate?.(componentId, updatedCode);
    } catch (error) {
      console.error('Error updating component code:', error);
    }
  };

  const saveChanges = () => {
    updateComponentCode();
    setHasUnsavedChanges(false);
  };

  const revertChanges = () => {
    if (selectedElement) {
      const computedStyle = window.getComputedStyle(selectedElement.element);
      setCssProperties({
        backgroundColor: rgbToHex(computedStyle.backgroundColor) || '',
        color: rgbToHex(computedStyle.color) || '',
        fontSize: computedStyle.fontSize || '',
        fontWeight: computedStyle.fontWeight || '',
        padding: computedStyle.padding || '',
        margin: computedStyle.margin || '',
        borderRadius: computedStyle.borderRadius || '',
        border: computedStyle.border || '',
        opacity: computedStyle.opacity || '',
        transform: computedStyle.transform || '',
        width: computedStyle.width || '',
        height: computedStyle.height || ''
      });
    }
    setHasUnsavedChanges(false);
  };

  const addInlineStylesToElement = (code: string, element: SelectedElement, styles: CSSProperties): string => {
    // Create a map of CSS properties to React style object properties
    const cssToReactMap: Record<string, string> = {
      'background-color': 'backgroundColor',
      'font-size': 'fontSize',
      'font-weight': 'fontWeight',
      'border-radius': 'borderRadius',
      'text-align': 'textAlign',
      'margin-top': 'marginTop',
      'margin-right': 'marginRight',
      'margin-bottom': 'marginBottom',
      'margin-left': 'marginLeft',
      'padding-top': 'paddingTop',
      'padding-right': 'paddingRight',
      'padding-bottom': 'paddingBottom',
      'padding-left': 'paddingLeft'
    };
    
    // Get element identifier - prefer id, then className, then tagName
    let elementSelector = '';
    if (element.id) {
      elementSelector = `id="${element.id}"`;
    } else if (element.className) {
      elementSelector = `className="${element.className}"`;
    } else {
      elementSelector = `<${element.tagName}`;
    }
    
    // Convert styles to React style object format
    const reactStyles: Record<string, string> = {};
    Object.entries(styles).forEach(([key, value]) => {
      if (value && value.trim()) {
        // Convert kebab-case to camelCase for React
        const reactKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        reactStyles[reactKey] = value;
      }
    });

    // Find the element in the code and add/update style attribute
    const tagRegex = new RegExp(`<${element.tagName}([^>]*?)>`, 'gi');
    
    return code.replace(tagRegex, (match, attributes) => {
      // Check if this is the element we want to modify
      const hasMatchingId = element.id && attributes.includes(`id="${element.id}"`);
      const hasMatchingClass = element.className && attributes.includes(`className="${element.className}"`);
      
      if (!hasMatchingId && !hasMatchingClass && (element.id || element.className)) {
        return match; // Not the right element
      }
      
      // Remove existing style attribute if present
      const withoutStyle = attributes.replace(/\s*style\s*=\s*(?:{[^}]*}|"[^"]*")/g, '');
      
      // Build new style object
      if (Object.keys(reactStyles).length > 0) {
        const styleString = JSON.stringify(reactStyles).replace(/"/g, "'");
        return `<${element.tagName}${withoutStyle} style={${styleString}}>`;
      } else {
        return `<${element.tagName}${withoutStyle}>`;
      }
    });
  };

  const getElementDescription = (element: SelectedElement) => {
    let desc = `<${element.tagName}`;
    if (element.id) desc += `#${element.id}`;
    if (element.className) desc += `.${element.className.split(' ').join('.')}`;
    desc += '>';
    return desc;
  };

  return (
    <div className="h-full w-full p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
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
              Click on any element in the preview to select and edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect } from 'react'

interface SelectedElement {
  element: HTMLElement;
  rect: DOMRect;
  tagName: string;
  className: string;
  id: string;
  dataPath?: string;
}

interface UISelectorHighlightsProps {
  isActive: boolean;
  onElementSelect?: (element: SelectedElement | null) => void;
}

export function UISelectorHighlights({ isActive, onElementSelect }: UISelectorHighlightsProps) {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      setSelectedElement(null);
      onElementSelect?.(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Only track elements within the component preview
      if (!target.closest('.component-preview-area')) {
        setHoveredElement(null);
        return;
      }
      
      // Skip highlighting the UI selector overlay itself
      if (target.closest('.ui-selector-overlay')) {
        return;
      }
      
      setHoveredElement(target);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Only track elements within the component preview
      if (!target.closest('.component-preview-area')) {
        return;
      }
      
      // Skip selecting the UI selector overlay itself
      if (target.closest('.ui-selector-overlay')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      const selectedEl: SelectedElement = {
        element: target,
        rect,
        tagName: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id || '',
        dataPath: target.getAttribute('data-path') || ''
      };

      setSelectedElement(selectedEl);
      onElementSelect?.(selectedEl);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [isActive, onElementSelect]);

  const getRelativePosition = (elementRect: DOMRect) => {
    const previewArea = document.querySelector('.component-preview-area');
    if (!previewArea) return { left: 0, top: 0 };
    
    const previewRect = previewArea.getBoundingClientRect();
    return {
      left: elementRect.left - previewRect.left,
      top: elementRect.top - previewRect.top,
    };
  };

  if (!isActive) return null;

  return (
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
  );
} 
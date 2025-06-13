/**
 * Phase 2: ValidationErrors - Comprehensive error reporting with severity levels
 * Displays detailed validation issues with categories, severity, and actionable information
 */

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import type { ValidationError } from '@shared/schema';

interface ValidationErrorsProps {
  errors: ValidationError[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxHeight?: string;
  showEmpty?: boolean;
}

export function ValidationErrors({
  errors,
  title = "Validation Issues",
  collapsible = true,
  defaultExpanded = false,
  maxHeight = "300px",
  showEmpty = true
}: ValidationErrorsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Group errors by type and severity
  const groupedErrors = errors.reduce((acc, error) => {
    const key = `${error.type}-${error.severity}`;
    if (!acc[key]) {
      acc[key] = {
        type: error.type,
        severity: error.severity,
        errors: []
      };
    }
    acc[key].errors.push(error);
    return acc;
  }, {} as Record<string, { type: string; severity: string; errors: ValidationError[] }>);

  const sortedGroups = Object.values(groupedErrors).sort((a, b) => {
    // Sort by severity (error > warning > info) then by type
    const severityOrder = { error: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity as keyof typeof severityOrder] !== severityOrder[b.severity as keyof typeof severityOrder]) {
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    }
    return a.type.localeCompare(b.type);
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'typescript':
        return 'TypeScript';
      case 'accessibility':
        return 'Accessibility';
      case 'performance':
        return 'Performance';
      case 'design':
        return 'Design';
      case 'best-practices':
        return 'Best Practices';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getDocumentationLink = (rule: string) => {
    // Map common rules to documentation links
    const docLinks: Record<string, string> = {
      'typescript-syntax': 'https://www.typescriptlang.org/docs/',
      'aria-attributes': 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
      'img-alt': 'https://webaim.org/techniques/alttext/',
      'form-labels': 'https://webaim.org/techniques/forms/',
      'color-contrast': 'https://webaim.org/articles/contrast/',
      'semantic-html': 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element',
      'arrow-function-handlers': 'https://react.dev/learn/responding-to-events',
      'missing-key-prop': 'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
    };

    return docLinks[rule];
  };

  if (errors.length === 0 && !showEmpty) {
    return null;
  }

  const errorCounts = {
    error: errors.filter(e => e.severity === 'error').length,
    warning: errors.filter(e => e.severity === 'warning').length,
    info: errors.filter(e => e.severity === 'info').length
  };

  const content = (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="outline" className="text-xs">
            {errors.length} issue{errors.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex gap-1">
          {errorCounts.error > 0 && (
            <Badge className="bg-red-100 text-red-800 text-xs">
              {errorCounts.error} error{errorCounts.error > 1 ? 's' : ''}
            </Badge>
          )}
          {errorCounts.warning > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              {errorCounts.warning} warning{errorCounts.warning > 1 ? 's' : ''}
            </Badge>
          )}
          {errorCounts.info > 0 && (
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {errorCounts.info} info
            </Badge>
          )}
        </div>
      </div>

      {/* Error Groups */}
      {errors.length > 0 ? (
        <div 
          className="space-y-2 overflow-y-auto"
          style={{ maxHeight }}
        >
          {sortedGroups.map((group, groupIndex) => (
            <div 
              key={`${group.type}-${group.severity}`}
              className={`border rounded-lg p-3 ${getSeverityColor(group.severity)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getSeverityIcon(group.severity)}
                <span className="font-medium text-sm">
                  {getTypeLabel(group.type)} - {group.severity.charAt(0).toUpperCase() + group.severity.slice(1)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {group.errors.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {group.errors.map((error, errorIndex) => (
                  <div key={errorIndex} className="text-sm">
                    <div className="mb-1">
                      {error.message}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      {error.line && error.column && (
                        <span>Line {error.line}:{error.column}</span>
                      )}
                      {error.rule && (
                        <span className="flex items-center gap-1">
                          Rule: {error.rule}
                          {getDocumentationLink(error.rule) && (
                            <a
                              href={getDocumentationLink(error.rule)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">No validation issues found - great job!</span>
        </div>
      )}
    </div>
  );

  if (!collapsible) {
    return <div className="space-y-3">{content}</div>;
  }

  return (
    <Collapsible 
      open={isExpanded} 
      onOpenChange={setIsExpanded}
      className="space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-between w-full p-2 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {errors.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {errors.length}
              </Badge>
            )}
            {errorCounts.error > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {errorCounts.error} error{errorCounts.error > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2">
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Compact version for use in lists or small spaces
export function CompactValidationErrors({ 
  errors,
  maxVisible = 3 
}: { 
  errors: ValidationError[];
  maxVisible?: number;
}) {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const visibleErrors = errors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, errors.length - maxVisible);

  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <AlertCircle className="w-3 h-3" />
        No issues
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {errorCount > 0 && (
          <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5">
            {errorCount} error{errorCount > 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
            {warningCount} warning{warningCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      
      {visibleErrors.length > 0 && (
        <div className="text-xs text-gray-600 space-y-0.5">
          {visibleErrors.map((error, index) => (
            <div key={index} className="flex items-center gap-1">
              {getSeverityIcon(error.severity)}
              <span className="truncate">{error.message}</span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="text-gray-500 italic">
              +{hiddenCount} more issue{hiddenCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-3 h-3 text-blue-500 flex-shrink-0" />;
      default:
        return <Info className="w-3 h-3 text-gray-500 flex-shrink-0" />;
    }
  }
}
"use client"

import { useMemo } from "react"
import { LiveProvider, LivePreview, LiveError } from "react-live"
import * as React from "react"
import { AlertCircle, BarChart3 } from "lucide-react"
import { ElementTracker } from "./element-tracker"
import { QualityBadge } from "./QualityBadge"
import { ValidationErrors } from "./ValidationErrors"
import { ComponentRating } from "./ComponentRating"
import type { ComponentQualityScore, ValidationError } from "@shared/schema"

interface ComponentPreviewProps {
  code: string
  // Phase 2: Quality information integration
  qualityScore?: ComponentQualityScore
  validationErrors?: ValidationError[]
  accessibilityScore?: number
  componentId?: string
  userId?: string
  userRating?: number
  onRatingUpdate?: (rating: number) => void
  showQualityInfo?: boolean
}

export function ComponentPreview({ 
  code,
  qualityScore,
  validationErrors = [],
  accessibilityScore,
  componentId,
  userId,
  userRating,
  onRatingUpdate,
  showQualityInfo = false
}: ComponentPreviewProps) {
  const { trackedCode } = ElementTracker({ code });

  const scope = useMemo(
    () => ({
      React,
      useState: React.useState,
      useEffect: React.useEffect,
      useCallback: React.useCallback,
      useMemo: React.useMemo,
      useRef: React.useRef,
    }),
    [],
  )

  // Transform the code to make it renderable
  const transformedCode = useMemo(() => {
    let processedCode = trackedCode.trim()

    // Remove any CDATA wrapper if it somehow got through
    processedCode = processedCode.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')

    // Remove any import statements that might have been accidentally included
    processedCode = processedCode.replace(/^import\s+.*$/gm, '')
    
    // Remove any export statements
    processedCode = processedCode.replace(/^export\s+.*$/gm, '')
    
    // Clean up extra whitespace
    processedCode = processedCode.replace(/^\s*\n/gm, '').trim()

    // If the code doesn't have a render statement, try to extract the component and add one
    if (!processedCode.includes("render(")) {
      const functionMatch = processedCode.match(/function\s+(\w+)/)
      if (functionMatch) {
        const componentName = functionMatch[1]
        processedCode += `\n\nrender(<${componentName} />)`
      } else {
        // If no function found, wrap the entire code in a render call
        if (processedCode.includes("<")) {
          processedCode = `render(${processedCode})`
        } else {
          return `render(<div className="p-4 text-red-600">Invalid component code - no JSX found</div>)`
        }
      }
    }

    return processedCode
  }, [trackedCode])

  // Generate a unique key based on the code to force re-render when switching components
  const previewKey = useMemo(() => {
    return transformedCode.length + transformedCode.slice(0, 100);
  }, [transformedCode]);

  return (
    <div className="space-y-4">
      {/* Phase 2: Quality Information Panel */}
      {showQualityInfo && (qualityScore || validationErrors.length > 0 || componentId) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Quality Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Component Quality</h3>
            </div>
            {qualityScore && (
              <QualityBadge 
                qualityScore={qualityScore}
                validationErrors={validationErrors}
                showTooltip={true}
              />
            )}
          </div>

          {/* Quality Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detailed Scores */}
            {qualityScore && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Score Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Code Quality:</span>
                    <span className={`font-medium ${qualityScore.codeQuality >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {qualityScore.codeQuality}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessibility:</span>
                    <span className={`font-medium ${qualityScore.accessibility >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {qualityScore.accessibility}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Design Consistency:</span>
                    <span className={`font-medium ${qualityScore.designConsistency >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {qualityScore.designConsistency}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span className={`font-medium ${qualityScore.performance >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {qualityScore.performance}/100
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* User Rating */}
            {componentId && userId && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">User Rating</h4>
                <ComponentRating
                  componentId={componentId}
                  initialRating={userRating}
                  userId={userId}
                  onRatingUpdate={onRatingUpdate}
                  size="md"
                />
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <ValidationErrors
              errors={validationErrors}
              title="Validation Issues"
              collapsible={true}
              defaultExpanded={false}
              maxHeight="200px"
            />
          )}
        </div>
      )}

      {/* Component Preview */}
      <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
        <LiveProvider key={previewKey} code={transformedCode} scope={scope} noInline={true}>
          <div className="p-4 min-h-32 bg-gray-700">
            <LivePreview />
          </div>
          <LiveError className="bg-red-900/50 border-t border-red-600 p-3 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium mb-1">Preview Error</div>
              <div className="text-xs opacity-90">
                Component failed to render. Common issues: missing imports (React hooks are available globally), syntax errors, or invalid JSX.
              </div>
            </div>
          </LiveError>
        </LiveProvider>
      </div>
    </div>
  )
}

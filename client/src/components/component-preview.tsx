"use client"

import { useMemo } from "react"
import { LiveProvider, LivePreview, LiveError } from "react-live"
import * as React from "react"
import { AlertCircle } from "lucide-react"
import { ElementTracker } from "./element-tracker"

interface ComponentPreviewProps {
  code: string
}

export function ComponentPreview({ code }: ComponentPreviewProps) {
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
  )
}

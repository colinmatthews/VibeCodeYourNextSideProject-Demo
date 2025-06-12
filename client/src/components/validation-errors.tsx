"use client"

import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"
import { AlertTriangle, XCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"

interface ValidationError {
  type: 'typescript' | 'eslint' | 'accessibility' | 'runtime'
  message: string
  line?: number
  column?: number
  severity: 'error' | 'warning' | 'info'
}

interface ValidationErrorsProps {
  errors: ValidationError[]
  className?: string
}

function getErrorIcon(severity: string) {
  switch (severity) {
    case 'error':
      return XCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
    default:
      return AlertCircle
  }
}

function getErrorColor(severity: string) {
  switch (severity) {
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getBadgeVariant(type: string) {
  switch (type) {
    case 'typescript':
      return 'bg-blue-100 text-blue-800'
    case 'eslint':
      return 'bg-purple-100 text-purple-800'
    case 'accessibility':
      return 'bg-green-100 text-green-800'
    case 'runtime':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function ValidationErrors({ errors, className }: ValidationErrorsProps) {
  if (!errors || errors.length === 0) {
    return null
  }

  // Group errors by severity
  const errorsBySeverity = errors.reduce((acc, error) => {
    if (!acc[error.severity]) {
      acc[error.severity] = []
    }
    acc[error.severity].push(error)
    return acc
  }, {} as Record<string, ValidationError[]>)

  const errorCount = errorsBySeverity.error?.length || 0
  const warningCount = errorsBySeverity.warning?.length || 0
  const infoCount = errorsBySeverity.info?.length || 0

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Validation Results:</span>
        {errorCount > 0 && (
          <Badge className="bg-red-100 text-red-800">
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {infoCount > 0 && (
          <Badge className="bg-blue-100 text-blue-800">
            {infoCount} info
          </Badge>
        )}
      </div>

      {/* Error Details */}
      <div className="space-y-2">
        {['error', 'warning', 'info'].map(severity => {
          const severityErrors = errorsBySeverity[severity]
          if (!severityErrors) return null

          return severityErrors.map((error, index) => {
            const Icon = getErrorIcon(error.severity)
            const colorClasses = getErrorColor(error.severity)
            const badgeClasses = getBadgeVariant(error.type)

            return (
              <Alert 
                key={`${severity}-${index}`}
                className={cn("border", colorClasses)}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTitle className="text-sm font-medium capitalize">
                      {error.severity}
                    </AlertTitle>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", badgeClasses)}
                    >
                      {error.type}
                    </Badge>
                    {error.line && (
                      <Badge variant="outline" className="text-xs">
                        Line {error.line}{error.column ? `:${error.column}` : ''}
                      </Badge>
                    )}
                  </div>
                  <AlertDescription className="text-sm">
                    {error.message}
                  </AlertDescription>
                </div>
              </Alert>
            )
          })
        })}
      </div>
    </div>
  )
}
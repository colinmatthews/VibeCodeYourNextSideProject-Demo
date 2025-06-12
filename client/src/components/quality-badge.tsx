"use client"

import { Badge } from "./ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"
import { cn } from "../lib/utils"

interface ComponentQualityScore {
  codeQuality: number
  accessibility: number
  designConsistency: number
  performance: number
  overall: number
}

interface QualityBadgeProps {
  qualityScore: ComponentQualityScore
  showDetails?: boolean
  className?: string
}

function getQualityColor(score: number): {
  color: string
  bgColor: string
  icon: React.ComponentType<{ className?: string }>
} {
  if (score >= 90) {
    return {
      color: "text-green-700",
      bgColor: "bg-green-100",
      icon: CheckCircle
    }
  } else if (score >= 70) {
    return {
      color: "text-yellow-700", 
      bgColor: "bg-yellow-100",
      icon: AlertTriangle
    }
  } else if (score >= 50) {
    return {
      color: "text-orange-700",
      bgColor: "bg-orange-100", 
      icon: Info
    }
  } else {
    return {
      color: "text-red-700",
      bgColor: "bg-red-100",
      icon: XCircle
    }
  }
}

function getQualityLabel(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 70) return "Good" 
  if (score >= 50) return "Fair"
  return "Needs Improvement"
}

export function QualityBadge({ qualityScore, showDetails = false, className }: QualityBadgeProps) {
  const { color, bgColor, icon: Icon } = getQualityColor(qualityScore.overall)
  const label = getQualityLabel(qualityScore.overall)

  const QualityDetails = () => (
    <div className="space-y-2 p-2">
      <div className="font-medium text-sm">Quality Breakdown</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Code Quality:</span>
          <span className="font-medium">{qualityScore.codeQuality}/100</span>
        </div>
        <div className="flex justify-between">
          <span>Accessibility:</span>
          <span className="font-medium">{qualityScore.accessibility}/100</span>
        </div>
        <div className="flex justify-between">
          <span>Design Consistency:</span>
          <span className="font-medium">{qualityScore.designConsistency}/100</span>
        </div>
        <div className="flex justify-between">
          <span>Performance:</span>
          <span className="font-medium">{qualityScore.performance}/100</span>
        </div>
        <div className="border-t pt-1 mt-2">
          <div className="flex justify-between font-medium">
            <span>Overall Score:</span>
            <span>{qualityScore.overall}/100</span>
          </div>
        </div>
      </div>
    </div>
  )

  const BadgeContent = () => (
    <Badge 
      variant="secondary" 
      className={cn(
        "flex items-center gap-1.5 px-2 py-1",
        color,
        bgColor,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {label} ({qualityScore.overall}/100)
      </span>
    </Badge>
  )

  if (showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <BadgeContent />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-0">
            <QualityDetails />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <BadgeContent />
}
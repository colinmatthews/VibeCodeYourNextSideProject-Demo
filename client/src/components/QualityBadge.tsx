/**
 * Phase 2: QualityBadge - Quality score display with detailed tooltips
 * Shows component quality scores with color-coded badges and detailed breakdowns
 */

import React from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { ComponentQualityScore, ValidationError } from '@shared/schema';

interface QualityBadgeProps {
  qualityScore: ComponentQualityScore;
  validationErrors?: ValidationError[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'detailed' | 'compact';
  showTooltip?: boolean;
}

export function QualityBadge({
  qualityScore,
  validationErrors = [],
  size = 'md',
  variant = 'default',
  showTooltip = true
}: QualityBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-3 h-3" />;
    if (score >= 70) return <Info className="w-3 h-3" />;
    if (score >= 50) return <AlertTriangle className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const errorCounts = {
    error: validationErrors.filter(e => e.severity === 'error').length,
    warning: validationErrors.filter(e => e.severity === 'warning').length,
    info: validationErrors.filter(e => e.severity === 'info').length
  };

  const mainBadge = (
    <Badge 
      className={`
        ${getScoreColor(qualityScore.overall)} 
        ${sizeClasses[size]}
        flex items-center gap-1 font-medium border
      `}
    >
      {getScoreIcon(qualityScore.overall)}
      {variant === 'compact' ? qualityScore.overall : `${qualityScore.overall} - ${getScoreLabel(qualityScore.overall)}`}
    </Badge>
  );

  if (!showTooltip) {
    return mainBadge;
  }

  const tooltipContent = (
    <div className="p-3 space-y-3 min-w-64">
      {/* Overall Score */}
      <div className="text-center border-b pb-2">
        <div className="text-lg font-semibold">Quality Score: {qualityScore.overall}/100</div>
        <div className="text-sm text-gray-600">{getScoreLabel(qualityScore.overall)}</div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Score Breakdown:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
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
            <span>Design:</span>
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

      {/* Validation Issues */}
      {validationErrors.length > 0 && (
        <div className="space-y-2 border-t pt-2">
          <h4 className="font-medium text-sm">Validation Issues:</h4>
          <div className="flex gap-3 text-xs">
            {errorCounts.error > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-3 h-3" />
                {errorCounts.error} error{errorCounts.error > 1 ? 's' : ''}
              </div>
            )}
            {errorCounts.warning > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                {errorCounts.warning} warning{errorCounts.warning > 1 ? 's' : ''}
              </div>
            )}
            {errorCounts.info > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Info className="w-3 h-3" />
                {errorCounts.info} info
              </div>
            )}
          </div>
          {validationErrors.length === 0 && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="w-3 h-3" />
              No validation issues
            </div>
          )}
        </div>
      )}

      {/* Quality Recommendations */}
      <div className="border-t pt-2">
        <h4 className="font-medium text-sm mb-1">Recommendations:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {qualityScore.codeQuality < 70 && (
            <div>• Review TypeScript types and React best practices</div>
          )}
          {qualityScore.accessibility < 70 && (
            <div>• Add ARIA labels and improve semantic HTML</div>
          )}
          {qualityScore.designConsistency < 70 && (
            <div>• Follow design system patterns and spacing</div>
          )}
          {qualityScore.performance < 70 && (
            <div>• Optimize component size and rendering</div>
          )}
          {qualityScore.overall >= 90 && (
            <div className="text-green-600">• Excellent quality! Component meets all standards</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {mainBadge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0 bg-white border shadow-lg">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Detailed variant showing all scores
export function DetailedQualityBadge({
  qualityScore,
  validationErrors = []
}: Omit<QualityBadgeProps, 'variant'>) {
  return (
    <div className="flex flex-wrap gap-1">
      <QualityBadge 
        qualityScore={qualityScore} 
        validationErrors={validationErrors}
        variant="compact" 
        showTooltip={true}
      />
      <Badge className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5">
        Code: {qualityScore.codeQuality}
      </Badge>
      <Badge className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5">
        A11y: {qualityScore.accessibility}
      </Badge>
      <Badge className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5">
        Design: {qualityScore.designConsistency}
      </Badge>
      <Badge className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5">
        Perf: {qualityScore.performance}
      </Badge>
    </div>
  );
}

// Simple score indicator for use in lists
export function SimpleQualityIndicator({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getColor(score)}`} />
      <span className="text-sm text-gray-600">{score}</span>
    </div>
  );
}
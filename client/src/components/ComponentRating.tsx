/**
 * Phase 2: ComponentRating - Interactive star rating system
 * Allows users to rate generated components (1-5 stars) with async save
 */

import React, { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';

interface ComponentRatingProps {
  componentId: string;
  initialRating?: number;
  userId: string;
  onRatingUpdate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function ComponentRating({ 
  componentId, 
  initialRating = 0, 
  userId, 
  onRatingUpdate,
  size = 'md',
  readonly = false 
}: ComponentRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedRating, setLastSavedRating] = useState(initialRating);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleRatingClick = useCallback(async (newRating: number) => {
    if (readonly || isLoading) return;

    setRating(newRating);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/components/${componentId}/rating?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: newRating }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save rating');
      }

      setLastSavedRating(newRating);
      onRatingUpdate?.(newRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rating');
      setRating(lastSavedRating); // Revert to last saved rating
    } finally {
      setIsLoading(false);
    }
  }, [componentId, userId, readonly, isLoading, lastSavedRating, onRatingUpdate]);

  const handleMouseEnter = useCallback((starRating: number) => {
    if (!readonly) {
      setHoveredRating(starRating);
    }
  }, [readonly]);

  const handleMouseLeave = useCallback(() => {
    if (!readonly) {
      setHoveredRating(0);
    }
  }, [readonly]);

  const displayRating = hoveredRating || rating;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starRating) => (
          <button
            key={starRating}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-150 ease-in-out
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
            `}
            onClick={() => handleRatingClick(starRating)}
            onMouseEnter={() => handleMouseEnter(starRating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly || isLoading}
            aria-label={`Rate ${starRating} star${starRating > 1 ? 's' : ''}`}
          >
            <Star
              className={`
                ${starSizes[size]}
                transition-colors duration-150
                ${starRating <= displayRating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200'
                }
                ${hoveredRating > 0 && starRating <= hoveredRating 
                  ? 'drop-shadow-sm' 
                  : ''
                }
              `}
            />
          </button>
        ))}
        
        {isLoading && (
          <div className="ml-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {rating > 0 && !isLoading && (
          <span className="ml-2 text-sm text-gray-600">
            {rating}/5
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRatingClick(rating)}
            className="h-6 px-2 py-0 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {!readonly && rating === 0 && !error && (
        <p className="text-xs text-gray-500">
          Click to rate this component
        </p>
      )}

      {rating > 0 && !error && (
        <p className="text-xs text-green-600">
          {rating === lastSavedRating ? 'Rating saved' : 'Saving...'}
        </p>
      )}
    </div>
  );
}

// Compact version for use in lists
export function CompactComponentRating({ 
  componentId, 
  initialRating = 0, 
  userId, 
  onRatingUpdate 
}: Omit<ComponentRatingProps, 'size' | 'readonly'>) {
  return (
    <ComponentRating
      componentId={componentId}
      initialRating={initialRating}
      userId={userId}
      onRatingUpdate={onRatingUpdate}
      size="sm"
      readonly={false}
    />
  );
}

// Read-only version for displaying ratings
export function ReadOnlyComponentRating({ 
  rating, 
  size = 'sm',
  showNumeric = true 
}: { 
  rating: number; 
  size?: 'sm' | 'md' | 'lg';
  showNumeric?: boolean;
}) {
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starRating) => (
        <Star
          key={starRating}
          className={`
            ${starSizes[size]}
            ${starRating <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'fill-gray-200 text-gray-200'
            }
          `}
        />
      ))}
      {showNumeric && rating > 0 && (
        <span className="ml-1 text-sm text-gray-600">
          {rating}/5
        </span>
      )}
    </div>
  );
}
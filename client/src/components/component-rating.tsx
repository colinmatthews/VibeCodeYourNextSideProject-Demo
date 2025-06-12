"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

interface ComponentRatingProps {
  componentId: string
  initialRating?: number
  onRatingChange?: (rating: number) => void
  disabled?: boolean
  className?: string
}

export function ComponentRating({ 
  componentId, 
  initialRating, 
  onRatingChange, 
  disabled = false,
  className 
}: ComponentRatingProps) {
  const [rating, setRating] = useState(initialRating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingClick = async (newRating: number) => {
    if (disabled || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/components/${componentId}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: newRating }),
      })

      if (response.ok) {
        setRating(newRating)
        onRatingChange?.(newRating)
      } else {
        console.error('Failed to save rating')
      }
    } catch (error) {
      console.error('Error saving rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMouseEnter = (star: number) => {
    if (!disabled && !isSubmitting) {
      setHoveredRating(star)
    }
  }

  const handleMouseLeave = () => {
    if (!disabled && !isSubmitting) {
      setHoveredRating(0)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="sm"
            className={cn(
              "p-1 h-8 w-8 hover:bg-transparent",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled || isSubmitting}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </Button>
        ))}
      </div>
      
      {rating > 0 && (
        <span className="text-sm text-gray-600">
          {rating}/5 stars
        </span>
      )}
      
      {isSubmitting && (
        <span className="text-xs text-gray-500">Saving...</span>
      )}
    </div>
  )
}
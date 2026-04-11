import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PropertyPhoto {
  id: string
  url: string
  caption?: string
  orderIndex: number
}

interface PropertyImageCarouselProps {
  photos?: PropertyPhoto[]
  propertyTitle: string
  className?: string
  aspectRatio?: "square" | "video" | "wide"
  showControls?: boolean
  showIndicators?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

// Single placeholder image for properties without photos
const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}property-placeholder.svg`

export function PropertyImageCarousel({
  photos = [],
  propertyTitle,
  className,
  aspectRatio = "video",
  showControls = true,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 5000
}: PropertyImageCarouselProps) {
  // Use photos if available, otherwise use single placeholder image
  const images = photos.length > 0
    ? photos.sort((a, b) => a.orderIndex - b.orderIndex).map(photo => ({
        url: photo.url,
        caption: photo.caption,
        isPlaceholder: false
      }))
    : [{
        url: PLACEHOLDER_IMAGE,
        caption: `${propertyTitle} - No images available`,
        isPlaceholder: true
      }]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set())

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    wide: "aspect-[16/9]"
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const handleImageError = (index: number) => {
    setImageLoadErrors(prev => new Set([...prev, index]))
  }

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        )
      }, autoPlayInterval)
      return () => clearInterval(interval)
    }
    return undefined
  }, [autoPlay, images.length, autoPlayInterval])

  if (images.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-lg bg-muted dark:bg-card",
        aspectRatioClasses[aspectRatio],
        className
      )}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No images available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-muted dark:bg-card group",
      aspectRatioClasses[aspectRatio],
      className
    )}>
      {/* Main Image */}
      <div className="relative w-full h-full">
        {imageLoadErrors.has(currentIndex) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-secondary">
            <div className="text-center">
              <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].caption || propertyTitle}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={() => handleImageError(currentIndex)}
            loading="lazy"
          />
        )}

        {/* Image Caption */}
        {images[currentIndex].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/60 to-transparent p-4">
            <p className="text-white text-sm font-medium">
              {images[currentIndex].caption}
            </p>
          </div>
        )}

        {/* Navigation Controls - Only show if there are multiple images and not just a placeholder */}
        {showControls && images.length > 1 && !images[0]?.isPlaceholder && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter - Only show if there are multiple real images */}
        {images.length > 1 && !images[0]?.isPlaceholder && (
          <div className="absolute top-2 right-2 bg-background/60 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Indicators - Only show if there are multiple real images */}
      {showIndicators && images.length > 1 && !images[0]?.isPlaceholder && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {images.map((_, index: number) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-card scale-110"
                  : "bg-card/50 hover:bg-card/75"
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Placeholder Badge */}
      {images[currentIndex]?.isPlaceholder && (
        <div className="absolute top-2 left-2 bg-muted/80 text-white text-xs px-2 py-1 rounded">
          No Images
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Upload, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { useProfilePictureUpload } from '@/hooks/useProfilePictureUpload'
import { useAuth } from '@/lib/auth-context'

interface ImageUploaderProps {
  onCropComplete: (croppedImageUrl: string) => void
  trigger?: React.ReactNode
}

export function ImageUploader({ onCropComplete, trigger }: ImageUploaderProps) {
  const { user } = useAuth()
  const { uploadProfilePicture, isUploading } = useProfilePictureUpload()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string)
        setIsDialogOpen(true)
        setZoom(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })
      })
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isUploading) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.01
    const newZoom = Math.min(Math.max(zoom + delta, 1), 4)
    setZoom(newZoom)
  }

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleSave = async () => {
    if (!imageSrc || !user?.id) return

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        const container = imageRef.current?.parentElement
        if (!container) return

        const size = 256 // Profile picture size
        
        canvas.width = size
        canvas.height = size

        const sw = size * zoom
        const sh = size * zoom

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh)
        ctx.restore()

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
        
        const result = await uploadProfilePicture(croppedDataUrl, { userId: user.id })
        
        if (result.success && result.url) {
          onCropComplete(result.url)
          setIsDialogOpen(false)
          setImageSrc(null)
          setZoom(1)
          setRotation(0)
          setPosition({ x: 0, y: 0 })
        }
      }
      
      img.src = imageSrc
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setImageSrc(null)
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTriggerClick = () => {
    fileInputRef.current?.click()
  }

  const adjustZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 4))
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      
      {trigger ? (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTriggerClick}
          type="button"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>Adjust and crop your profile picture before uploading</DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full flex-1 min-h-[300px] bg-card overflow-hidden">
            {imageSrc && (
              <div
                ref={imageRef}
                className="absolute inset-0 flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <img
                  src={imageSrc}
                  alt="Crop"
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                  draggable={false}
                />
                
                {/* Crop overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-white opacity-80" />
                  <div className="absolute inset-0 bg-background/50" style={{
                    clipPath: 'circle(128px at center)',
                    WebkitClipPath: 'circle(128px at center)'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-6 py-4 bg-card flex items-center justify-center gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustZoom(-0.1)}
              disabled={zoom <= 1}
              className="text-white hover:bg-muted"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={rotateImage}
              className="text-white hover:bg-muted"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustZoom(0.1)}
              disabled={zoom >= 4}
              className="text-white hover:bg-muted"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </div>

          <DialogFooter className="px-6 py-4 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
"use client"

import { useState, useRef } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@nba/design-system"

interface SortableCardProps {
  id: string
  index: number
  onDragEnd: (fromIndex: number, toIndex: number) => void
  children: React.ReactNode
  className?: string
}

export function SortableCard({ id, index, onDragEnd, children, className }: SortableCardProps) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
    setDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onDragEnd(fromIndex, index)
    }
    setDragging(false)
  }

  const handleDragEnd = () => {
    setDragging(false)
  }

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative group",
        dragging && "opacity-50",
        className
      )}
    >
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1 rounded-md bg-background/80 border cursor-grab active:cursor-grabbing">
          <GripVertical className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      {children}
    </div>
  )
}

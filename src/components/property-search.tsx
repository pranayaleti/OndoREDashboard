import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface PropertySearchProps {
  onSearch?: (query: string) => void
}

export function PropertySearch({ onSearch }: PropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsLoading(true)

    if (onSearch) {
      // If onSearch prop is provided, use it for in-page filtering
      onSearch(searchQuery)
      setIsLoading(false)
    } else {
      // Otherwise, navigate to search results page
      setTimeout(() => {
        navigate(`/search/nearby?query=${encodeURIComponent(searchQuery)}`)
        setIsLoading(false)
      }, 500) // Simulate network delay
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl mx-auto">
      <Input
        type="text"
        placeholder="Search properties..."
        className="w-full px-4 py-2 rounded-l-md border-0 focus:outline-none focus:ring-2 focus:ring-primary bg-card dark:bg-card text-card-foreground dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Button type="submit" disabled={isLoading} className="ml-2">
        {isLoading ? (
          "Searching..."
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" /> Search
          </>
        )}
      </Button>
    </form>
  )
}

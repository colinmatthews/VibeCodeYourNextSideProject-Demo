import { useState, useEffect } from "react"
import { useComponentStore } from "@/lib/store"
import { LibraryIcon, FilterIcon, DownloadIcon, TagIcon, Trash2Icon, Loader2Icon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"

interface ComponentGalleryProps {
  isSelectionLocked?: boolean;
}

export function ComponentGallery({ isSelectionLocked = false }: ComponentGalleryProps) {
  const { 
    components, 
    setSelectedComponent, 
    removeComponent, 
    selectedComponent,
    loadUserComponents,
    isLoading,
    error,
    clearError
  } = useComponentStore()
  const [filter, setFilter] = useState('')
  const [user, setUser] = useState(auth.currentUser)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      if (user) {
        // Load components when user logs in
        loadUserComponents()
      }
    })
    return () => unsubscribe()
  }, [loadUserComponents])

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000) // Clear error after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const filteredComponents = components.filter(component => 
    component.name.toLowerCase().includes(filter.toLowerCase()) || 
    component.description.toLowerCase().includes(filter.toLowerCase())
  )

  const handleDeleteComponent = (e: React.MouseEvent, componentId: string, componentName: string) => {
    e.stopPropagation() // Prevent card click when clicking delete
    
    if (confirm(`Are you sure you want to delete "${componentName}"? This action cannot be undone.`)) {
      removeComponent(componentId)
      
      // Clear selection if the deleted component was selected
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null)
      }
      
      toast({
        title: "Component Deleted",
        description: `"${componentName}" has been removed from your library.`,
      })
    }
  }

    return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LibraryIcon className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-white">Component Library</h2>
          {isSelectionLocked && (
            <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full">
              Viewing locked component
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search components..." 
              className="pl-9 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-md">
            <FilterIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-md">
            <DownloadIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg">
          <p className="text-sm text-red-200">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {isSelectionLocked && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            <strong>Library browsing is locked.</strong> You're viewing a newly generated component. 
            Click "View Library" above to unlock and browse all components.
          </p>
        </div>
      )}

      {/* Not authenticated */}
      {!user ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
          <LibraryIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">
            Sign in to view your library
          </h3>
          <p className="text-gray-400">
            Your components will be saved to your account
          </p>
        </div>
      ) : isLoading ? (
        /* Loading state */
        <div className="text-center py-12">
          <Loader2Icon className="h-12 w-12 text-indigo-400 mx-auto mb-3 animate-spin" />
          <h3 className="text-lg font-medium text-white mb-1">
            Loading your components...
          </h3>
          <p className="text-gray-400">
            Please wait while we fetch your library
          </p>
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
          <LibraryIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">
            No components yet
          </h3>
          <p className="text-gray-400">
            Generate components using AI to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredComponents.map(component => (
            <div 
            key={component.id}
              className={`border rounded-lg overflow-hidden transition-all relative group ${
                selectedComponent?.id === component.id
                  ? 'border-indigo-400 bg-indigo-900/30 ring-2 ring-indigo-500/50'
                  : isSelectionLocked 
                    ? 'border-gray-600 bg-gray-700 opacity-50 cursor-not-allowed' 
                    : 'border-gray-600 bg-gray-700 hover:border-indigo-500 hover:bg-gray-600 cursor-pointer'
              }`}
              onClick={() => {
                if (!isSelectionLocked) {
                  console.log('Selecting component:', component.name, component.id);
                  setSelectedComponent(component);
                }
              }}
            >
              {/* Delete Button */}
              {!isSelectionLocked && (
                <button
                  onClick={(e) => handleDeleteComponent(e, component.id, component.name)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Delete ${component.name}`}
                >
                  <Trash2Icon className="h-3 w-3" />
                </button>
              )}
              
              <div className="h-32 bg-gray-100 overflow-hidden">
                {component.screenshot ? (
                  <img 
                    src={component.screenshot} 
                    alt={component.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                    <div className="text-center">
                      <LibraryIcon className="h-8 w-8 text-indigo-400 mx-auto mb-1" />
                      <span className="text-xs text-indigo-300 font-medium">Generated</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white truncate">{component.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <TagIcon className="h-3.5 w-3.5 mr-1" />
                    <span className="truncate">AI Generated</span>
                  </div>
                  <div className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">
                    v{component.version}
                  </div>
                </div>
              </div>
            </div>
        ))}
      </div>
      )}
    </div>
  )
}

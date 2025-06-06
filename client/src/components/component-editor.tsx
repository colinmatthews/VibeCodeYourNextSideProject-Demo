"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { GeneratedComponent } from "@/lib/types"
import { useComponentStore } from "@/lib/store"
import { generateComponent } from "@/lib/api"
import { CodeIcon, DownloadIcon, TagIcon, LayersIcon, Share2Icon, PlusIcon, EditIcon, ArrowLeftIcon, Palette, Trash2Icon } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { ComponentPreview } from "./component-preview"
import { UISelectorHighlights } from "./ui-selector-highlights"

interface ComponentEditorProps {
  component: GeneratedComponent
  onClose: () => void
  onUISelectorToggle?: (active: boolean) => void
  isUISelectorActive?: boolean
  onElementSelect?: (element: any) => void
  onComponentCodeChange?: (code: string) => void
  currentCode?: string
}

export function ComponentEditor({ component, onClose, onUISelectorToggle, isUISelectorActive = false, onElementSelect, onComponentCodeChange, currentCode }: ComponentEditorProps) {
  const [activeTab, setActiveTab] = useState('preview')
  const [version, setVersion] = useState(component.version.toString())
  const [editPrompt, setEditPrompt] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [componentCode, setComponentCode] = useState(component.code)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const { updateComponent, removeComponent } = useComponentStore()

  // Update local state when component prop changes
  useEffect(() => {
    // Reset everything when component changes
    setComponentCode(component.code)
    setVersion(component.version.toString())
    setEditPrompt("")
    setSelectedElement(null)
    setActiveTab('preview')
    
    // Reset UI selector state
    onUISelectorToggle?.(false)
    
    // Notify parent of initial code
    onComponentCodeChange?.(component.code)
  }, [component.id, onUISelectorToggle, onComponentCodeChange])

  // Update local state when currentCode prop changes (from UI selector updates)
  useEffect(() => {
    if (currentCode && currentCode !== componentCode) {
      setComponentCode(currentCode)
    }
  }, [currentCode, componentCode])

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter edit instructions",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)

    try {
      const updatedComponentData = await generateComponent({
        prompt: editPrompt,
        targetComponent: component.id,
        originalComponentCode: component.code,
        originalName: component.name,
        originalCreatedAt: component.createdAt,
        originalVersion: component.version,
      })

      updateComponent(component.id, updatedComponentData)
      setComponentCode(updatedComponentData.code)

      toast({
        title: "Success",
        description: "Component updated successfully!",
      })

      setEditPrompt("")
    } catch (error) {
      console.error("Edit error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update component. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleCodeUpdate = (componentId: string, newCode: string) => {
    setComponentCode(newCode)
    // Update the component in the store
    const updatedComponent = {
      ...component,
      code: newCode,
      updatedAt: new Date()
    }
    updateComponent(componentId, updatedComponent)
  }

  const handleDeleteComponent = () => {
    if (confirm(`Are you sure you want to delete "${component.name}"? This action cannot be undone.`)) {
      removeComponent(component.id)
      onClose() // Close the editor since component is deleted
      
      toast({
        title: "Component Deleted",
        description: `"${component.name}" has been removed from your library.`,
      })
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">{component.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-md" title="Share Component">
              <Share2Icon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-md" title="Download Component">
              <DownloadIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={handleDeleteComponent}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md" 
              title="Delete Component"
            >
              <Trash2Icon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <div className="flex items-center">
            <LayersIcon className="h-4 w-4 mr-1" />
            <select 
              className="bg-transparent border-none focus:outline-none text-indigo-400 font-medium" 
              value={version} 
              onChange={e => setVersion(e.target.value)}
            >
              <option value={component.version.toString()}>Version {component.version}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex">
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'preview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-300'}`} 
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'code' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-300'}`} 
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-300'}`} 
              onClick={() => setActiveTab('edit')}
            >
              Edit
            </button>
          </div>
          
          {/* UI Selector Toggle - only show on preview tab */}
          {activeTab === 'preview' && (
            <div className="px-4">
              <button
                onClick={() => onUISelectorToggle?.(!isUISelectorActive)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isUISelectorActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
                title="Toggle UI Selector"
              >
                <Palette className="h-4 w-4" />
                UI Selector
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto bg-gray-800">
        {activeTab === 'preview' && (
          <div className="border border-gray-600 rounded-lg overflow-hidden relative">
            <div className="component-preview-area">
              <ComponentPreview code={componentCode} />
              <UISelectorHighlights 
                isActive={isUISelectorActive}
                onElementSelect={(element) => {
                  setSelectedElement(element);
                  onElementSelect?.(element);
                }}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'code' && (
          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-auto">
            <pre>{component.code}</pre>
          </div>
        )}
        
        {activeTab === 'edit' && (
          <div className="space-y-4">
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-medium mb-3 text-white">Edit Component</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Original Prompt
                  </label>
                  <div className="bg-gray-800 p-3 rounded-lg text-sm text-gray-300">
                    {component.prompt}
                  </div>
                </div>
          <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Edit Instructions
                  </label>
            <Textarea
              placeholder="Describe what changes you want to make... (e.g., 'Change the button color to use the accent color', 'Add a loading state', 'Make it responsive')"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
                <Button 
                  onClick={handleEdit} 
                  disabled={isEditing || !editPrompt.trim()} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
              {isEditing ? (
                <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Updating Component...
                </>
              ) : (
                <>
                      <EditIcon className="h-4 w-4 mr-2" />
                  Update Component
                </>
              )}
            </Button>
              </div>
            </div>
            
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h3 className="font-medium mb-3 text-white">Version Control</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Current Version: v{component.version}</span>
                  <button className="flex items-center gap-1 bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-md text-sm text-gray-200">
                    <PlusIcon className="h-3.5 w-3.5" />
                    New Version
                  </button>
                </div>
                <div className="text-sm text-gray-400">
                  Last updated: {new Date(component.updatedAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-400">
                  Created: {new Date(component.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
  )
}

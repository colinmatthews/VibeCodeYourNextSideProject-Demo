import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { ComponentGenerator } from "@/components/component-generator";
import { ComponentGallery } from "@/components/component-gallery";
import { ComponentEditor } from "@/components/component-editor";
import { UISelectorControls } from "@/components/ui-selector-controls";
import { useComponentStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabBar } from "@/components/magicpatterns/TabBar";
import { FloatingActionButton } from "@/components/magicpatterns/FloatingActionButton";
import { Sparkles, Code, Palette, LibraryIcon, UploadIcon, InfoIcon } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user: firebaseUser, loading } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [hasGeneratedNewComponent, setHasGeneratedNewComponent] = useState(false);
  const [lockedComponent, setLockedComponent] = useState<any>(null);
  const [isUISelectorActive, setIsUISelectorActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [currentComponentCode, setCurrentComponentCode] = useState<string>('');
  const { components, selectedComponent, setSelectedComponent, updateComponent } = useComponentStore();

  // Clear state when selected component changes to prevent flashing
  useEffect(() => {
    if (selectedComponent) {
      // Use a small delay to ensure ComponentEditor has processed the new component
      const timeoutId = setTimeout(() => {
        setCurrentComponentCode(selectedComponent.code); // Set to new component's code
        setSelectedElement(null); // Clear selected element
        setIsUISelectorActive(false); // Close UI selector
      }, 0);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Immediately clear when no component is selected
      setCurrentComponentCode('');
      setSelectedElement(null);
      setIsUISelectorActive(false);
    }
  }, [selectedComponent?.id, selectedComponent?.code]);

  // Handle checkout success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId) {
      toast({
        title: "Welcome to Pro! 🎉",
        description: "Your subscription is now active. Enjoy unlimited components and all Pro features!",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center bg-gray-900 min-h-screen">
        <div className="text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 animate-pulse text-indigo-400" />
          <p className="text-lg text-gray-300">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    setLocation("/login");
    return null;
  }

  const handleNewComponent = () => {
    if (user?.subscriptionType === 'free' && components.length >= 3) {
      setShowUpgradeDialog(true);
    } else {
      // If already on upload tab, reset everything to start fresh
      if (activeTab === 'upload') {
        setSelectedComponent(null);
        setHasGeneratedNewComponent(false);
        setLockedComponent(null);
        setIsUISelectorActive(false);
        setSelectedElement(null);
        setCurrentComponentCode('');
        // Force re-render of ComponentGenerator by briefly switching tabs
        setActiveTab('library');
        setTimeout(() => setActiveTab('upload'), 0);
      } else {
        // Just switch to upload tab
        setActiveTab('upload');
        setSelectedComponent(null);
      }
    }
  };

  const freeComponentsRemaining = user?.subscriptionType === 'free' ? Math.max(0, 3 - components.length) : null;

  const handleComponentGenerated = (component: any) => {
    setHasGeneratedNewComponent(true);
    setLockedComponent(component);
    setSelectedComponent(component);
  };

  // Show right panel if component is selected OR if a new component was generated
  const showRightPanel = selectedComponent || hasGeneratedNewComponent;
  
  // Calculate layout widths based on active panels
  const getLayoutWidths = () => {
    if (!showRightPanel) {
      return { chat: 'w-full', component: '', uiSelector: '' };
    }
    if (isUISelectorActive) {
      return { chat: 'w-1/3', component: 'w-1/3', uiSelector: 'w-1/3' };
    }
    return { chat: 'w-2/3', component: 'w-1/3', uiSelector: '' };
  };
  
  const layoutWidths = getLayoutWidths();

  const handleCodeUpdate = (componentId: string, newCode: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      // Update the store
      updateComponent(componentId, {
        ...component,
        code: newCode,
        version: component.version + 1
      });
      
      // Also update the current component code state for immediate UI feedback
      setCurrentComponentCode(newCode);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-900">
      {/* Left Chat Panel */}
      <div className={`flex flex-col ${layoutWidths.chat} transition-all duration-200 bg-gray-800 border-r border-gray-700`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-white">Chat</span>
            </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewComponent}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'upload' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-white'
              }`}
            >
              New Component
            </button>
            <button
              onClick={() => {
                setActiveTab('library');
                // Clear locked component to allow browsing the library
                setLockedComponent(null);
                setHasGeneratedNewComponent(false);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'library' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white hover:text-white'
              }`}
            >
              View Library
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-auto">
          {activeTab === 'upload' ? (
            <ComponentGenerator onComponentGenerated={handleComponentGenerated} />
          ) : (
            <div className="p-4 min-h-full">
              <ComponentGallery isSelectionLocked={!!lockedComponent} />
            </div>
          )}
            </div>
          </div>
          
      {/* Middle Component Panel */}
      {showRightPanel && (
        <div className={`${layoutWidths.component} bg-gray-800 flex flex-col border-l border-gray-700`}>
          {/* Component Panel Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
                         <div className="flex items-center gap-2">
               <Code className="h-5 w-5 text-indigo-400" />
               <h2 className="text-lg font-medium text-white">Component Preview</h2>
            </div>
          </div>
          
          {/* Component Content */}
          <div className="flex-1 overflow-hidden">
            {selectedComponent ? (
              <ComponentEditor 
                component={selectedComponent}
                onClose={lockedComponent ? () => {} : () => {
                  setSelectedComponent(null);
                  setHasGeneratedNewComponent(false);
                  setIsUISelectorActive(false);
                  setSelectedElement(null);
                  setCurrentComponentCode('');
                }}
                onUISelectorToggle={setIsUISelectorActive}
                isUISelectorActive={isUISelectorActive}
                onElementSelect={setSelectedElement}
                onComponentCodeChange={setCurrentComponentCode}
                currentCode={currentComponentCode}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-800">
                <InfoIcon className="h-12 w-12 text-gray-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">
                  No component selected
                </h3>
                <p className="text-gray-400">
                  Your generated component will appear here
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right UI Selector Panel */}
        {isUISelectorActive && selectedComponent && (
          <div className={`${layoutWidths.uiSelector} bg-gray-800 flex flex-col border-l border-gray-700`}>
            {/* UI Selector Panel Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-lg font-medium text-white">UI Selector</h2>
                </div>
                <button
                  onClick={() => setIsUISelectorActive(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <InfoIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* UI Selector Content */}
            <div className="flex-1 overflow-hidden">
              <UISelectorControls
                selectedElement={selectedElement}
                onClose={() => setIsUISelectorActive(false)}
                componentId={selectedComponent.id}
                componentCode={currentComponentCode || selectedComponent.code}
                onCodeUpdate={handleCodeUpdate}
              />
            </div>
          </div>
        )}

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
            <DialogTitle className="text-white">Component Limit Reached</DialogTitle>
            </DialogHeader>
            <div className="py-4">
            <p className="text-gray-300 mb-4">
                You've reached the maximum of 3 components on the free plan. 
                Upgrade to Pro for unlimited components and advanced features!
              </p>
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg p-4 border border-gray-600">
              <h4 className="font-semibold text-white mb-2">Pro Features:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Unlimited AI component generation</li>
                  <li>• Advanced theming options</li>
                  <li>• Component history and versioning</li>
                  <li>• Export to popular frameworks</li>
                  <li>• Priority AI processing</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradeDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
                Cancel
              </Button>
              <Button 
                onClick={() => setLocation("/pricing")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                View Pricing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from "react"
import { Sparkles, Upload, ImageIcon, ScanIcon, X, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useComponentStore } from "@/lib/store"
import { generateComponent } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  type?: 'thinking' | 'result'
}

interface ComponentGeneratorProps {
  onComponentGenerated?: (component: any) => void;
}

export function ComponentGenerator({ onComponentGenerated }: ComponentGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { addComponent } = useComponentStore()

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file); // Store the actual file for API call
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return;
        }
      }
    }
  }, [handleImageUpload]);

  const removeImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addChatMessage = (role: 'user' | 'ai', content: string, type?: 'thinking' | 'result') => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type
    };
    setChatMessages(prev => [...prev, message]);
  };

  const simulateAIThinking = async () => {
    // Skip fake thinking messages - just wait a moment for the actual API call
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() && !imageFile) {
      toast({
        title: "Error",
        description: "Please enter a component description or upload an image",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Add user message to chat
    let userMessage = prompt || "Generate a component based on the uploaded screenshot";
    if (imageFile && prompt) {
      userMessage = prompt + " (with screenshot reference)";
    } else if (imageFile && !prompt) {
      userMessage = "Recreate this exact UI component from the screenshot";
    }
    addChatMessage('user', userMessage);

    try {
      // Show AI thinking process
      await simulateAIThinking();

      // Generate the actual component
      const component = await generateComponent({
        prompt: prompt || "Generate a component based on the provided screenshot",
        screenshot: imageFile,
      });

      addComponent(component);
      
      // Notify parent that a new component was generated
      onComponentGenerated?.(component);
      
      // Add final AI response
      addChatMessage('ai', `✨ Successfully generated "${component.name}"! 

**Component Details:**
- **Name:** ${component.name}
- **Description:** ${component.description}
- **Lines of Code:** ~${component.code.split('\n').length} lines
- **Created:** ${new Date().toLocaleTimeString()}

The component has been added to your library. You can now view it in the Library tab or continue generating more components!`, 'result');

      // Clear form after successful generation
      setPrompt("");
      setUploadedImage(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Component generated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error('Generation failed:', error);
      addChatMessage('ai', `❌ Sorry, I encountered an error while generating your component: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`, 'result');
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate component. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewGeneration = () => {
    setChatMessages([]);
    setPrompt("");
    setUploadedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-240px)]"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <Sparkles className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Generate Components with AI</h3>
              <p className="text-gray-400 mb-6">
                Describe your component or upload a screenshot to get started. I'll create beautiful React code for you.
              </p>
              <div className="space-y-2 text-sm text-gray-500 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <span>Paste screenshots directly with Ctrl+V or Cmd+V</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <span>Upload images to recreate exact designs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <span>Combine text descriptions with screenshots for best results</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'ai' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : message.type === 'thinking'
                      ? 'bg-gray-700 text-gray-300 italic'
                      : 'bg-gray-700 text-gray-100'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator when AI is thinking */}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm italic">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image indicator */}
          {uploadedImage && (
            <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg">
              <div className="flex items-center gap-2 text-gray-300">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Screenshot ready for analysis</span>
                <span className="text-xs text-gray-500">(Automatically compressed)</span>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
                disabled={isGenerating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                placeholder={chatMessages.length === 0 ? "Describe your component (e.g., 'A modern pricing card with 3 tiers') or paste a screenshot..." : "Ask for modifications or generate another component..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onPaste={handlePaste}
                rows={3}
                className="resize-none pr-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isGenerating}
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded-md transition-colors"
                  title="Upload image"
                  disabled={isGenerating}
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isGenerating || (!prompt.trim() && !imageFile)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-[76px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {chatMessages.length === 0 ? 'Generate Component' : 'Send'}
                </>
              )}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </form>
      </div>
    </div>
  );


}

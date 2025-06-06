import type { GeneratedComponent, GenerationRequest } from "./types"

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// Helper function to compress and convert image file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    const originalOnLoad = () => {
      // Calculate new dimensions (max 1024px on the longest side)
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression (0.8 quality for JPEG)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    
    img.onload = originalOnLoad;
    img.onerror = reject;
    
    // Create object URL from file and load into image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after loading
    img.addEventListener('load', () => {
      URL.revokeObjectURL(objectUrl);
    }, { once: true });
  });
}

export async function generateComponent(request: GenerationRequest): Promise<GeneratedComponent> {
  console.log("=== generateComponent START (Server API) ===")
  
  if (!request || typeof request.prompt !== "string") {
    console.error("Invalid request object:", request)
    throw new Error("Invalid request: prompt (string) is required.")
  }
  
  console.log("Request prompt:", request.prompt.substring(0, 100) + "...")
  console.log("Has screenshot:", !!request.screenshot)

  // Convert image file to base64 if provided
  let imageBase64: string | undefined;
  if (request.screenshot) {
    try {
      imageBase64 = await fileToBase64(request.screenshot);
      console.log("Image converted to base64, length:", imageBase64?.length || 0);
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw new Error("Failed to process the uploaded image. Please try again.");
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-component`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image: imageBase64,
        targetComponent: request.targetComponent,
        originalComponentCode: request.originalComponentCode,
        originalName: request.originalName,
        originalCreatedAt: request.originalCreatedAt?.toISOString(),
        originalVersion: request.originalVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const component = await response.json();
    
    // Convert date strings back to Date objects
    component.createdAt = new Date(component.createdAt);
    component.updatedAt = new Date(component.updatedAt);
    
    console.log("=== generateComponent SUCCESS (Server API) ===")
    return component;
  } catch (error) {
    console.error("Component generation error:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to generate component. Please try again."
    );
  }
}

export async function checkAIHealth(): Promise<{ status: string; providers: { openai: boolean; anthropic: boolean } }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("AI health check error:", error);
    throw error;
  }
}

// ===== COMPONENT API FUNCTIONS =====

export async function saveComponent(component: GeneratedComponent, userId: string): Promise<GeneratedComponent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: component.id,
        name: component.name,
        description: component.description,
        code: component.code,
        prompt: component.prompt,
        screenshot: component.screenshot,
        version: component.version,
        userId: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save component: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert date strings back to Date objects
    result.component.createdAt = new Date(result.component.createdAt);
    result.component.updatedAt = new Date(result.component.updatedAt);
    
    return result.component;
  } catch (error) {
    console.error("Error saving component:", error);
    throw error;
  }
}

export async function loadComponents(userId: string): Promise<GeneratedComponent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components?userId=${encodeURIComponent(userId)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load components: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert date strings back to Date objects
    const components = result.components.map((component: any) => ({
      ...component,
      createdAt: new Date(component.createdAt),
      updatedAt: new Date(component.updatedAt),
    }));
    
    return components;
  } catch (error) {
    console.error("Error loading components:", error);
    throw error;
  }
}

export async function updateComponent(componentId: string, updates: Partial<GeneratedComponent>, userId: string): Promise<GeneratedComponent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}?userId=${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update component: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Convert date strings back to Date objects
    result.component.createdAt = new Date(result.component.createdAt);
    result.component.updatedAt = new Date(result.component.updatedAt);
    
    return result.component;
  } catch (error) {
    console.error("Error updating component:", error);
    throw error;
  }
}

export async function deleteComponent(componentId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete component: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting component:", error);
    throw error;
  }
}

export async function getComponentCount(userId: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/stats/count?userId=${encodeURIComponent(userId)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get component count: ${response.statusText}`);
    }

    const result = await response.json();
    return result.count;
  } catch (error) {
    console.error("Error getting component count:", error);
    throw error;
  }
} 
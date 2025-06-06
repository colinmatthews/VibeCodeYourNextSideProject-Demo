export interface GeneratedComponent {
  id: string
  name: string
  description: string
  code: string
  prompt: string
  screenshot?: string // URL string for the screenshot
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface ThemeConfig {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  typography: {
    fontFamily: string
    fontSize: string
    fontWeight: string
  }
  spacing: {
    base: string
    scale: number[]
  }
}

export interface GenerationRequest {
  prompt: string // User's textual prompt or edit instruction
  screenshot?: File | null // Optional screenshot file

  // For edit requests
  targetComponent?: string // ID of the component to edit
  originalComponentCode?: string
  originalName?: string
  originalCreatedAt?: Date
  originalVersion?: number
}

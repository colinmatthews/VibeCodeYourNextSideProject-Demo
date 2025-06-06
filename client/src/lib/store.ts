"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GeneratedComponent, ThemeConfig } from "./types"
import { predefinedThemes } from "./themes"
import { saveComponent, loadComponents, updateComponent as apiUpdateComponent, deleteComponent } from "./api"
import { auth } from "./firebase"

interface ComponentStore {
  components: GeneratedComponent[]
  theme: ThemeConfig
  selectedComponent: GeneratedComponent | null
  isLoading: boolean
  error: string | null
  addComponent: (component: GeneratedComponent) => Promise<void>
  updateComponent: (id: string, updates: Partial<GeneratedComponent>) => Promise<void>
  removeComponent: (id: string) => Promise<void>
  setTheme: (theme: ThemeConfig) => void
  setSelectedComponent: (component: GeneratedComponent | null) => void
  loadUserComponents: () => Promise<void>
  clearError: () => void
}

export const useComponentStore = create<ComponentStore>()(
  persist(
    (set, get) => ({
      components: [],
      theme: predefinedThemes[0], // Default theme
      selectedComponent: null,
      isLoading: false,
      error: null,

      addComponent: async (component) => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: "User not authenticated" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const savedComponent = await saveComponent(component, user.uid);
          set((state) => ({
            components: [savedComponent, ...state.components],
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error saving component:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to save component",
            isLoading: false,
          });
          // Still add to local state as fallback
          set((state) => ({
            components: [component, ...state.components],
          }));
        }
      },

      updateComponent: async (id, updates) => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: "User not authenticated" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const updatedComponent = await apiUpdateComponent(id, updates, user.uid);
          set((state) => ({
            components: state.components.map((comp) => 
              comp.id === id ? updatedComponent : comp
            ),
            selectedComponent: state.selectedComponent?.id === id ? updatedComponent : state.selectedComponent,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error updating component:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to update component",
            isLoading: false,
          });
          // Still update local state as fallback
          set((state) => ({
            components: state.components.map((comp) => (comp.id === id ? { ...comp, ...updates } : comp)),
            selectedComponent: state.selectedComponent?.id === id ? { ...state.selectedComponent, ...updates } : state.selectedComponent,
          }));
        }
      },

      removeComponent: async (id) => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: "User not authenticated" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await deleteComponent(id, user.uid);
          set((state) => ({
            components: state.components.filter((comp) => comp.id !== id),
            selectedComponent: state.selectedComponent?.id === id ? null : state.selectedComponent,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error deleting component:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to delete component",
            isLoading: false,
          });
          // Still remove from local state as fallback
          set((state) => ({
            components: state.components.filter((comp) => comp.id !== id),
            selectedComponent: state.selectedComponent?.id === id ? null : state.selectedComponent,
          }));
        }
      },

      loadUserComponents: async () => {
        const user = auth.currentUser;
        if (!user) {
          set({ error: "User not authenticated" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const components = await loadComponents(user.uid);
          set({ 
            components,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error loading components:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to load components",
            isLoading: false,
          });
        }
      },

      setTheme: (theme) => set({ theme }),

      setSelectedComponent: (component) => set({ selectedComponent: component }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "component-generator-storage",
      // Only persist theme and selectedComponent, not the components array
      partialize: (state) => ({ 
        theme: state.theme,
        selectedComponent: state.selectedComponent,
      }),
    },
  ),
)

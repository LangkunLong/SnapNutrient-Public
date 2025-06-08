import { create } from 'zustand';

interface NavigationState {
  navigateToCamera: () => void;
  setNavigateToCamera: (fn: () => void) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  navigateToCamera: () => {}, // Default empty function
  setNavigateToCamera: (fn) => set({ navigateToCamera: fn }),
}));
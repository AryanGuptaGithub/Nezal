import { create } from "zustand"

interface LoadingStore {
  isLoading: boolean
  message: string
  startLoading: (message?: string) => void
  stopLoading: () => void
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  message: "",
  startLoading: (message = "Please wait...") => set({ isLoading: true, message }),
  stopLoading: () => set({ isLoading: false, message: "" }),
}))
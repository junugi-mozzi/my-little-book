import { create } from 'zustand'

interface BGMStore {
  muted: boolean
  toggleMuted: () => void
}

export const useBGMStore = create<BGMStore>((set) => ({
  muted: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}))

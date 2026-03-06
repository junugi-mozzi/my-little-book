// src/store/storyStore.ts
import { create } from 'zustand'

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content?: string;
  status: 'pending' | 'generating' | 'completed';
}

export interface StoryContext {
  atmosphere: string;
  wound: string;
  direction: string;
  tension: string;
  resonance: string;
}

interface StoryState extends StoryContext {
  title: string;
  outline: Chapter[];
  setStoryContext: (ctx: StoryContext) => void;
  setTitle: (title: string) => void;
  setOutline: (outline: Chapter[]) => void;
  updateChapterContent: (id: number, content: string) => void;
  updateChapterStatus: (id: number, status: Chapter['status']) => void;
  resetStoryContext: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  atmosphere: '',
  wound: '',
  direction: '',
  tension: '',
  resonance: '',
  title: '',
  outline: [],
  setStoryContext: (ctx) => set(ctx),
  setTitle: (title) => set({ title }),
  setOutline: (outline) => set({ outline }),
  updateChapterContent: (id, content) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, content, status: 'completed' } : ch)),
    })),
  updateChapterStatus: (id, status) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, status } : ch)),
    })),
  resetStoryContext: () => set({ atmosphere: '', wound: '', direction: '', tension: '', resonance: '', title: '', outline: [] }),
}))

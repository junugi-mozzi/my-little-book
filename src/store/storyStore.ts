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
  genre: string;
  characterFlaw: string;
  goal: string;
  conflict: string;
  bgmMood: string;
}

interface StoryState extends StoryContext {
  outline: Chapter[];
  setStoryContext: (ctx: StoryContext) => void;
  setOutline: (outline: Chapter[]) => void;
  updateChapterContent: (id: number, content: string) => void;
  updateChapterStatus: (id: number, status: Chapter['status']) => void;
  resetStoryContext: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  genre: '',
  characterFlaw: '',
  goal: '',
  conflict: '',
  bgmMood: '',
  outline: [],
  setStoryContext: (ctx) => set(ctx),
  setOutline: (outline) => set({ outline }),
  updateChapterContent: (id, content) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, content, status: 'completed' } : ch)),
    })),
  updateChapterStatus: (id, status) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, status } : ch)),
    })),
  resetStoryContext: () => set({ genre: '', characterFlaw: '', goal: '', conflict: '', bgmMood: '', outline: [] }),
}))

// src/store/storyStore.ts
import { create } from 'zustand'

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content?: string;
  status: 'pending' | 'generating' | 'completed';
}

export type StoryField = 'genre' | 'era' | 'mood' | 'keywords';

interface StoryState {
  genre: string;
  era: string;
  mood: string;
  keywords: string;
  outline: Chapter[];
  setGenre: (genre: string) => void;
  setEra: (era: string) => void;
  setMood: (mood: string) => void;
  setKeywords: (keywords: string) => void;
  setField: (field: StoryField, value: string) => void;
  setOutline: (outline: Chapter[]) => void;
  updateChapterContent: (id: number, content: string) => void;
  updateChapterStatus: (id: number, status: Chapter['status']) => void;
  resetStoryContext: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  genre: '',
  era: '',
  mood: '',
  keywords: '',
  outline: [],
  setGenre: (genre) => set({ genre }),
  setEra: (era) => set({ era }),
  setMood: (mood) => set({ mood }),
  setKeywords: (keywords) => set({ keywords }),
  setField: (field, value) => set({ [field]: value }),
  setOutline: (outline) => set({ outline }),
  updateChapterContent: (id, content) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, content, status: 'completed' } : ch)),
    })),
  updateChapterStatus: (id, status) =>
    set((state) => ({
      outline: state.outline.map((ch) => (ch.id === id ? { ...ch, status } : ch)),
    })),
  resetStoryContext: () => set({ genre: '', era: '', mood: '', keywords: '', outline: [] }),
}))

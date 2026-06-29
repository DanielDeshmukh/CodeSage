import { create } from "zustand";
import type { ExamSession, ExamMode } from "@/types";

interface ExamState {
  currentSession: ExamSession | null;
  sessions: ExamSession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentSession: (session: ExamSession | null) => void;
  addSession: (session: ExamSession) => void;
  updateSession: (id: string, updates: Partial<ExamSession>) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getSessionById: (id: string) => ExamSession | undefined;
  getSessionsByRepository: (repositoryId: string) => ExamSession[];
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,

  setCurrentSession: (session) => set({ currentSession: session }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...updates }
          : state.currentSession,
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSession:
        state.currentSession?.id === id ? null : state.currentSession,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getSessionById: (id) => get().sessions.find((s) => s.id === id),

  getSessionsByRepository: (repositoryId) =>
    get().sessions.filter((s) => s.repositoryId === repositoryId),
}));

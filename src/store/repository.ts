import { create } from "zustand";
import type { Repository, RepositoryStatus } from "@/types";

interface RepositoryState {
  repositories: Repository[];
  selectedRepository: Repository | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addRepository: (repository: Repository) => void;
  updateRepository: (id: string, updates: Partial<Repository>) => void;
  removeRepository: (id: string) => void;
  selectRepository: (repository: Repository | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getRepositoryById: (id: string) => Repository | undefined;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: [],
  selectedRepository: null,
  isLoading: false,
  error: null,

  addRepository: (repository) =>
    set((state) => ({
      repositories: [...state.repositories, repository],
    })),

  updateRepository: (id, updates) =>
    set((state) => ({
      repositories: state.repositories.map((repo) =>
        repo.id === id ? { ...repo, ...updates } : repo
      ),
    })),

  removeRepository: (id) =>
    set((state) => ({
      repositories: state.repositories.filter((repo) => repo.id !== id),
      selectedRepository:
        state.selectedRepository?.id === id ? null : state.selectedRepository,
    })),

  selectRepository: (repository) =>
    set({ selectedRepository: repository }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getRepositoryById: (id) => get().repositories.find((repo) => repo.id === id),
}));

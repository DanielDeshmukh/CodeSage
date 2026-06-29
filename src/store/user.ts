import { create } from "zustand";

interface UserSettings {
  githubToken: string;
  nimApiKey: string;
  defaultExamMode: "viva" | "interview" | "code-review";
  defaultQuestionCount: number;
  theme: "dark" | "light";
}

interface UserState {
  settings: UserSettings;
  isAuthenticated: boolean;

  // Actions
  updateSettings: (updates: Partial<UserSettings>) => void;
  setAuthenticated: (authenticated: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
  githubToken: "",
  nimApiKey: "",
  defaultExamMode: "viva",
  defaultQuestionCount: 10,
  theme: "dark",
};

export const useUserStore = create<UserState>((set) => ({
  settings: defaultSettings,
  isAuthenticated: false,

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  setAuthenticated: (authenticated) =>
    set({ isAuthenticated: authenticated }),

  resetSettings: () => set({ settings: defaultSettings }),
}));

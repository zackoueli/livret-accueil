import { create } from "zustand";
import { Booklet, BookletModule } from "@/types";

interface EditorState {
  booklet: Booklet | null;
  activeModuleId: string | null;
  activeLanguage: string;
  isDirty: boolean;
  isSaving: boolean;
  setBooklet: (booklet: Booklet) => void;
  setActiveModule: (id: string) => void;
  setActiveLanguage: (lang: string) => void;
  updateModule: (moduleId: string, content: Record<string, string>) => void;
  updateModuleImages: (moduleId: string, images: string[]) => void;
  updateModuleDocuments: (moduleId: string, documents: import("@/types").BookletDocument[]) => void;
  toggleModule: (moduleId: string) => void;
  reorderModules: (modules: BookletModule[]) => void;
  updateBookletField: (field: keyof Booklet, value: any) => void;
  setIsSaving: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  booklet: null,
  activeModuleId: null,
  activeLanguage: "fr",
  isDirty: false,
  isSaving: false,

  setBooklet: (booklet) => set({ booklet, activeModuleId: booklet.modules.find((m) => m.enabled)?.id ?? null }),
  setActiveModule: (id) => set({ activeModuleId: id }),
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),

  updateModule: (moduleId, content) =>
    set((state) => {
      if (!state.booklet) return {};
      return {
        isDirty: true,
        booklet: {
          ...state.booklet,
          modules: state.booklet.modules.map((m) =>
            m.id === moduleId ? { ...m, content: { ...m.content, ...content } } : m
          ),
        },
      };
    }),

  updateModuleImages: (moduleId, images) =>
    set((state) => {
      if (!state.booklet) return {};
      return {
        isDirty: true,
        booklet: {
          ...state.booklet,
          modules: state.booklet.modules.map((m) =>
            m.id === moduleId ? { ...m, images } : m
          ),
        },
      };
    }),

  updateModuleDocuments: (moduleId, documents) =>
    set((state) => {
      if (!state.booklet) return {};
      return {
        isDirty: true,
        booklet: {
          ...state.booklet,
          modules: state.booklet.modules.map((m) =>
            m.id === moduleId ? { ...m, documents } : m
          ),
        },
      };
    }),

  toggleModule: (moduleId) =>
    set((state) => {
      if (!state.booklet) return {};
      return {
        isDirty: true,
        booklet: {
          ...state.booklet,
          modules: state.booklet.modules.map((m) =>
            m.id === moduleId ? { ...m, enabled: !m.enabled } : m
          ),
        },
      };
    }),

  reorderModules: (modules) =>
    set((state) => {
      if (!state.booklet) return {};
      return { isDirty: true, booklet: { ...state.booklet, modules } };
    }),

  updateBookletField: (field, value) =>
    set((state) => {
      if (!state.booklet) return {};
      return { isDirty: true, booklet: { ...state.booklet, [field]: value } };
    }),

  setIsSaving: (isSaving) => set({ isSaving }),
  setIsDirty: (isDirty) => set({ isDirty }),
}));

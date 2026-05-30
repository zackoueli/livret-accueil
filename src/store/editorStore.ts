import { create } from "zustand";
import { Booklet, BookletModule, ModuleType } from "@/types";
import { MODULE_FIELDS } from "@/lib/modules";
import { nanoid } from "nanoid";

interface EditorState {
  booklet: Booklet | null;
  activeModuleId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  setBooklet: (booklet: Booklet) => void;
  setActiveModule: (id: string) => void;
  updateModule: (moduleId: string, content: Record<string, string>) => void;
  updateModuleImages: (moduleId: string, images: string[]) => void;
  updateModuleDocuments: (moduleId: string, documents: import("@/types").BookletDocument[]) => void;
  toggleModule: (moduleId: string) => void;
  reorderModules: (modules: BookletModule[]) => void;
  addModule: (type: ModuleType) => void;
  removeModule: (moduleId: string) => void;
  updateBookletField: (field: keyof Booklet, value: any) => void;
  setIsSaving: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  booklet: null,
  activeModuleId: null,
  isDirty: false,
  isSaving: false,

  setBooklet: (booklet) => set({ booklet, activeModuleId: booklet.modules.find((m) => m.enabled)?.id ?? null }),
  setActiveModule: (id) => set({ activeModuleId: id }),

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

  addModule: (type) =>
    set((state) => {
      if (!state.booklet) return {};
      const exists = state.booklet.modules.some((m) => m.type === type);
      if (exists) return {};
      const newModule: BookletModule = {
        id: nanoid(),
        type,
        enabled: true,
        order: state.booklet.modules.length,
        content: {},
        images: [],
        documents: [],
      };
      return {
        isDirty: true,
        activeModuleId: newModule.id,
        booklet: {
          ...state.booklet,
          modules: [...state.booklet.modules, newModule],
        },
      };
    }),

  removeModule: (moduleId) =>
    set((state) => {
      if (!state.booklet) return {};
      return {
        isDirty: true,
        booklet: {
          ...state.booklet,
          modules: state.booklet.modules
            .filter((m) => m.id !== moduleId)
            .map((m, i) => ({ ...m, order: i })),
        },
      };
    }),

  updateBookletField: (field, value) =>
    set((state) => {
      if (!state.booklet) return {};
      return { isDirty: true, booklet: { ...state.booklet, [field]: value } };
    }),

  setIsSaving: (isSaving) => set({ isSaving }),
  setIsDirty: (isDirty) => set({ isDirty }),
}));

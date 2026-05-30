// Les templates seront définis ici une fois la structure de données stabilisée.

export interface BookletTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji
}

export const TEMPLATES: BookletTemplate[] = [];

export function getTemplate(id?: string): BookletTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? { id: "default", name: "Défaut", description: "", preview: "📖" };
}

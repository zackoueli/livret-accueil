export interface BookletTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const TEMPLATES: BookletTemplate[] = [
  {
    id: "simple",
    name: "Simple",
    description: "Une page scrollable, tous les modules empilés",
    preview: "📋",
  },
];

export function getTemplate(id?: string): BookletTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { nanoid } from "nanoid";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ServiceChoiceOption,
  ServiceMultiplierOption,
  ServiceOption,
} from "@/types";

const input = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300";

function fmtEuros(cents: number) {
  return String(cents / 100);
}

function summaryLabel(opt: ServiceOption, t: ReturnType<typeof useTranslations>): string {
  if (opt.type === "multiplier") {
    const price = fmtEuros(opt.pricePerUnit);
    return `🔢 ${opt.label || t("addonOptionLabel")} · ${price}€${opt.unitLabel ? `/${opt.unitLabel}` : ""}`;
  }
  return `☑️ ${opt.label || t("addonChoiceOptionLabel")} · ${opt.choices.length} ${t("addonChoiceCount")}`;
}

function MultiplierFields({ opt, onUpdate }: { opt: ServiceMultiplierOption; onUpdate: (patch: Partial<ServiceMultiplierOption>) => void }) {
  const t = useTranslations("editor");
  return (
    <div className="space-y-2">
      <input type="text" value={opt.label} onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder={t("addonOptionLabel")} className={`${input} font-semibold`} />
      <input type="text" value={opt.unitLabel ?? ""} onChange={(e) => onUpdate({ unitLabel: e.target.value })}
        placeholder={t("addonOptionUnitLabel")} className={input} />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">{t("addonOptionPricePerUnit")}</label>
          <div className="relative">
            <input type="number" min={0} step={0.5} value={fmtEuros(opt.pricePerUnit)}
              onChange={(e) => onUpdate({ pricePerUnit: Math.round(parseFloat(e.target.value || "0") * 100) })}
              className={`${input} pr-7 text-gray-900`} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">€</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">{t("addonOptionMin")}</label>
          <input type="number" min={1} value={opt.min}
            onChange={(e) => onUpdate({ min: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
            className={`${input} text-gray-900`} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">{t("addonOptionMax")}</label>
          <input type="number" min={opt.min} value={opt.max}
            onChange={(e) => onUpdate({ max: Math.max(opt.min, Math.round(Number(e.target.value) || opt.min)) })}
            className={`${input} text-gray-900`} />
        </div>
      </div>
    </div>
  );
}

function ChoiceFields({ opt, onUpdate }: { opt: ServiceChoiceOption; onUpdate: (patch: Partial<ServiceChoiceOption>) => void }) {
  const t = useTranslations("editor");

  const updateChoice = (id: string, patch: Partial<ServiceChoiceOption["choices"][number]>) => {
    onUpdate({ choices: opt.choices.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };
  const addChoice = () => {
    onUpdate({ choices: [...opt.choices, { id: nanoid(), label: "", priceDelta: 0 }] });
  };
  const removeChoice = (id: string) => {
    onUpdate({ choices: opt.choices.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-2">
      <input type="text" value={opt.label} onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder={t("addonChoiceOptionLabel")} className={`${input} font-semibold`} />

      <div className="space-y-1.5 pl-3 border-l-2 border-gray-100">
        {opt.choices.map((choice) => (
          <div key={choice.id} className="flex items-center gap-2">
            <input type="text" value={choice.label} onChange={(e) => updateChoice(choice.id, { label: e.target.value })}
              placeholder={t("addonChoiceItemLabel")} className={`${input} flex-1 text-sm`} />
            <div className="relative w-24 shrink-0">
              <input type="number" min={0} step={0.5} value={fmtEuros(choice.priceDelta)}
                onChange={(e) => updateChoice(choice.id, { priceDelta: Math.round(parseFloat(e.target.value || "0") * 100) })}
                className={`${input} pr-6 text-sm text-gray-900`} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">€</span>
            </div>
            <button onClick={() => removeChoice(choice.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={addChoice}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 mt-1">
          <Plus className="w-3 h-3" /> {t("addonAddChoiceItem")}
        </button>
      </div>
    </div>
  );
}

function SortableOptionItem({ opt, expanded, onToggle, onUpdate, onRemove }: {
  opt: ServiceOption;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ServiceOption>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("editor");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opt.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="flex-1 text-sm text-gray-700 truncate">{summaryLabel(opt, t)}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100">
          {opt.type === "multiplier"
            ? <MultiplierFields opt={opt} onUpdate={(patch) => onUpdate(patch)} />
            : <ChoiceFields opt={opt} onUpdate={(patch) => onUpdate(patch)} />}
        </div>
      )}
    </div>
  );
}

export function ServiceOptionsEditor({ options, onChange }: {
  options: ServiceOption[];
  onChange: (next: ServiceOption[]) => void;
}) {
  const t = useTranslations("editor");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const addMultiplier = () => {
    const opt: ServiceMultiplierOption = {
      id: nanoid(), type: "multiplier", label: "", pricePerUnit: 0, min: 1, max: 10, order: options.length,
    };
    onChange([...options, opt]);
    setOpen(true);
    setExpanded(opt.id);
  };

  const addChoice = () => {
    const opt: ServiceChoiceOption = {
      id: nanoid(), type: "choice", label: "",
      choices: [{ id: nanoid(), label: "", priceDelta: 0 }],
      order: options.length,
    };
    onChange([...options, opt]);
    setOpen(true);
    setExpanded(opt.id);
  };

  const updateOption = (id: string, patch: Partial<ServiceOption>) => {
    onChange(options.map((o) => (o.id === id ? ({ ...o, ...patch } as ServiceOption) : o)));
  };
  const removeOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);
    onChange(arrayMove(options, oldIndex, newIndex).map((o, i) => ({ ...o, order: i })));
  };

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {t("addonOptionsToggle", { count: options.length })}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {options.map((opt) => (
                  <SortableOptionItem
                    key={opt.id}
                    opt={opt}
                    expanded={expanded === opt.id}
                    onToggle={() => setExpanded(expanded === opt.id ? null : opt.id)}
                    onUpdate={(patch) => updateOption(opt.id, patch)}
                    onRemove={() => removeOption(opt.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex gap-2">
            <button onClick={addMultiplier}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold text-xs hover:border-orange-200 hover:text-orange-500 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t("addonAddMultiplier")}
            </button>
            <button onClick={addChoice}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold text-xs hover:border-orange-200 hover:text-orange-500 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t("addonAddChoice")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

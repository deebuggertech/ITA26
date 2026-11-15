import type { Criterion, FieldDef, Item, ItemDraft, MaterialType, Rating } from "./api/types";

export interface Portal {
  slug: string;
  title: string;
  path: string;
  roles: string[];
  blurb: string;
}

export const PORTALS: Portal[] = [
  { slug: "zulieferer", title: "Zulieferer & Speditionen", path: "/zulieferer", roles: ["supplier", "logistics"], blurb: "Material anbieten, Routen melden" },
  { slug: "regnauer", title: "Regnauer", path: "/regnauer", roles: ["manufacturer"], blurb: "Material, Modulpläne, Produktion" },
  { slug: "scoreboard", title: "Scoreboard", path: "/scoreboard", roles: [], blurb: "Öffentliche Wirkungsbilanz" },
  { slug: "hilfsorganisationen", title: "Hilfsorganisationen", path: "/hilfsorganisationen", roles: ["aid"], blurb: "Verfügbare Module finden" },
];

const DIM_COLUMN = { length: "length_cm", width: "width_cm", thickness: "thickness_cm" } as const;

export interface FieldInput {
  value: string;
  unit: string;
}

/** Converts form input (with user-chosen units) into the cm-based payload the API expects. */
export function buildDraft(
  type: MaterialType,
  inputs: Record<string, FieldInput>,
  extra: Pick<ItemDraft, "delivery_own" | "delivery_date" | "note" | "photo_data_url">,
): ItemDraft | string {
  const draft: ItemDraft = { material: type.name, quantity: 0, ...extra };
  for (const field of type.fields) {
    const raw = Number((inputs[field.key]?.value ?? "").replace(",", "."));
    if (!(raw > 0)) return `${field.label}: bitte einen Wert größer 0 eingeben`;
    if (field.key === "quantity") {
      if (!Number.isInteger(raw)) return `${field.label}: bitte eine ganze Zahl eingeben`;
      draft.quantity = raw;
    } else {
      const factor = field.units?.[inputs[field.key].unit] ?? 1;
      draft[DIM_COLUMN[field.key]] = Math.round(raw * factor * 100) / 100;
    }
  }
  return draft;
}

export function describeDimensions(i: Pick<Item, "length_cm" | "width_cm" | "thickness_cm">): string {
  const parts = [i.length_cm, i.width_cm, i.thickness_cm].filter((v) => v != null);
  return parts.length ? `${parts.join(" × ")} cm` : "";
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

export const defaultUnit = (f: FieldDef) => f.default_unit ?? Object.keys(f.units ?? {})[0] ?? "";

export function formatRating(c: Criterion, value: Rating | undefined): string {
  if (value === undefined) return "–";
  const text = Array.isArray(value) ? `${value[0]} … ${value[1]}` : String(value);
  return `${text} ${c.unit}`;
}

export const embedSnippet = (slug: string) =>
  `<iframe src="${window.location.origin}/embed/${slug}" width="100%" height="130" style="border:0" title="Re:Build Impact"></iframe>`;

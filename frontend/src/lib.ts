import type { Criterion, FieldDef, Item, ItemDraft, MaterialType, PhotoAnalysis, Rating } from "./api/types";

export interface Portal {
  slug: string;
  title: string;
  path: string;
  roles: string[];
}

export const PORTALS: Portal[] = [
  { slug: "zulieferer", title: "Zulieferer & Speditionen", path: "/zulieferer", roles: ["supplier", "logistics"] },
  { slug: "regnauer", title: "Regnauer", path: "/regnauer", roles: ["manufacturer"] },
  { slug: "scoreboard", title: "Projekte", path: "/scoreboard", roles: [] },
  { slug: "hilfsorganisationen", title: "Hilfsorganisationen", path: "/hilfsorganisationen", roles: ["aid"] },
];

const DIM_COLUMN = {
  length: "length_cm", width: "width_cm", thickness: "thickness_cm", diameter: "diameter_cm", weight: "weight_kg",
} as const;

export interface FieldInput {
  value: string;
  unit: string;
}

/** Form input in user-chosen units -> cm/kg payload. Returns an error message on invalid input. */
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

export function describeDimensions(
  i: Pick<Item, "length_cm" | "width_cm" | "thickness_cm"> & Partial<Pick<Item, "diameter_cm" | "weight_kg">>,
): string {
  const sizes = [i.length_cm, i.width_cm, i.thickness_cm].filter((v) => v != null);
  return [
    sizes.length ? `${sizes.join(" × ")} cm` : "",
    i.diameter_cm != null ? `Ø ${i.diameter_cm} cm` : "",
    i.weight_kg != null ? `${i.weight_kg} kg` : "",
  ].filter(Boolean).join(" · ");
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

/** Photo analysis (cm/kg) -> form inputs in each field's default unit. */
export function analysisToInputs(type: MaterialType, a: PhotoAnalysis): Record<string, FieldInput> {
  const inputs: Record<string, FieldInput> = {};
  for (const field of type.fields) {
    const base = field.key === "quantity" ? a.quantity : a[DIM_COLUMN[field.key]];
    if (base == null) continue;
    const unit = defaultUnit(field);
    const factor = field.units?.[unit] ?? 1;
    inputs[field.key] = { value: String(Math.round((base / factor) * 100) / 100), unit };
  }
  return inputs;
}

const MAX_EDGE = 1280;

/** Caps the longest edge so the request stays small. */
export function downscaleToJpeg(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function fileToJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return downscaleToJpeg(bitmap, bitmap.width, bitmap.height);
}

/** Demo figures on the supplier panels are scaled to a quarter. */
export const quarter = (n: number) => Math.round(n / 4);

export type Role = "supplier" | "logistics" | "manufacturer" | "aid";

export interface Session {
  token: string;
  username: string;
  display_name: string;
  role: Role;
}

export type DemoUser = Omit<Session, "token">;

export interface FieldDef {
  key: "length" | "width" | "thickness" | "diameter" | "weight" | "quantity";
  label: string;
  units?: Record<string, number>;
  default_unit?: string;
  unit_label?: string;
}

export interface MaterialType {
  name: string;
  description: string;
  fields: FieldDef[];
}

/** Single value, or [from, to] for "range" criteria. */
export type Rating = number | [number, number];

export interface Criterion {
  key: string;
  label: string;
  description: string;
  unit: string;
  kind: "value" | "range";
  min: number;
  max: number;
  step: number;
}

export interface Bounds {
  min?: number;
  max?: number;
}

export interface ItemDraft {
  material: string;
  length_cm?: number;
  width_cm?: number;
  thickness_cm?: number;
  diameter_cm?: number;
  weight_kg?: number;
  quantity: number;
  delivery_own: boolean;
  delivery_date?: string;
  note: string;
  photo_data_url?: string;
}

export interface Item {
  id: number;
  material: string;
  supplier_name: string;
  length_cm: number | null;
  width_cm: number | null;
  thickness_cm: number | null;
  diameter_cm: number | null;
  weight_kg: number | null;
  quantity: number;
  remaining: number;
  delivery_own: boolean;
  delivery_date: string | null;
  note: string;
  photo_url: string | null;
  accepted: boolean;
  reject_reason: string | null;
  status: "offered" | "delivered";
}

export interface OfferResult {
  offer_id: number;
  items: Item[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  build_minutes: number;
  shelter_person_factor: number;
  ratings: Record<string, Rating>;
}

export type RecipeUpdate = Omit<Recipe, "id" | "name">;

export interface SupplierEstimate {
  credited_modules: number;
  credited_score: number;
  potential_modules: number;
  potential_score: number;
  recipe_name: string | null;
}

export interface BuildableRecipe extends Recipe {
  max_count: number;
}

export interface Module {
  id: number;
  recipe_id: string;
  recipe_name: string;
  shelter_person_factor: number;
  produced_at: string;
}

export interface ScoreRow {
  name: string;
  slug: string;
  kind: "Zulieferer" | "Hersteller";
  modules: number;
  score: number;
}

export interface AidGroup {
  recipe_id: string;
  recipe_name: string;
  count: number;
  shelter_person_factor: number;
  people: number;
  ratings: Record<string, Rating>;
}

export interface AidResult {
  groups: AidGroup[];
  total_people: number;
  requested: number;
  shortfall: number;
}

/** Lengths in cm, weight in kg; null where the model could not tell. */
export interface PhotoAnalysis {
  material: string | null;
  length_cm: number | null;
  width_cm: number | null;
  thickness_cm: number | null;
  diameter_cm: number | null;
  weight_kg: number | null;
  quantity: number | null;
  note: string;
}

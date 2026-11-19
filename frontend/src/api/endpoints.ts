import { api } from "./client";
import type {
  AidResult, Bounds, BuildableRecipe, Criterion, DemoUser, Item, MaterialType, Module, OfferResult, Recipe, RecipeUpdate,
  ScoreRow, Session, ItemDraft, PhotoAnalysis, SupplierEstimate,
} from "./types";

export const login = (username: string, password: string) =>
  api<Session>("/auth/login", { body: { username, password } });
export const demoUsers = () => api<DemoUser[]>("/auth/demo-users");

export const materialTypes = () => api<MaterialType[]>("/config/material-types");
export const criteria = () => api<Criterion[]>("/config/criteria");

export const submitOffer = (items: ItemDraft[]) => api<OfferResult>("/offers", { body: { items } });
export const getOffer = (id: string) => api<OfferResult>(`/offers/${id}`);
export const uploadRoutes = (filename: string, content: string) =>
  api<void>("/logistics", { body: { filename, content } });

export const acceptedItems = () => api<Item[]>("/regnauer/items");
export const markDelivered = (id: number) => api<Item>(`/regnauer/items/${id}/deliver`, { method: "POST", body: {} });
export const buildable = () => api<BuildableRecipe[]>("/regnauer/buildable");
export const produce = (recipeId: string, count: number) =>
  api<Module[]>(`/regnauer/produce/${recipeId}`, { method: "POST", body: { count } });
export const stock = () => api<Module[]>("/regnauer/modules");
export const recipes = () => api<Recipe[]>("/regnauer/recipes");
export const updateRecipe = (id: string, input: RecipeUpdate) =>
  api<Recipe>(`/regnauer/recipes/${id}`, { method: "PUT", body: input });

export const scoreboard = () => api<ScoreRow[]>("/scoreboard");
export const searchAid = (people: number, filters: Record<string, Bounds>) =>
  api<AidResult>("/aid/search", { body: { people, filters } });
export const supplierEstimate = () => api<SupplierEstimate>("/supplier/estimate");
export const analyzePhoto = (imageDataUrl: string) =>
  api<PhotoAnalysis>("/offers/analyze-photo", { body: { image_data_url: imageDataUrl } });

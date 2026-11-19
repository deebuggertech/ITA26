from typing import Literal

from pydantic import BaseModel, Field

MAX_BATCH = 1000

# Single value or (from, to) range, per the criterion's kind in parts-criteria.json.
Rating = float | tuple[float, float]


class LoginRequest(BaseModel):
    username: str
    password: str


class DemoUser(BaseModel):
    username: str
    display_name: str
    role: str


class LoginResponse(DemoUser):
    token: str


class ItemIn(BaseModel):
    material: str
    length_cm: float | None = Field(default=None, gt=0)
    width_cm: float | None = Field(default=None, gt=0)
    thickness_cm: float | None = Field(default=None, gt=0)
    diameter_cm: float | None = Field(default=None, gt=0)
    weight_kg: float | None = Field(default=None, gt=0)
    quantity: int = Field(gt=0)
    delivery_own: bool = False
    delivery_date: str | None = None
    note: str = ""
    photo_data_url: str | None = None


class PhotoIn(BaseModel):
    image_data_url: str


class PhotoAnalysis(BaseModel):
    """Same units as ItemIn: lengths in cm, weight in kg. Unknown values stay None."""
    material: str | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    thickness_cm: float | None = None
    diameter_cm: float | None = None
    weight_kg: float | None = None
    quantity: int | None = None
    note: str = ""


class OfferIn(BaseModel):
    items: list[ItemIn] = Field(min_length=1)


class ItemOut(BaseModel):
    id: int
    material: str
    supplier_name: str
    length_cm: float | None
    width_cm: float | None
    thickness_cm: float | None
    diameter_cm: float | None
    weight_kg: float | None
    quantity: int
    remaining: int
    delivery_own: bool
    delivery_date: str | None
    note: str
    photo_url: str | None
    accepted: bool
    reject_reason: str | None
    status: Literal["offered", "delivered"]


class OfferResult(BaseModel):
    offer_id: int
    items: list[ItemOut]


class LogisticsIn(BaseModel):
    filename: str
    content: str


class Recipe(BaseModel):
    id: str
    name: str
    description: str = ""
    build_minutes: int
    shelter_person_factor: float
    ratings: dict[str, Rating]


class BuildableRecipe(Recipe):
    max_count: int


class ProduceIn(BaseModel):
    count: int = Field(default=1, ge=1, le=MAX_BATCH)


class SupplierEstimate(BaseModel):
    credited_modules: int
    credited_score: int
    potential_modules: int
    potential_score: int
    recipe_name: str | None


class RecipeMetaUpdate(BaseModel):
    description: str
    build_minutes: int = Field(gt=0)
    shelter_person_factor: float = Field(gt=0)
    ratings: dict[str, Rating]


class ModuleOut(BaseModel):
    id: int
    recipe_id: str
    recipe_name: str
    shelter_person_factor: float
    produced_at: str


class Bounds(BaseModel):
    min: float | None = None
    max: float | None = None


class AidQuery(BaseModel):
    people: int = Field(gt=0)
    filters: dict[str, Bounds] = {}


class AidGroup(BaseModel):
    recipe_id: str
    recipe_name: str
    count: int
    shelter_person_factor: float
    people: int
    ratings: dict[str, Rating]


class AidResult(BaseModel):
    groups: list[AidGroup]
    total_people: int
    requested: int
    shortfall: int


class ScoreRow(BaseModel):
    name: str
    slug: str
    kind: Literal["Zulieferer", "Hersteller"]
    modules: int
    score: int

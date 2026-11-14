from typing import Literal

from pydantic import BaseModel, Field

MAX_BATCH = 1000


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    display_name: str
    role: str


class DemoUser(BaseModel):
    username: str
    display_name: str
    role: str


class ItemIn(BaseModel):
    material: str
    length_cm: float | None = Field(default=None, gt=0)
    width_cm: float | None = Field(default=None, gt=0)
    thickness_cm: float | None = Field(default=None, gt=0)
    quantity: int = Field(gt=0)
    delivery_own: bool = False
    delivery_date: str | None = None
    note: str = ""
    photo_data_url: str | None = None


class OfferIn(BaseModel):
    items: list[ItemIn] = Field(min_length=1)


class ItemOut(BaseModel):
    id: int
    material: str
    supplier_name: str
    length_cm: float | None
    width_cm: float | None
    thickness_cm: float | None
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
    ratings: dict[str, int]


class BuildableRecipe(Recipe):
    max_count: int


class ProduceIn(BaseModel):
    count: int = Field(default=1, ge=1, le=MAX_BATCH)


class SupplierEstimate(BaseModel):
    credited_modules: int
    credited_score: float
    potential_modules: int
    potential_score: float
    recipe_name: str | None


class RecipeMetaUpdate(BaseModel):
    description: str
    build_minutes: int = Field(gt=0)
    shelter_person_factor: float = Field(gt=0)
    ratings: dict[str, int]


class ModuleOut(BaseModel):
    id: int
    recipe_id: str
    recipe_name: str
    shelter_person_factor: float
    produced_at: str


class AidQuery(BaseModel):
    people: int = Field(gt=0)
    min_ratings: dict[str, int] = {}


class AidGroup(BaseModel):
    recipe_id: str
    recipe_name: str
    count: int
    shelter_person_factor: float
    people: float
    ratings: dict[str, int]


class AidResult(BaseModel):
    groups: list[AidGroup]
    total_people: float
    requested: int
    shortfall: float


class ScoreRow(BaseModel):
    name: str
    kind: Literal["Zulieferer", "Hersteller"]
    modules: int
    score: float

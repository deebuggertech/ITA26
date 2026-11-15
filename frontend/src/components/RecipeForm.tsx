import { useState, type FormEvent } from "react";
import type { Criterion, Rating, Recipe, RecipeUpdate } from "../api/types";

interface Props {
  criteria: Criterion[];
  existing: Recipe;
  onSubmit: (input: RecipeUpdate) => Promise<void>;
}

export function RecipeForm({ criteria, existing, onSubmit }: Props) {
  const [description, setDescription] = useState(existing.description);
  const [minutes, setMinutes] = useState(String(existing.build_minutes));
  const [factor, setFactor] = useState(String(existing.shelter_person_factor));
  const [ratings, setRatings] = useState(existing.ratings);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      description, build_minutes: Number(minutes), shelter_person_factor: Number(factor.replace(",", ".")), ratings,
    }).catch((err: Error) => setError(err.message));
  };

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Beschreibung
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="row">
        <label>
          Fertigungszeit (Minuten)
          <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label>
          Personenfaktor (0,25 = 4 Module je Person)
          <input value={factor} onChange={(e) => setFactor(e.target.value)} />
        </label>
      </div>
      <hr />
      {criteria.map((c) => (
        <RatingField key={c.key} criterion={c} value={ratings[c.key]} onChange={(v) => setRatings({ ...ratings, [c.key]: v })} />
      ))}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">Speichern</button>
    </form>
  );
}

function RatingField({ criterion: c, value, onChange }: { criterion: Criterion; value: Rating; onChange: (v: Rating) => void }) {
  const bounds = { min: c.min, max: c.max, step: c.step };
  const [low, high] = Array.isArray(value) ? value : [value, value];
  return (
    <fieldset>
      <legend>{c.label} ({c.unit})</legend>
      <div className="row">
        <label>
          {c.kind === "range" ? "Von" : "Wert"}
          <input type="number" {...bounds} value={low} onChange={(e) => onChange(c.kind === "range" ? [e.target.valueAsNumber, high] : e.target.valueAsNumber)} />
        </label>
        {c.kind === "range" && (
          <label>
            Bis
            <input type="number" {...bounds} value={high} onChange={(e) => onChange([low, e.target.valueAsNumber])} />
          </label>
        )}
      </div>
      <span className="muted">{c.description} · Skala {c.min} … {c.max} {c.unit}</span>
    </fieldset>
  );
}

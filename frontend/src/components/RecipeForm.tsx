import { useState, type FormEvent } from "react";
import type { Criterion, Recipe, RecipeUpdate } from "../api/types";

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
        <label key={c.key}>
          {c.label}: {ratings[c.key]}
          <input type="range" min={1} max={10} value={ratings[c.key]} onChange={(e) => setRatings({ ...ratings, [c.key]: Number(e.target.value) })} />
          <span className="muted">{c.description}</span>
        </label>
      ))}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">Speichern</button>
    </form>
  );
}

import { useState } from "react";
import { criteria as loadCriteria, searchAid } from "../api/endpoints";
import type { Bounds } from "../api/types";
import { Layout } from "../components/Layout";
import { useLoad } from "../hooks/useLoad";
import { formatRating } from "../lib";

export function AidPortal() {
  const criteria = useLoad(loadCriteria);
  const [people, setPeople] = useState(50);
  const [filters, setFilters] = useState<Record<string, Bounds>>({});
  const setBound = (key: string, side: keyof Bounds, raw: string) =>
    setFilters((f) => ({ ...f, [key]: { ...f[key], [side]: raw === "" ? undefined : Number(raw) } }));
  // Empty fields are dropped by JSON.stringify, so an untouched filter excludes nothing.
  const result = useLoad(() => searchAid(people, filters), [people, filters]);
  const r = result.data;

  return (
    <Layout>
      <h1>Hilfsorganisationen</h1>
      <div className="split">
        <section>
          <h2>Bedarf & Mindestanforderungen</h2>
          <div className="card form">
            <label>
              Personen mit Unterkunftsbedarf
              <input type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))} />
            </label>
            {criteria.data?.map((c) => (
              <fieldset key={c.key}>
                <legend>{c.label} ({c.unit})</legend>
                <div className="row">
                  <label>
                    {c.kind === "range" ? "Einsatz ab" : "Mindestens"}
                    <input type="number" step={c.step} placeholder={String(c.min)} value={filters[c.key]?.min ?? ""} onChange={(e) => setBound(c.key, "min", e.target.value)} />
                  </label>
                  <label>
                    {c.kind === "range" ? "Einsatz bis" : "Höchstens"}
                    <input type="number" step={c.step} placeholder={String(c.max)} value={filters[c.key]?.max ?? ""} onChange={(e) => setBound(c.key, "max", e.target.value)} />
                  </label>
                </div>
                <span className="muted">
                  {c.kind === "range" ? "Modul muss den gesamten Bereich abdecken" : c.description}
                </span>
              </fieldset>
            ))}
          </div>
        </section>
        <section>
          <h2>Verfügbare Module</h2>
          {r && (
            <div className="card">
              <div className="bar"><i style={{ width: `${Math.min(100, (r.total_people / r.requested) * 100)}%` }} /></div>
              <p>
              <strong>{r.total_people} Personen</strong> können untergebracht werden (Bedarf: {r.requested}).{" "}
              {r.shortfall > 0 ? <span className="error">Es fehlen noch Plätze für {r.shortfall} Personen.</span> : <span className="ok">Bedarf gedeckt.</span>}
              </p>
            </div>
          )}
          {r?.groups.length === 0 && <p className="muted">Keine Module entsprechen den Kriterien.</p>}
          {r?.groups.map((g) => (
            <article className="card item" key={g.recipe_id}>
              <div className="item-body">
                <strong>{g.count} × {g.recipe_name}</strong>
                <div className="muted">Faktor {g.shelter_person_factor} → {g.people} Personen</div>
                <div className="muted">
                  {criteria.data?.map((c) => `${c.label} ${formatRating(c, g.ratings[c.key])}`).join(" · ")}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </Layout>
  );
}

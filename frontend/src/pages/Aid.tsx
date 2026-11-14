import { useState } from "react";
import { criteria as loadCriteria, searchAid } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { useLoad } from "../hooks/useLoad";

export function AidPortal() {
  const criteria = useLoad(loadCriteria);
  const [people, setPeople] = useState(50);
  const [minimums, setMinimums] = useState<Record<string, number>>({});
  // 1 is the scale floor, so an untouched slider filters nothing.
  const result = useLoad(() => searchAid(people, minimums), [people, minimums]);
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
              <label key={c.key}>
                {c.label} mindestens: {minimums[c.key] ?? 1}
                <input type="range" min={1} max={10} value={minimums[c.key] ?? 1} onChange={(e) => setMinimums({ ...minimums, [c.key]: Number(e.target.value) })} />
              </label>
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
                  {criteria.data?.map((c) => `${c.label} ${g.ratings[c.key]}`).join(" · ")}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </Layout>
  );
}

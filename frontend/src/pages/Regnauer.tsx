import { useState } from "react";
import * as api from "../api/endpoints";
import type { BuildableRecipe, Item, Module, Recipe } from "../api/types";
import { Layout } from "../components/Layout";
import { MaterialCard } from "../components/MaterialCard";
import { Modal } from "../components/Modal";
import { RecipeForm } from "../components/RecipeForm";
import { Tabs } from "../components/Tabs";
import { useLoad } from "../hooks/useLoad";

const TABS = ["Dashboard", "Modulpläne"];

export function RegnauerPortal() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <Layout>
      <h1>Regnauer</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === TABS[0] ? <Dashboard /> : <Plans />}
    </Layout>
  );
}

function Dashboard() {
  const items = useLoad(api.acceptedItems);
  const buildable = useLoad(api.buildable);
  const stock = useLoad(api.stock);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => { items.reload(); buildable.reload(); stock.reload(); };
  const run = (action: Promise<unknown>) =>
    action.then(() => { setError(null); refresh(); }).catch((e: Error) => setError(e.message));

  return (
    <div className="split">
      <section>
        <h2>Eingehende & verfügbare Materialien</h2>
        {(error ?? items.error ?? buildable.error ?? stock.error) && (
          <p className="error">{error ?? items.error ?? buildable.error ?? stock.error}</p>
        )}
        {items.data?.length === 0 && <p className="muted">Keine Angebote vorhanden.</p>}
        {items.data?.map((i: Item) => (
          <MaterialCard
            key={i.id}
            item={{ ...i, photo: i.photo_url }}
            badge={<span className={i.status === "delivered" ? "badge ok-badge" : "badge"}>{i.status === "delivered" ? "Angeliefert" : "Angeboten"}</span>}
            actions={i.status === "offered" && <button onClick={() => run(api.markDelivered(i.id))}>Als angeliefert markieren</button>}
          />
        ))}
      </section>
      <div>
        <section>
          <h2>Baubare Module</h2>
          {buildable.data?.length === 0 && <p className="muted">Mit dem angelieferten Material ist aktuell kein Modul baubar.</p>}
          {buildable.data?.map((r) => (
            <BuildRow key={r.id} recipe={r} onProduce={(count) => run(api.produce(r.id, count))} />
          ))}
        </section>
        <section>
          <h2>Lagerbestand / Fertige Module ({stock.data?.length ?? 0})</h2>
          {stock.data?.length === 0 && <p className="muted">Noch keine Module produziert.</p>}
          {stock.data?.map((m: Module) => (
            <article className="card item" key={m.id}>
              <div className="item-body">
                <strong>{m.recipe_name}</strong>
                <div className="muted">Nr. {m.id} · Faktor {m.shelter_person_factor} · {m.produced_at}</div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function BuildRow({ recipe: r, onProduce }: { recipe: BuildableRecipe; onProduce: (count: number) => void }) {
  const [count, setCount] = useState(1);
  const valid = Number.isInteger(count) && count >= 1 && count <= r.max_count;
  return (
    <article className="card item">
      <div className="item-body">
        <strong>{r.name}</strong>
        <div className="muted">
          {r.build_minutes} Min./Stk. · Faktor {r.shelter_person_factor} · max. {r.max_count}
          {valid && count > 1 && ` · gesamt ${r.build_minutes * count} Min.`}
        </div>
      </div>
      <input
        type="number" min={1} max={r.max_count} value={count} style={{ width: "5em" }}
        aria-label={`Anzahl ${r.name}`}
        onChange={(e) => setCount(e.target.valueAsNumber)}
      />
      <button className="primary" disabled={!valid} onClick={() => onProduce(count)}>Produzieren</button>
    </article>
  );
}

function Plans() {
  const recipes = useLoad(api.recipes);
  const criteria = useLoad(api.criteria);
  const [editing, setEditing] = useState<Recipe | null>(null);

  if (!criteria.data) return null;
  const close = () => { setEditing(null); recipes.reload(); };

  return (
    <>
      <h2>Modulpläne</h2>
      {recipes.data?.map((r) => (
        <article className="card item" key={r.id}>
          <div className="item-body">
            <strong>{r.name}</strong>
            <div className="muted">{r.description}</div>
            <div className="muted">
              {r.build_minutes} Min. · Faktor {r.shelter_person_factor} ·{" "}
              {criteria.data!.map((c) => `${c.label} ${r.ratings[c.key]}`).join(" · ")}
            </div>
          </div>
          <button onClick={() => setEditing(r)}>Bearbeiten</button>
        </article>
      ))}
      {editing && (
        <Modal title={editing.name} onClose={() => setEditing(null)}>
          <RecipeForm
            criteria={criteria.data}
            existing={editing}
            onSubmit={async (input) => {
              await api.updateRecipe(editing.id, input);
              close();
            }}
          />
        </Modal>
      )}
    </>
  );
}

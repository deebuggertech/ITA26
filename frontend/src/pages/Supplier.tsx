import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOffer, materialTypes, submitOffer, supplierEstimate, uploadRoutes } from "../api/endpoints";
import type { ItemDraft } from "../api/types";
import { Layout } from "../components/Layout";
import { MaterialCard } from "../components/MaterialCard";
import { MaterialForm, type Prefill } from "../components/MaterialForm";
import { PhotoCapture } from "../components/PhotoCapture";
import { useAuth } from "../hooks/useAuth";
import { useLoad } from "../hooks/useLoad";
import { analysisToInputs, quarter } from "../lib";

export function SupplierPortal() {
  const { session } = useAuth();
  return (
    <Layout>
      {session?.role === "logistics" ? <LogisticsUpload /> : <OfferBuilder />}
    </Layout>
  );
}

function OfferBuilder() {
  const { data: types, error } = useLoad(materialTypes);
  const [staged, setStaged] = useState<ItemDraft[]>([]);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = () =>
    submitOffer(staged)
      .then((r) => navigate(`/zulieferer/ergebnis/${r.offer_id}`))
      .catch((e: Error) => setSubmitError(e.message));

  return (
    <>
      <h1>Material anbieten</h1>
      {error && <p className="error">{error}</p>}
      <div className="split">
        <section>
          <h2>Foto-Erkennung</h2>
          <PhotoCapture
            onResult={(a, photo) => {
              const type = types?.find((t) => t.name === a.material);
              setPrefill({ name: type?.name ?? "", inputs: type ? analysisToInputs(type, a) : {}, note: a.note, photo });
            }}
          />
          <h2 className="section-gap">Neue Position</h2>
          {types && <MaterialForm types={types} prefill={prefill} onAdd={(d) => setStaged([...staged, d])} />}
        </section>
        <section>
          <h2>Ihr Angebot ({staged.length})</h2>
          {staged.length === 0 && <p className="muted">Noch keine Positionen.</p>}
          {staged.map((d, i) => (
            <MaterialCard
              key={i}
              item={{ ...d, photo: d.photo_data_url }}
              actions={<button onClick={() => setStaged(staged.filter((_, idx) => idx !== i))}>Entfernen</button>}
            />
          ))}
          {submitError && <p className="error">{submitError}</p>}
          <button className="primary" disabled={staged.length === 0} onClick={submit}>Angebot absenden</button>
        </section>
      </div>
    </>
  );
}

export function OfferResultPage() {
  const { offerId = "" } = useParams();
  const { data, error } = useLoad(() => getOffer(offerId), [offerId]);
  const estimate = useLoad(supplierEstimate);
  const accepted = data?.items.filter((i) => i.accepted) ?? [];
  const rejected = data?.items.filter((i) => !i.accepted) ?? [];

  return (
    <Layout>
      <h1>Ergebnis Ihres Angebots</h1>
      {error && <p className="error">{error}</p>}
      {estimate.error && <p className="error">{estimate.error}</p>}
      {estimate.data && (
        <div className="stats">
          <div className="stat">
            <span className="muted">Gutschrift (Scoreboard)</span>
            <strong>{quarter(estimate.data.credited_score)}</strong>
            <span className="muted">Personen · {quarter(estimate.data.credited_modules)} Module gebaut</span>
          </div>
          <div className="stat">
            <span className="muted">Potenzial (Schätzung)</span>
            <strong>{quarter(estimate.data.potential_score)}</strong>
            <span className="muted">
              {estimate.data.recipe_name
                ? `Personen · max. ${quarter(estimate.data.potential_modules)} × ${estimate.data.recipe_name} aus Ihrem restlichen Material`
                : "Aktuell kein Modul aus Ihrem Material baubar"}
            </span>
          </div>
        </div>
      )}
      <div className="split">
        <section>
          <h2>Angenommen ({accepted.length})</h2>
          {accepted.map((i) => <MaterialCard key={i.id} item={{ ...i, photo: i.photo_url }} footer={<span className="ok">Wird benötigt</span>} />)}
        </section>
        <section>
          <h2>In Krisenbudget aufgenommen ({rejected.length})</h2>
          {rejected.map((i) => <MaterialCard key={i.id} item={{ ...i, photo: i.photo_url }} footer={<span className="error">{i.reject_reason}</span>} />)}
        </section>
      </div>
      <Link to="/zulieferer" className="button">Weiteres Angebot erstellen</Link>
    </Layout>
  );
}

function LogisticsUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) return;
    uploadRoutes(file.name, await file.text())
      .then(() => setDone(true))
      .catch((e: Error) => setError(e.message));
  };

  if (done) return <p className="card">Vielen Dank! Wir haben Ihre Routendaten erhalten und melden uns bei Ihnen.</p>;
  return (
    <div className="narrow">
      <h1>Routendaten übermitteln</h1>
      <div className="card form">
        <label>
          JSON-Datei (Strecke, freier Laderaum, Reisedaten)
          <input type="file" accept=".json,application/json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={!file} onClick={submit}>Absenden</button>
      </div>
    </div>
  );
}

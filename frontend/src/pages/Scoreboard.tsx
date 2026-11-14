import { scoreboard } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { useLoad } from "../hooks/useLoad";

export function Scoreboard() {
  const { data, error } = useLoad(scoreboard);
  const max = Math.max(1, ...(data ?? []).map((r) => r.score));
  return (
    <Layout>
      <h1>Scoreboard</h1>
      <p className="muted">Wirkung = Summe der Personenfaktoren aller Module, für die Material des Unternehmens verbaut wurde.</p>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr><th>#</th><th>Unternehmen</th><th>Rolle</th><th>Module</th><th>Untergebrachte Personen</th></tr>
        </thead>
        <tbody>
          {data?.map((r, i) => (
            <tr key={r.name}>
              <td><span className={`rank rank-${i + 1}`}>{i + 1}</span></td><td>{r.name}</td><td>{r.kind}</td><td>{r.modules}</td><td>
                <div className="score-cell">
                  <strong>{r.score}</strong>
                  <div className={r.kind === "Hersteller" ? "bar warm" : "bar"}><i style={{ width: `${(r.score / max) * 100}%` }} /></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

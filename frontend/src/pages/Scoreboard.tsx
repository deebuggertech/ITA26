import { scoreboard } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { ShelterMap } from "../components/ShelterMap";
import { useLoad } from "../hooks/useLoad";
import { embedSnippet } from "../lib";

export function Scoreboard() {
  const { data, error } = useLoad(scoreboard);
  return (
    <Layout>
      <h1>Projekte</h1>
      <p className="muted">Untergebrachte Personen = Summe der Personenfaktoren aller Module, für die Material des Unternehmens verbaut wurde.</p>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr><th>Unternehmen</th><th>Rolle</th><th>Module</th><th>Untergebrachte Personen</th><th>Einbetten</th></tr>
        </thead>
        <tbody>
          {data?.map((r) => (
            <tr key={r.slug}>
              <td>{r.name}</td><td>{r.kind}</td><td>{r.modules}</td><td>{r.score}</td>
              <td>
                <details>
                  <summary>iframe-Code</summary>
                  <textarea readOnly rows={3} value={embedSnippet(r.slug)} onFocus={(e) => e.currentTarget.select()} />
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="section-gap">Einsatzorte</h2>
      <ShelterMap />
    </Layout>
  );
}

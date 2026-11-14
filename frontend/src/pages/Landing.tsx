import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PORTALS } from "../lib";

export function Landing() {
  return (
    <Layout hero>
      <section className="hero">
        <div className="portal-grid">
          {PORTALS.map((p, _) => (
            <Link key={p.slug} to={p.path} className="portal">
              <strong>{p.title}</strong>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { scoreboard } from "../api/endpoints";
import { useLoad } from "../hooks/useLoad";

/** Badge for partner iframes; deliberately outside Layout. */
export function Embed() {
  const { slug } = useParams();
  const { data } = useLoad(scoreboard);
  const row = data?.find((r) => r.slug === slug);

  // Keep the app background from showing on the partner's page.
  useEffect(() => {
    document.body.classList.add("embed-body");
    return () => document.body.classList.remove("embed-body");
  }, []);

  if (!row) return null;
  return (
    <div className="embed">
      <svg className="embed-mark" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="23" fill="#234d3b" stroke="#c9a227" strokeWidth="2" />
        <path d="M10 25 24 13l14 12h-4v10H14V25z" fill="#e6c75a" />
        <path d="M24 34c0-6 3-9 9-10 0 6-3 10-9 10z" fill="#8fb878" />
        <path d="M24 34c1-4 3-7 6-9" stroke="#234d3b" strokeWidth="1.5" fill="none" />
      </svg>
      <div className="embed-text">
        <strong>Wir sind Teil von Re:Build Impact</strong>
        {row.modules > 0 && (
          <span>
            Über Re:Build Impact haben wir bereits zum Bau von {row.modules} Notunterkunfts-Modulen aus
            Bauteilresten beigetragen.
          </span>
        )}
      </div>
      {row.modules > 0 && (
        <div className="embed-stats">
          <div><b>{row.modules}</b><span>Module</span></div>
          <div><b>{row.score}</b><span>Personen</span></div>
        </div>
      )}
    </div>
  );
}

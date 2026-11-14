import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={hero ? "page page-hero" : "page"}>
      <header className="header">
        <Link to="/" className="logo">
          <img src="/logo.jpg" alt="Regnauer – Häuser, die gut tun." />
        </Link>
        <nav className="header-nav">
          {session && (
            <>
              <span className="muted-on-header">{session.display_name}</span>
              <button className="link-button" onClick={() => { logout(); navigate("/"); }}>Abmelden</button>
            </>
          )}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

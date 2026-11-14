import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PORTALS } from "./lib";
import { AidPortal } from "./pages/Aid";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { RegnauerPortal } from "./pages/Regnauer";
import { Scoreboard } from "./pages/Scoreboard";
import { OfferResultPage, SupplierPortal } from "./pages/Supplier";

const portal = (slug: string) => PORTALS.find((p) => p.slug === slug)!;

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/:portal" element={<Login />} />
      <Route path="/zulieferer" element={<ProtectedRoute portal={portal("zulieferer")}><SupplierPortal /></ProtectedRoute>} />
      <Route path="/zulieferer/ergebnis/:offerId" element={<ProtectedRoute portal={portal("zulieferer")}><OfferResultPage /></ProtectedRoute>} />
      <Route path="/regnauer" element={<ProtectedRoute portal={portal("regnauer")}><RegnauerPortal /></ProtectedRoute>} />
      <Route path="/scoreboard" element={<Scoreboard />} />
      <Route path="/hilfsorganisationen" element={<ProtectedRoute portal={portal("hilfsorganisationen")}><AidPortal /></ProtectedRoute>} />
    </Routes>
  );
}

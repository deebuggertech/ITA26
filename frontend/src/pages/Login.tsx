import { Navigate, useNavigate, useParams } from "react-router-dom";
import { demoUsers } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";
import { useLoad } from "../hooks/useLoad";
import { PORTALS } from "../lib";

export function Login() {
  const { portal: slug } = useParams();
  const portal = PORTALS.find((p) => p.slug === slug && p.roles.length > 0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { data: users } = useLoad(demoUsers);

  if (!portal) return <Navigate to="/" replace />;
  const portalUsers = users?.filter((u) => portal.roles.includes(u.role)) ?? [];

  return (
    <Layout>
      <div className="narrow">
        <h1>{portal.title}</h1>
        {users && (
          <LoginForm
            key={portal.slug}
            users={portalUsers}
            onLogin={async (u, p) => {
              await login(u, p);
              navigate(portal.path);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

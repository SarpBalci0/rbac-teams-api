import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";
import TeamDetailPage from "./pages/TeamDetailPage.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/teams"
        element={
          <RequireAuth>
            <Layout>
              <TeamsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/teams/:teamId"
        element={
          <RequireAuth>
            <Layout>
              <TeamDetailPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/teams" replace />} />
      <Route path="*" element={<Navigate to="/teams" replace />} />
    </Routes>
  );
}

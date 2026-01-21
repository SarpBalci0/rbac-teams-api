import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";
import TeamDetailPage from "./pages/TeamDetailPage.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teams" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/teams" replace />} />
    </Routes>
  );
}

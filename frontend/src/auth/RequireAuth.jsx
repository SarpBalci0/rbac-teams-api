import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Loading from "../components/Loading.jsx";

export default function RequireAuth({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking session..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { BottomTabBar } from "./BottomTabBar";

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-black/50">Loading…</div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen pb-16">
      <Outlet />
      <BottomTabBar />
    </div>
  );
}

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ProcessingProvider } from "./context/ProcessingContext";

import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Library from "./pages/Library";
import Users from "./pages/Users";
import VideoDetail from "./pages/VideoDetails";
import { Spinner } from "./components/Button";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen accent">
        <Spinner size="lg" />
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}


function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <AuthPage />
          </GuestOnly>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <ProcessingProvider>
              <Layout>
                <Outlet />
              </Layout>
            </ProcessingProvider>
          </RequireAuth>
        }
      >
        {/* Redirect root → dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<VideoDetail />} />

        <Route
          path="upload"
          element={
            <RequireRole roles={["editor", "admin"]}>
              <Upload />
            </RequireRole>
          }
        />

        <Route
          path="users"
          element={
            <RequireRole roles={["admin"]}>
              <Users />
            </RequireRole>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

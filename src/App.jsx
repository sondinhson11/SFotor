import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// Lazy load các pages để giảm bundle size ban đầu
const Home = lazy(() => import("./pages/Home"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Shoot = lazy(() => import("./pages/Shoot"));
const FrameSelection = lazy(() => import("./pages/FrameSelection"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// Component to handle 404.html redirect
function RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect from 404.html
    const queryString = location.search;
    if (queryString.startsWith("?/")) {
      const path = queryString.slice(2).split("&")[0].replace(/~and~/g, "&");
      navigate(path, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function App() {
  const getBasename = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (!hostname.includes("github.io")) {
        return "";
      }
    }
    return "/SFotor";
  };

  // Loading component cho lazy routes
  const LoadingFallback = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F5A8E8 0%, #E8B0D8 100%)",
        color: "#7A3D6A",
      }}
    >
      <div
        style={{
          width: "50px",
          height: "50px",
          border: "4px solid rgba(122, 61, 106, 0.2)",
          borderTop: "4px solid #7A3D6A",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ marginTop: "1rem", fontSize: "1rem" }}>Đang tải...</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  return (
    <ErrorBoundary>
      <Router basename={getBasename()}>
        <RedirectHandler />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/shoot" element={<Shoot />} />
            <Route path="/frames" element={<FrameSelection />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

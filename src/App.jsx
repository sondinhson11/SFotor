import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Welcome from "./pages/Welcome";
import Shoot from "./pages/Shoot";
import FrameSelection from "./pages/FrameSelection";
import "./App.css";

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
  return (
    <Router basename="/SFotor">
      <RedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/shoot" element={<Shoot />} />
        <Route path="/frames" element={<FrameSelection />} />
      </Routes>
    </Router>
  );
}

export default App;

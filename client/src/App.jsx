import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import BrowseFacilitiesPage from "./pages/public/BrowseFacilitiesPage";
import FacilityDetailsPage from "./pages/public/FacilityDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/facilities" element={<BrowseFacilitiesPage />} />
        <Route path="/facilities/:id" element={<FacilityDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import BrowseFacilitiesPage from "./pages/public/BrowseFacilitiesPage";
import FacilityDetailsPage from "./pages/public/FacilityDetailsPage";
import BookingConfirmationPage from "./pages/customer/BookingConfirmationPage";
import ScrollToTop from "./components/layout/ScrollToTop";
import PaymentProofUploadPage from "./pages/customer/PaymentProofUploadPage";
import PaymentVerificationPage from "./pages/merchant/PaymentVerificationPage";
import MerchantDashboardPage from "./pages/merchant/MerchantDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/facilities" element={<BrowseFacilitiesPage />} />
        <Route path="/facilities/:id" element={<FacilityDetailsPage />} />
        <Route path="/booking/confirm" element={<BookingConfirmationPage />} />
        <Route path="/payment-proof" element={<PaymentProofUploadPage />} />
        <Route path="/merchant/payments" element={<PaymentVerificationPage />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
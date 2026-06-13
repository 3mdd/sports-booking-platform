import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProfilePage from "./pages/auth/ProfilePage";
import BrowseFacilitiesPage from "./pages/public/BrowseFacilitiesPage";
import FacilityDetailsPage from "./pages/public/FacilityDetailsPage";
import BookingConfirmationPage from "./pages/customer/BookingConfirmationPage";
import CustomerBookingHistoryPage from "./pages/customer/CustomerBookingHistoryPage";
import ScrollToTop from "./components/layout/ScrollToTop";
import PaymentProofUploadPage from "./pages/customer/PaymentProofUploadPage";
import PaymentVerificationPage from "./pages/merchant/PaymentVerificationPage";
import MerchantDashboardPage from "./pages/merchant/MerchantDashboardPage";
import MerchantFacilityManagementPage from "./pages/merchant/MerchantFacilityManagementPage";
import MerchantSlotManagementPage from "./pages/merchant/MerchantSlotManagementPage";
import MerchantReviewInsightsPage from "./pages/merchant/MerchantReviewInsightsPage";
import MerchantPaymentSettingsPage from "./pages/merchant/MerchantPaymentSettingsPage";
import RequireRole from "./components/auth/RequireRole";
import RequireAuth from "./components/auth/RequireAuth";
import RequireApprovedMerchant from "./components/auth/RequireApprovedMerchant";
import MerchantApprovalStatusPage from "./pages/merchant/MerchantApprovalStatusPage";
import AdminMerchantApprovalPage from "./pages/admin/AdminMerchantApprovalPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register/customer"
          element={<RegisterPage role="CUSTOMER" />}
        />
        <Route
          path="/register/merchant"
          element={<RegisterPage role="MERCHANT" />}
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/facilities" element={<BrowseFacilitiesPage />} />
        <Route path="/facilities/:id" element={<FacilityDetailsPage />} />
        <Route
          path="/booking/confirm"
          element={
            <RequireRole role="CUSTOMER">
              <BookingConfirmationPage />
            </RequireRole>
          }
        />
        <Route
          path="/customer/bookings"
          element={
            <RequireRole role="CUSTOMER">
              <CustomerBookingHistoryPage />
            </RequireRole>
          }
        />
        <Route
          path="/payment-proof"
          element={
            <RequireRole role="CUSTOMER">
              <PaymentProofUploadPage />
            </RequireRole>
          }
        />
        <Route
          path="/merchant/payments"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <PaymentVerificationPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/payment-settings"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <MerchantPaymentSettingsPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/dashboard"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <MerchantDashboardPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/reviews"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <MerchantReviewInsightsPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/facilities"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <MerchantFacilityManagementPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/facilities/:facilityId/slots"
          element={
            <RequireRole role="MERCHANT">
              <RequireApprovedMerchant>
                <MerchantSlotManagementPage />
              </RequireApprovedMerchant>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/approval-status"
          element={
            <RequireRole role="MERCHANT">
              <MerchantApprovalStatusPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/merchants"
          element={
            <RequireRole role="ADMIN">
              <AdminMerchantApprovalPage />
            </RequireRole>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { Navigate } from "react-router-dom";
import { getMerchantApprovalStatus } from "../../utils/auth";

function RequireApprovedMerchant({ children }) {
  if (getMerchantApprovalStatus() !== "APPROVED") {
    return <Navigate to="/merchant/approval-status" replace />;
  }

  return children;
}

export default RequireApprovedMerchant;

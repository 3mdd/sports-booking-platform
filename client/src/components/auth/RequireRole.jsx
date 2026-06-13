import { Navigate, useLocation } from "react-router-dom";
import { getAuthUser } from "../../utils/auth";

function RequireRole({ role, children }) {
  const location = useLocation();
  const authUser = getAuthUser();

  if (!authUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: "Please log in to continue.",
          from: location.pathname,
        }}
      />
    );
  }

  if (authUser.role !== role) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: `This page requires a ${role.toLowerCase()} account.`,
        }}
      />
    );
  }

  const profileId =
    role === "CUSTOMER"
      ? Number(authUser.customerProfileId)
      : role === "MERCHANT"
      ? Number(authUser.merchantProfileId)
      : null;

  if (
    role !== "ADMIN" &&
    (!Number.isInteger(profileId) || profileId <= 0)
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: "Your account profile is incomplete. Please log in again.",
        }}
      />
    );
  }

  return children;
}

export default RequireRole;

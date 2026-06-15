import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../../utils/auth";

function RequireAuth({ children }) {
  const location = useLocation();

  if (!getAuthUser() || !getAuthToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: "Please log in to view your profile.",
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default RequireAuth;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuthUser, logout } from "../../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(() => getAuthUser());

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-emerald-950"
          >
            EliteSport
          </Link>

          <nav className="hidden items-center gap-5 md:flex lg:gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-emerald-950 hover:text-lime-600"
            >
              Home
            </Link>
            <Link
              to="/facilities"
              className="text-sm font-medium text-gray-600 hover:text-lime-600"
            >
              Facilities
            </Link>
            {authUser?.role === "CUSTOMER" ? (
              <Link
                to="/customer/bookings"
                className="text-sm font-medium text-gray-600 hover:text-lime-600"
              >
                My Bookings
              </Link>
            ) : null}
            {authUser?.role === "MERCHANT" ? (
              <>
                <Link
                  to="/merchant/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-lime-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/merchant/facilities"
                  className="text-sm font-medium text-gray-600 hover:text-lime-600"
                >
                  Manage Facilities
                </Link>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {authUser ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-emerald-950">
                  {authUser.fullName}
                </p>
                <p className="text-xs font-medium capitalize text-slate-500">
                  {authUser.role.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:block"
              >
                Login
              </Link>
              <Link
                to="/facilities"
                className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-lime-300"
              >
                Book Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

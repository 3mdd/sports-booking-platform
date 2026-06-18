import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_USER_UPDATED_EVENT,
  getAuthUser,
  logout,
} from "../../utils/auth";
import { getUploadFileUrl } from "../../utils/uploadUrl";

const guestNavigation = [
  { label: "Home", to: "/" },
  { label: "Facilities", to: "/facilities" },
  { label: "Login", to: "/login" },
  { label: "Register", to: "/register/customer", matchPrefix: "/register" },
];

const customerNavigation = [
  { label: "Home", to: "/" },
  { label: "Facilities", to: "/facilities" },
  { label: "My Bookings", to: "/customer/bookings" },
];

const merchantNavigation = [
  { label: "Dashboard", to: "/merchant/dashboard" },
  { label: "Bookings", to: "/merchant/bookings" },
  { label: "Analytics", to: "/merchant/analytics" },
  { label: "Facilities", to: "/merchant/facilities" },
  { label: "Payments", to: "/merchant/payments" },
  { label: "Payment Setup", to: "/merchant/payment-settings" },
  { label: "Reviews", to: "/merchant/reviews" },
];

const merchantApprovalNavigation = [
  { label: "Approval Status", to: "/merchant/approval-status" },
];

const adminNavigation = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Merchants", to: "/admin/merchants" },
  { label: "Users", to: "/admin/users" },
  { label: "Facilities", to: "/admin/facilities" },
  { label: "Reports", to: "/admin/reports" },
];

function getInitials(fullName) {
  const nameParts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) return "U";

  return nameParts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getFirstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "User";
}

function getDisplayName(user) {
  return user?.username || getFirstName(user?.fullName);
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigation =
    authUser?.role === "ADMIN"
      ? adminNavigation
      : authUser?.role === "MERCHANT"
      ? (authUser.merchantApprovalStatus || "APPROVED") === "APPROVED"
        ? merchantNavigation
        : merchantApprovalNavigation
      : authUser?.role === "CUSTOMER"
      ? customerNavigation
      : guestNavigation;

  useEffect(() => {
    const refreshAuthUser = () => setAuthUser(getAuthUser());

    window.addEventListener("storage", refreshAuthUser);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, refreshAuthUser);

    return () => {
      window.removeEventListener("storage", refreshAuthUser);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, refreshAuthUser);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isNavigationActive = (item) => {
    if (item.to === "/") {
      return location.pathname === "/";
    }

    const pathToMatch = item.matchPrefix || item.to;

    return (
      location.pathname === item.to ||
      location.pathname.startsWith(`${pathToMatch}/`)
    );
  };

  const getNavigationClass = (item, mobile = false) => {
    const isActive = isNavigationActive(item);
    const sizeClass = mobile
      ? "whitespace-nowrap px-3 py-2 text-xs"
      : "px-3 py-2 text-sm";

    return `${sizeClass} rounded-lg font-semibold transition ${
      isActive
        ? "bg-lime-100 text-emerald-950"
        : "text-slate-600 hover:bg-gray-100 hover:text-emerald-950"
    }`;
  };

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    setIsProfileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <Link
            to="/"
            onClick={() => setIsProfileMenuOpen(false)}
            className="shrink-0 text-xl font-black tracking-tight text-emerald-950"
          >
            Elite<span className="text-lime-500">Sport</span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setIsProfileMenuOpen(false)}
                className={getNavigationClass(item)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {authUser ? (
          <div ref={profileMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setIsProfileMenuOpen((currentState) => !currentState)
              }
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-left transition hover:border-lime-300 hover:bg-lime-50"
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-950 text-xs font-black text-lime-300">
                <span>{getInitials(authUser.fullName)}</span>
                {authUser.avatarUrl ? (
                  <img
                    src={getUploadFileUrl(authUser.avatarUrl)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-32 truncate text-sm font-bold text-emerald-950">
                  {getDisplayName(authUser)}
                </span>
                <span className="block text-xs font-medium capitalize text-slate-500">
                  {authUser.role.toLowerCase()}
                </span>
              </span>
              <span
                className={`hidden text-xs text-slate-400 transition sm:block ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              >
                &#9662;
              </span>
            </button>

            {isProfileMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
              >
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="truncate text-sm font-bold text-emerald-950">
                    {authUser.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {authUser.username
                      ? `@${authUser.username}`
                      : authUser.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`mt-1 block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    location.pathname === "/profile"
                      ? "bg-lime-100 text-emerald-950"
                      : "text-slate-700 hover:bg-gray-100"
                  }`}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <nav className="border-t border-gray-100 px-4 py-2 xl:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto">
          {navigation.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setIsProfileMenuOpen(false)}
              className={getNavigationClass(item, true)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

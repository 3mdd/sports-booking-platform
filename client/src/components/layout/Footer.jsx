import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-14 bg-emerald-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 md:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-xl font-black tracking-tight">EliteSport</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-100/80">
            A multi-vendor sports facility booking platform for customers and
            merchants to manage reservations more efficiently.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            Platform
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
            <li>
              <Link to="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link to="/facilities" className="hover:text-white">
                Browse Facilities
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            Accounts
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
            <li>
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register/customer" className="hover:text-white">
                Register Customer
              </Link>
            </li>
            <li>
              <Link to="/register/merchant" className="hover:text-white">
                Register Merchant
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-xs text-emerald-100/60 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>&copy; 2026 EliteSport Technologies. All rights reserved.</p>
          <p>Sports booking for customers, merchants, and administrators.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

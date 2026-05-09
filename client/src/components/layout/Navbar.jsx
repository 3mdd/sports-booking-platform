import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-2xl font-black tracking-tight text-emerald-950">
            EliteSport
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm font-medium text-emerald-950 hover:text-lime-600">
              Home
            </Link>
            <Link
  to="/facilities"
  className="text-sm font-medium text-gray-600 hover:text-lime-600"
>
  Browse Facilities
</Link>
            <button className="text-sm font-medium text-gray-600 hover:text-lime-600">
              How It Works
            </button>
            <Link
  to="/merchant/dashboard"
  className="text-sm font-medium text-gray-600 hover:text-lime-600"
>
  Merchant Portal
</Link>
            <button className="text-sm font-medium text-gray-600 hover:text-lime-600">
              Support
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 md:block"
          >
            Login
          </Link>

          <button className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-lime-300">
            Book Now
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
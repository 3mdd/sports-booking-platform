import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { authFetch } from "../../utils/api";

const kpiDefinitions = [
  { key: "users", label: "Total Users" },
  { key: "customers", label: "Customers" },
  { key: "merchants", label: "Merchants" },
  { key: "admins", label: "Admins" },
  { key: "pendingMerchants", label: "Pending Merchants" },
  { key: "facilities", label: "Facilities" },
  { key: "bookings", label: "Total Bookings" },
  { key: "confirmedBookings", label: "Confirmed Bookings" },
  { key: "pendingVerification", label: "Payment Verification" },
  { key: "overduePaymentVerification", label: "Overdue Verification" },
  { key: "reviews", label: "Reviews" },
];

function AdminDashboardPage() {
  const [totals, setTotals] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await authFetch(
          "http://localhost:5000/admin/dashboard"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load admin dashboard");
        }

        setTotals(data.totals || {});
      } catch (error) {
        console.error("Fetch admin dashboard error:", error);
        setErrorMessage(error.message || "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Admin Portal
            </p>
            <h1 className="mt-2 text-3xl font-black text-emerald-950 md:text-4xl">
              Platform Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Monitor users, merchant approvals, facilities, bookings, and
              customer activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/merchants"
              className="rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-lime-300"
            >
              Review Merchants
            </Link>
            <Link
              to="/admin/users"
              className="rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Manage Users
            </Link>
          </div>
        </section>

        {errorMessage ? (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kpiDefinitions.map((item) => (
            <article
              key={item.key}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-black text-emerald-950">
                {isLoading ? "..." : totals[item.key] || 0}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            to="/admin/merchants"
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-lime-300"
          >
            <p className="font-black text-emerald-950">Merchant Approvals</p>
            <p className="mt-2 text-sm text-slate-600">
              Review verification documents and pending applications.
            </p>
          </Link>
          <Link
            to="/admin/users"
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-lime-300"
          >
            <p className="font-black text-emerald-950">User Management</p>
            <p className="mt-2 text-sm text-slate-600">
              Monitor account roles and activate or deactivate access.
            </p>
          </Link>
          <Link
            to="/admin/facilities"
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-lime-300"
          >
            <p className="font-black text-emerald-950">
              Facility Management
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Review facility ownership and control customer visibility.
            </p>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminDashboardPage;

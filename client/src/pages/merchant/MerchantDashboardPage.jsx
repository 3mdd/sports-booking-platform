import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const recentBookings = [
  {
    id: 1,
    customerName: "Ahmad Hakim",
    facilityName: "Padel Point Club",
    date: "6 May 2026",
    time: "20:00 - 21:00",
    amount: "RM 90.00",
    status: "Payment Uploaded",
  },
  {
    id: 2,
    customerName: "Sarah Lim",
    facilityName: "Smash Indoor Court",
    date: "7 May 2026",
    time: "18:00 - 19:30",
    amount: "RM 67.50",
    status: "Pending Payment",
  },
  {
    id: 3,
    customerName: "Daniel Wong",
    facilityName: "Grand Football Arena",
    date: "8 May 2026",
    time: "21:00 - 23:00",
    amount: "RM 240.00",
    status: "Confirmed",
  },
];

function MerchantDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Portal
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
              Merchant Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Monitor bookings, facility activity, revenue, and payment proof
              verification from one merchant workspace.
            </p>
          </div>

          <Link
            to="/merchant/payments"
            className="rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Review Payments
          </Link>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Today’s Bookings
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">12</p>
            <p className="mt-2 text-sm text-emerald-700">Active schedule</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Pending Payments
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">4</p>
            <p className="mt-2 text-sm text-amber-700">Needs verification</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Monthly Revenue
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              RM 4.8k
            </p>
            <p className="mt-2 text-sm text-emerald-700">Estimated revenue</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Active Facilities
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">6</p>
            <p className="mt-2 text-sm text-slate-500">Listed venues</p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Recent Bookings
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Latest customer reservations for merchant facilities.
                </p>
              </div>

              <Link
                to="/merchant/payments"
                className="text-sm font-semibold text-emerald-900 hover:text-lime-600"
              >
                View payments →
              </Link>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-lg font-black text-emerald-950">
                        {booking.facilityName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Customer: {booking.customerName}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        booking.status === "Confirmed"
                          ? "bg-lime-100 text-emerald-950"
                          : booking.status === "Payment Uploaded"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-200 text-slate-600"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-slate-500">Date</p>
                      <p className="font-semibold text-slate-900">
                        {booking.date}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Time</p>
                      <p className="font-semibold text-slate-900">
                        {booking.time}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Amount</p>
                      <p className="font-semibold text-slate-900">
                        {booking.amount}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] bg-emerald-950 p-8 text-white shadow-sm">
              <h2 className="text-2xl font-black">Facility Health</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                This section gives merchants a quick summary of facility usage
                and booking activity.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Padel Courts</span>
                    <span>85% Used</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/15">
                    <div className="h-2 w-[85%] rounded-full bg-lime-400" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Badminton Courts</span>
                    <span>60% Used</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/15">
                    <div className="h-2 w-[60%] rounded-full bg-lime-400" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Football Fields</span>
                    <span>70% Used</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/15">
                    <div className="h-2 w-[70%] rounded-full bg-lime-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-2xl font-black text-emerald-950">
                Quick Actions
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  to="/merchant/payments"
                  className="rounded-2xl bg-lime-400 px-5 py-3 text-center text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
                >
                  Verify Payment Proofs
                </Link>

                <button className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-gray-50">
                  Manage Facilities
                </button>

                <button className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-gray-50">
                  View Booking Schedule
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default MerchantDashboardPage;
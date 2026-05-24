import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { formatDisplayTimeRange } from "../../utils/timeFormat";

const TEMP_MERCHANT_ID = 1;

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return `RM ${Number(amount || 0).toFixed(2)}`;
}

function getBookingTime(booking) {
  const slots = booking.bookingSlots || [];

  if (slots.length === 0) {
    return "No slots";
  }

  const sortedSlots = [...slots]
    .filter((slot) => slot.timeSlot)
    .sort(
      (a, b) =>
        new Date(a.timeSlot.startTime).getTime() -
        new Date(b.timeSlot.startTime).getTime()
    );

  if (sortedSlots.length === 0) {
    return "No slots";
  }

  const firstSlot = sortedSlots[0].timeSlot;
  const lastSlot = sortedSlots[sortedSlots.length - 1].timeSlot;

  return formatDisplayTimeRange(firstSlot.startTime, lastSlot.endTime);
}

function getStatusClass(status) {
  if (status === "CONFIRMED") {
    return "bg-lime-100 text-emerald-950";
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return "bg-red-100 text-red-700";
  }

  if (status === "PAYMENT_UPLOADED") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-gray-200 text-slate-600";
}

function MerchantDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMerchantBookings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `http://localhost:5000/bookings/merchant/${TEMP_MERCHANT_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch merchant bookings");
        }

        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Fetch merchant dashboard bookings error:", error);
        setErrorMessage(
          error.message ||
            "Unable to load merchant dashboard data. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantBookings();
  }, []);

  const dashboardStats = useMemo(() => {
    const pendingCount = bookings.filter(
      (booking) =>
        booking.status === "PENDING_PAYMENT" ||
        booking.status === "PAYMENT_UPLOADED"
    ).length;

    const confirmedBookings = bookings.filter(
      (booking) => booking.status === "CONFIRMED"
    );

    const rejectedCount = bookings.filter(
      (booking) => booking.status === "REJECTED"
    ).length;

    const estimatedRevenue = confirmedBookings.reduce(
      (total, booking) => total + Number(booking.totalPrice || 0),
      0
    );

    const facilityIds = new Set(
      bookings.map((booking) => booking.facilityId).filter(Boolean)
    );

    return {
      total: bookings.length,
      pending: pendingCount,
      confirmed: confirmedBookings.length,
      rejected: rejectedCount,
      estimatedRevenue,
      activeFacilities: facilityIds.size,
    };
  }, [bookings]);

  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings]);

  const facilityActivity = useMemo(() => {
    const activityMap = new Map();

    bookings.forEach((booking) => {
      const facilityName = booking.facility?.name || "Facility";
      const currentCount = activityMap.get(facilityName) || 0;
      activityMap.set(facilityName, currentCount + 1);
    });

    return [...activityMap.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [bookings]);

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

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Total Bookings
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {dashboardStats.total}
            </p>
            <p className="mt-2 text-sm text-slate-500">All reservations</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Pending Payments
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {dashboardStats.pending}
            </p>
            <p className="mt-2 text-sm text-amber-700">Needs action</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Confirmed
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {dashboardStats.confirmed}
            </p>
            <p className="mt-2 text-sm text-emerald-700">Approved bookings</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">Rejected</p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {dashboardStats.rejected}
            </p>
            <p className="mt-2 text-sm text-red-700">Declined payments</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Revenue
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-950">
              {formatCurrency(dashboardStats.estimatedRevenue)}
            </p>
            <p className="mt-2 text-sm text-emerald-700">Confirmed only</p>
          </div>
        </section>

        {isLoading ? (
          <div className="mb-8 rounded-2xl bg-white px-5 py-5 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-gray-200">
            Loading merchant dashboard data...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="mb-8 rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </div>
        ) : null}

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
                View payments
              </Link>
            </div>

            {!isLoading && !errorMessage && recentBookings.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                No bookings found for this merchant yet.
              </div>
            ) : null}

            {!isLoading && !errorMessage && recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => {
                  const customerName =
                    booking.customer?.user?.fullName || "Customer";
                  const facilityName = booking.facility?.name || "Facility";

                  return (
                    <article
                      key={booking.id}
                      className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <h3 className="text-lg font-black text-emerald-950">
                            {facilityName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Customer: {customerName}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Date</p>
                          <p className="font-semibold text-slate-900">
                            {formatDate(booking.bookingDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Time</p>
                          <p className="font-semibold text-slate-900">
                            {getBookingTime(booking)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] bg-emerald-950 p-8 text-white shadow-sm">
              <h2 className="text-2xl font-black">Facility Activity</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                Booking distribution across facilities for this merchant.
              </p>

              <div className="mt-8 space-y-5">
                {!isLoading && !errorMessage && facilityActivity.length === 0 ? (
                  <p className="text-sm font-medium text-emerald-50/80">
                    Facility activity will appear after bookings are created.
                  </p>
                ) : null}

                {facilityActivity.map((facility) => (
                  <div key={facility.name}>
                    <div className="flex justify-between gap-4 text-sm font-semibold">
                      <span>{facility.name}</span>
                      <span>{facility.count} bookings</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/15">
                      <div
                        className="h-2 rounded-full bg-lime-400"
                        style={{ width: `${facility.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
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

                <Link
                  to="/merchant/facilities"
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
                >
                  Manage Facilities
                </Link>

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

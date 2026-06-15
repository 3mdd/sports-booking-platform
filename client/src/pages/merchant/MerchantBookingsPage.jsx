import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getMerchantProfileId } from "../../utils/auth";
import { formatDisplayTimeRange } from "../../utils/timeFormat";
import { authFetch } from "../../utils/api";

const bookingStatuses = [
  "PENDING_PAYMENT",
  "PAYMENT_UPLOADED",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];

function formatDate(dateValue, includeTime = false) {
  if (!dateValue) return "Not available";

  return new Date(dateValue).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  });
}

function formatCurrency(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

function getBookingTime(booking) {
  const slots = (booking.bookingSlots || [])
    .filter((bookingSlot) => bookingSlot.timeSlot)
    .sort(
      (first, second) =>
        new Date(first.timeSlot.startTime).getTime() -
        new Date(second.timeSlot.startTime).getTime()
    );

  if (slots.length === 0) return "No slots";

  return formatDisplayTimeRange(
    slots[0].timeSlot.startTime,
    slots[slots.length - 1].timeSlot.endTime
  );
}

function getStatusClass(status) {
  if (status === "CONFIRMED") return "bg-lime-100 text-emerald-950";
  if (status === "PAYMENT_UPLOADED") return "bg-amber-100 text-amber-800";
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(status)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-200 text-slate-700";
}

function MerchantBookingsPage() {
  const merchantProfileId = getMerchantProfileId();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [facilityFilter, setFacilityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await authFetch(
          `http://localhost:5000/bookings/merchant/${merchantProfileId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load merchant bookings.");
        }

        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Fetch all merchant bookings error:", error);
        setErrorMessage(error.message || "Unable to load merchant bookings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [merchantProfileId]);

  const facilities = useMemo(() => {
    const facilityMap = new Map();

    bookings.forEach((booking) => {
      if (booking.facility?.id) {
        facilityMap.set(booking.facility.id, booking.facility.name);
      }
    });

    return [...facilityMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const customer = booking.customer?.user || {};
      const facilityName = booking.facility?.name || "";
      const matchesStatus =
        statusFilter === "ALL" || booking.status === statusFilter;
      const matchesFacility =
        facilityFilter === "ALL" ||
        String(booking.facilityId) === facilityFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          booking.id,
          customer.fullName,
          customer.username,
          customer.email,
          customer.phoneNumber,
          facilityName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      return matchesStatus && matchesFacility && matchesSearch;
    });
  }, [bookings, facilityFilter, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Merchant Portal
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950 md:text-4xl">
            All Bookings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review customer contacts, booking schedules, payment status, and
            reservation history across your facilities.
          </p>
        </section>

        <section className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Search
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Customer, phone, email, facility..."
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal outline-none focus:border-lime-400 focus:bg-white"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal outline-none focus:border-lime-400"
            >
              <option value="ALL">All statuses</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Facility
            <select
              value={facilityFilter}
              onChange={(event) => setFacilityFilter(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal outline-none focus:border-lime-400"
            >
              <option value="ALL">All facilities</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading ? (
          <div className="rounded-xl bg-white p-5 text-sm text-slate-500 ring-1 ring-gray-200">
            Loading bookings...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-xl bg-red-50 p-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage && filteredBookings.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-gray-200">
            No bookings match the selected filters.
          </div>
        ) : null}

        {!isLoading && !errorMessage && filteredBookings.length > 0 ? (
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left text-sm">
                <thead className="bg-emerald-950 text-white">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Customer Contact</th>
                    <th className="px-4 py-3">Facility</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment Proof</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => {
                    const customer = booking.customer?.user || {};

                    return (
                      <tr key={booking.id} className="align-top hover:bg-gray-50">
                        <td className="px-4 py-4 font-bold text-emerald-950">
                          #{booking.id}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {customer.fullName || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer.username
                              ? `@${customer.username}`
                              : "Username not set"}
                          </p>
                          <p className="mt-2 text-xs text-slate-600">
                            {customer.phoneNumber || "Phone not available"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {customer.email || "Email not available"}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {booking.facility?.name || "Facility"}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {formatDate(booking.bookingDate)}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {getBookingTime(booking)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {booking.paymentProof?.status || "Not uploaded"}
                        </td>
                        <td className="px-4 py-4 font-bold text-emerald-950">
                          {formatCurrency(booking.totalPrice)}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {formatDate(booking.createdAt, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-xs font-semibold text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default MerchantBookingsPage;

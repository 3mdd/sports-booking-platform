import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const TEMP_CUSTOMER_ID = 1;

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  return date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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

  return `${formatTime(firstSlot.startTime)} - ${formatTime(lastSlot.endTime)}`;
}

function getStatusClass(status) {
  if (status === "CONFIRMED") {
    return "bg-lime-100 text-emerald-950";
  }

  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") {
    return "bg-red-100 text-red-700";
  }

  if (status === "PAYMENT_UPLOADED") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-gray-100 text-slate-600";
}

function CustomerBookingHistoryPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCustomerBookings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `http://localhost:5000/bookings/customer/${TEMP_CUSTOMER_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch booking history");
        }

        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Fetch customer bookings error:", error);
        setErrorMessage(
          error.message ||
            "Unable to load booking history. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerBookings();
  }, []);

  const bookingStats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(
        (booking) =>
          booking.status === "PENDING_PAYMENT" ||
          booking.status === "PAYMENT_UPLOADED"
      ).length,
      confirmed: bookings.filter((booking) => booking.status === "CONFIRMED")
        .length,
    };
  }, [bookings]);

  const handleUploadPaymentProof = (booking) => {
    const bookingTime = getBookingTime(booking);
    const formattedDate = formatDate(booking.bookingDate);

    navigate("/payment-proof", {
      state: {
        bookingId: booking.id,
        facilityId: booking.facilityId,
        facilityName: booking.facility?.name || "Facility",
        formattedDate,
        durationLabel: bookingTime,
        totalPrice: Number(booking.totalPrice || 0),
        bookingStatus: booking.status,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Customer Portal
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
              Booking History
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              View your facility reservations, payment progress, and confirmed
              booking details in one place.
            </p>
          </div>

          <Link
            to="/facilities"
            className="rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Book Another Facility
          </Link>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Total Bookings
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {bookingStats.total}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Awaiting Payment Review
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {bookingStats.pending}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Confirmed Bookings
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {bookingStats.confirmed}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-emerald-950">
                Your Bookings
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Showing records from the customer booking API.
              </p>
            </div>

            <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
              Customer #{TEMP_CUSTOMER_ID}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading booking history...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && bookings.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No bookings found for this customer yet.
            </div>
          ) : null}

          {!isLoading && !errorMessage && bookings.length > 0 ? (
            <div className="space-y-5">
              {bookings.map((booking) => {
                const facilityName = booking.facility?.name || "Facility";
                const sportName = booking.facility?.sportType?.name || "Sport";
                const bookingDate = formatDate(booking.bookingDate);
                const bookingTime = getBookingTime(booking);
                const amount = `RM ${Number(booking.totalPrice || 0).toFixed(
                  2
                )}`;
                const bookingStatus = booking.status || "UNKNOWN";
                const paymentProofStatus =
                  booking.paymentProof?.status || "Not uploaded";

                return (
                  <article
                    key={booking.id}
                    className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black text-emerald-950">
                            Booking #{booking.id}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              bookingStatus
                            )}`}
                          >
                            {bookingStatus}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {facilityName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {sportName}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm text-slate-500">Total Amount</p>
                        <p className="mt-1 text-xl font-black text-emerald-950">
                          {amount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-slate-500">Booking Date</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {bookingDate}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Booking Time</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {bookingTime}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Payment Proof</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {paymentProofStatus}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Location</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {booking.facility?.location || "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5 md:flex-row md:items-center md:justify-between">
                      {bookingStatus === "PENDING_PAYMENT" ? (
                        <>
                          <p className="text-sm font-medium text-amber-700">
                            Payment proof is still required before the
                            30-minute payment window expires.
                          </p>

                          <button
                            type="button"
                            onClick={() => handleUploadPaymentProof(booking)}
                            className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                          >
                            Upload Payment Proof
                          </button>
                        </>
                      ) : null}

                      {bookingStatus === "PAYMENT_UPLOADED" ? (
                        <p className="text-sm font-semibold text-amber-700">
                          Waiting for merchant verification.
                        </p>
                      ) : null}

                      {bookingStatus === "EXPIRED" ? (
                        <p className="text-sm font-semibold text-red-700">
                          Expired. The payment window has ended and the slots
                          have been released.
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CustomerBookingHistoryPage;

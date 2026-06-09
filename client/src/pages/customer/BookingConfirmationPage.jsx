import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { formatDisplaySlotLabel } from "../../utils/timeFormat";
import { getCustomerProfileId } from "../../utils/auth";

function BookingConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state;
  const customerProfileId = getCustomerProfileId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleCreateBooking = async () => {
    if (!booking?.facilityId || !booking?.selectedSlotIds?.length) {
      setSubmitMessage(
        "Booking data is missing. Please go back and select available slots again."
      );
      return;
    }

    if (!customerProfileId) {
      setSubmitMessage("Customer profile not found. Please log in again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitMessage("");

      const response = await fetch("http://localhost:5000/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerProfileId,
          facilityId: booking.facilityId,
          timeSlotIds: booking.selectedSlotIds,
          notes: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking");
      }

      navigate("/payment-proof", {
        state: {
          ...booking,
          bookingId: data.booking.id,
          bookingStatus: data.booking.status,
          createdAt: data.booking.createdAt,
          totalPrice: Number(data.totalPrice),
        },
      });
    } catch (error) {
      console.error("Create booking error:", error);
      setSubmitMessage(error.message || "Unable to create booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 py-16 text-center lg:px-8">
          <div className="rounded-[2rem] bg-white p-10 shadow-sm ring-1 ring-gray-200">
            <h1 className="text-3xl font-black text-emerald-950">
              No booking details found
            </h1>
            <p className="mt-3 text-slate-600">
              Please select a facility, date, duration, and time slot before
              continuing.
            </p>

            <Link
              to="/facilities"
              className="mt-8 inline-flex rounded-2xl bg-emerald-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Back to Facilities
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-7 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Confirm Booking
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
            Review your booking details
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Please check your selected facility, date, duration, time slots, and
            total price before proceeding to payment proof submission.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Booking Details
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-slate-500">Facility</span>
                <span className="font-semibold text-slate-900">
                  {booking.facilityName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-slate-500">Sport</span>
                <span className="font-semibold text-slate-900">
                  {booking.sport}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-900">
                  {booking.location}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-slate-500">Booking Date</span>
                <span className="font-semibold text-slate-900">
                  {booking.formattedDate}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900">
                  {booking.durationLabel}
                </span>
              </div>

              {booking.bookingTimeLabel ? (
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <span className="text-slate-500">Booking Time</span>
                  <span className="text-right font-semibold text-slate-900">
                    {booking.bookingTimeLabel}
                  </span>
                </div>
              ) : null}

              <div className="border-b border-gray-100 pb-4">
                <p className="text-slate-500">Selected Time Slots</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {booking.selectedSlots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-full bg-lime-100 px-4 py-2 text-xs font-semibold text-emerald-950"
                    >
                      {formatDisplaySlotLabel(slot)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-emerald-950">
                  Total Price
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  RM {Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:self-start">
            <h2 className="text-2xl font-black text-emerald-950">
              Next Step
            </h2>

            <div className="mt-5 rounded-lg bg-lime-50 p-4 ring-1 ring-lime-100">
              <p className="text-sm font-semibold text-emerald-950">
                Your booking will be created before payment proof upload.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                After confirmation, the system will save this booking in the
                database with pending payment status. Then you can upload the
                payment proof for merchant verification.
              </p>
            </div>

            {submitMessage ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {submitMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCreateBooking}
              disabled={isSubmitting}
              className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isSubmitting
                ? "Creating Booking..."
                : "Confirm & Continue to Payment"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
            >
              Back to Slot Selection
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default BookingConfirmationPage;

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function getRemainingPaymentTime(createdAt, currentTime) {
  if (!createdAt) return null;

  const createdAtTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdAtTime)) return null;

  return Math.max(createdAtTime + PAYMENT_WINDOW_MS - currentTime, 0);
}

function formatRemainingTime(milliseconds) {
  if (milliseconds === null) return "Unavailable";

  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function PaymentProofUploadPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state;

  const [selectedFile, setSelectedFile] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const bookingStatus = isSuccess
    ? "PAYMENT_UPLOADED"
    : booking?.bookingStatus || "PENDING_PAYMENT";

  useEffect(() => {
    if (bookingStatus !== "PENDING_PAYMENT" || !booking?.createdAt) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [booking?.createdAt, bookingStatus]);

  const remainingPaymentTime = useMemo(
    () => getRemainingPaymentTime(booking?.createdAt, currentTime),
    [booking?.createdAt, currentTime]
  );

  const isPaymentWindowExpired =
    bookingStatus === "PENDING_PAYMENT" && remainingPaymentTime === 0;

  const handleSubmitPaymentProof = async () => {
    if (!booking?.bookingId) {
      setIsSuccess(false);
      setSubmitMessage(
        "Booking ID is missing. Please create the booking again before uploading payment proof."
      );
      return;
    }

    if (isPaymentWindowExpired) {
      setIsSuccess(false);
      setSubmitMessage("Payment window expired. Please make a new booking.");
      return;
    }

    if (!selectedFile) {
      setIsSuccess(false);
      setSubmitMessage("Please choose a payment proof file before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsSuccess(false);
      setSubmitMessage("");

      const formData = new FormData();
      formData.append("bookingId", booking.bookingId);
      formData.append("paymentProof", selectedFile);

      const response = await fetch(
        "http://localhost:5000/bookings/payment-proof",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload payment proof");
      }

      setIsSuccess(true);
      setSubmitMessage(
        "Payment proof uploaded successfully. Waiting for merchant verification."
      );
    } catch (error) {
      console.error("Payment proof upload error:", error);
      setIsSuccess(false);
      setSubmitMessage(error.message || "Unable to upload payment proof.");
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
              No payment details found
            </h1>
            <p className="mt-3 text-slate-600">
              Please confirm a booking before uploading payment proof.
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

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Payment Proof
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
            Upload your payment receipt
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Complete your external payment using the payment details, then
            upload the receipt for merchant verification.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Payment Details
            </h2>

            <div className="mt-6 flex h-52 items-center justify-center rounded-3xl bg-gray-100 ring-1 ring-gray-200">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-center text-xs font-bold text-slate-500 shadow-sm">
                PAYMENT DETAILS
                <br />
                PLACEHOLDER
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Account Name</span>
                <span className="font-semibold text-slate-900">
                  EliteSport Merchant
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Reference</span>
                <span className="font-semibold text-slate-900">
                  BOOKING-{booking.bookingId || booking.facilityId}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Booking Status</span>
                <span className="font-semibold text-slate-900">
                  {bookingStatus}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-emerald-950">
                  Amount to Pay
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  RM {Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-lime-50 p-4 text-sm text-emerald-950 ring-1 ring-lime-100">
              Payment proof should be uploaded within 30 minutes after booking
              creation.
            </div>

            {bookingStatus === "PENDING_PAYMENT" ? (
              <div
                className={`mt-4 rounded-2xl p-4 text-sm ring-1 ${
                  isPaymentWindowExpired
                    ? "bg-red-50 text-red-700 ring-red-100"
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                }`}
              >
                {remainingPaymentTime === null ? (
                  <p className="font-semibold">
                    Payment countdown is unavailable for this booking.
                  </p>
                ) : isPaymentWindowExpired ? (
                  <p className="font-semibold">
                    Payment window expired. Please make a new booking.
                  </p>
                ) : (
                  <p className="font-semibold">
                    Time remaining: {formatRemainingTime(remainingPaymentTime)}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Upload Receipt
            </h2>

            <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 text-xl font-black text-emerald-950">
                ↑
              </div>

              <p className="mt-5 text-lg font-bold text-emerald-950">
                Choose payment proof file
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Supported format: JPG, PNG, or PDF
              </p>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(event) => {
                  setSelectedFile(event.target.files[0]);
                  setSubmitMessage("");
                  setIsSuccess(false);
                }}
                className="mt-6 w-full cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-700"
              />

              {selectedFile ? (
                <p className="mt-4 text-sm font-semibold text-emerald-950">
                  Selected file: {selectedFile.name}
                </p>
              ) : null}
            </div>

            <div className="mt-8 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-200">
              <h3 className="font-bold text-emerald-950">Booking Summary</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility</span>
                  <span className="font-semibold text-slate-900">
                    {booking.facilityName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold text-slate-900">
                    {booking.formattedDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">
                    {booking.durationLabel}
                  </span>
                </div>
              </div>
            </div>

            {submitMessage ? (
              <div
                className={`mt-6 rounded-2xl px-4 py-3 text-sm font-medium ${
                  isSuccess
                    ? "border border-lime-200 bg-lime-50 text-emerald-800"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmitPaymentProof}
              disabled={isSubmitting || isSuccess || isPaymentWindowExpired}
              className={`mt-8 w-full rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition ${
                isSubmitting || isSuccess || isPaymentWindowExpired
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isSubmitting
                ? "Uploading Payment Proof..."
                : isSuccess
                ? "Payment Proof Submitted"
                : "Submit Payment Proof"}
            </button>

            <p className="mt-4 rounded-2xl bg-lime-50 px-4 py-3 text-sm leading-6 text-emerald-950 ring-1 ring-lime-100">
              You can upload your payment proof later from My Bookings before
              the 30-minute payment window expires.
            </p>

            <button
              type="button"
              onClick={() => navigate("/customer/bookings")}
              disabled={isSubmitting}
              className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
            >
              Pay Later / View My Bookings
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PaymentProofUploadPage;

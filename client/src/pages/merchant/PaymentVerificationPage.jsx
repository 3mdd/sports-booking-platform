import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { formatDisplayTimeRange } from "../../utils/timeFormat";
import { getMerchantProfileId } from "../../utils/auth";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return "Not available";

  return new Date(dateValue).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getBookingStartDateTime(booking) {
  const startTimes = (booking.bookingSlots || [])
    .map((bookingSlot) => bookingSlot.timeSlot?.startTime)
    .filter(Boolean)
    .map((startTime) => new Date(startTime).getTime())
    .filter((startTime) => !Number.isNaN(startTime))
    .sort((first, second) => first - second);

  return startTimes[0] || null;
}

function getVerificationState(booking, currentTime) {
  if (booking.status !== "PAYMENT_UPLOADED") {
    return { dueSoon: false, overdue: false };
  }

  const bookingStartTime = getBookingStartDateTime(booking);
  const responseDeadline = booking.verificationDeadlineAt
    ? new Date(booking.verificationDeadlineAt).getTime()
    : null;
  const deadlineTime =
    responseDeadline ||
    (bookingStartTime ? bookingStartTime - 30 * 60 * 1000 : null);
  const overdue = deadlineTime ? currentTime >= deadlineTime : false;
  const dueSoon =
    !overdue &&
    (booking.verificationDueSoon ||
      (bookingStartTime
        ? bookingStartTime - currentTime <= 2 * 60 * 60 * 1000
        : false));

  return { dueSoon, overdue };
}

function getBookingTime(booking) {
  const slots = booking.bookingSlots || [];

  if (slots.length === 0) {
    return "No slots";
  }

  const sortedSlots = [...slots].sort(
    (a, b) =>
      new Date(a.timeSlot.startTime).getTime() -
      new Date(b.timeSlot.startTime).getTime()
  );

  const firstSlot = sortedSlots[0].timeSlot;
  const lastSlot = sortedSlots[sortedSlots.length - 1].timeSlot;

  return formatDisplayTimeRange(firstSlot.startTime, lastSlot.endTime);
}

function PaymentVerificationPage() {
  const merchantProfileId = getMerchantProfileId();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const fetchMerchantBookings = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `http://localhost:5000/bookings/merchant/${merchantProfileId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch merchant bookings");
        }

        setBookings(data.bookings || []);
      } catch (error) {
        console.error("Fetch merchant bookings error:", error);
        setErrorMessage(
          error.message ||
            "Unable to load merchant bookings. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantBookings();
  }, [merchantProfileId]);

  useEffect(() => {
    const hasPendingVerification = bookings.some(
      (booking) => booking.status === "PAYMENT_UPLOADED"
    );

    if (!hasPendingVerification) return undefined;

    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [bookings]);

  const paymentProofBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.paymentProof)
      .sort((first, second) => {
        const firstState = getVerificationState(first, currentTime);
        const secondState = getVerificationState(second, currentTime);
        const getPriority = (booking, state) => {
          if (state.overdue) return 0;
          if (state.dueSoon) return 1;
          if (booking.status === "PAYMENT_UPLOADED") return 2;
          return 3;
        };

        const priorityDifference =
          getPriority(first, firstState) - getPriority(second, secondState);

        if (priorityDifference !== 0) return priorityDifference;

        return (
          new Date(second.paymentProof?.uploadedAt || 0).getTime() -
          new Date(first.paymentProof?.uploadedAt || 0).getTime()
        );
      });
  }, [bookings, currentTime]);

  const pendingCount = paymentProofBookings.filter(
    (booking) => booking.status === "PAYMENT_UPLOADED"
  ).length;

  const approvedCount = paymentProofBookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const rejectedCount = paymentProofBookings.filter(
    (booking) => booking.status === "REJECTED"
  ).length;
  const overdueCount = paymentProofBookings.filter(
    (booking) => getVerificationState(booking, currentTime).overdue
  ).length;

const handlePaymentAction = async (bookingId, actionType) => {
  try {
    setProcessingBookingId(bookingId);
    setActionMessage("");

    const endpoint =
      actionType === "approve"
        ? `http://localhost:5000/bookings/${bookingId}/approve-payment`
        : `http://localhost:5000/bookings/${bookingId}/reject-payment`;

    const response = await fetch(endpoint, {
      method: "PATCH",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update payment status");
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: data.booking.status }
          : booking
      )
    );

    setActionMessage(data.message);
  } catch (error) {
    console.error("Payment action error:", error);
    setActionMessage(error.message || "Unable to update payment status.");
  } finally {
    setProcessingBookingId(null);
  }
};

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Merchant Portal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
            Payment Verification
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Review customer payment proof submissions and update booking payment
            status after checking the uploaded receipt.
          </p>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Pending Review
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-950">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Approved Proofs
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-950">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Rejected Proofs
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-950">
              {rejectedCount}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-4 shadow-sm ring-1 ring-red-200">
            <p className="text-sm font-semibold text-red-700">
              Verification Overdue
            </p>
            <p className="mt-2 text-3xl font-black text-red-800">
              {overdueCount}
            </p>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
          <div className="mb-5">
            <div>
              <h2 className="text-2xl font-black text-emerald-950">
                Uploaded Payment Proofs
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Review uploaded receipts and approve or reject pending payments.
              </p>
            </div>
          </div>

          {actionMessage ? (
            <div className="mb-6 rounded-2xl bg-lime-50 px-5 py-4 text-sm font-semibold text-emerald-800 ring-1 ring-lime-100">
                {actionMessage}
            </div>
            ) : null}

          {isLoading ? (
            <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading uploaded payment proofs...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && paymentProofBookings.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No uploaded payment proofs found for this merchant yet.
            </div>
          ) : null}

          {!isLoading && !errorMessage && paymentProofBookings.length > 0 ? (
            <div className="space-y-4">
              {paymentProofBookings.map((booking) => {
                const customerName =
                  booking.customer?.user?.fullName || "Customer";
                const customerUsername =
                  booking.customer?.user?.username || "";
                const customerPhone =
                  booking.customer?.user?.phoneNumber || "";
                const customerEmail = booking.customer?.user?.email || "";
                const facilityName = booking.facility?.name || "Facility";
                const bookingDate = formatDate(booking.bookingDate);
                const bookingTime = getBookingTime(booking);
                const amount = `RM ${Number(booking.totalPrice).toFixed(2)}`;
                const uploadedAt = formatDate(booking.paymentProof?.uploadedAt);
                const fileName =
                  booking.paymentProof?.originalFileName || "Uploaded file";
                const filePath = booking.paymentProof?.filePath || "";
const normalizedFilePath = filePath.replace(/\\/g, "/");

const uploadsIndex = normalizedFilePath.indexOf("uploads/");
const publicFilePath =
  uploadsIndex !== -1 ? normalizedFilePath.substring(uploadsIndex) : "";

const fileUrl = publicFilePath
  ? `http://localhost:5000/${publicFilePath}`
  : "";

                const isImageFile = /\.(jpg|jpeg|png)$/i.test(fileName);
                const verificationState = getVerificationState(
                  booking,
                  currentTime
                );

                return (
                  <article
                    key={booking.id}
                    className={`grid gap-4 rounded-xl border p-4 lg:grid-cols-[1fr_190px] ${
                      verificationState.overdue
                        ? "border-red-300 bg-red-50"
                        : verificationState.dueSoon
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-emerald-950">
                          Booking #{booking.id}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            booking.status === "CONFIRMED"
                              ? "bg-lime-100 text-emerald-950"
                              : booking.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {booking.status}
                        </span>

                        {verificationState.overdue ? (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                            Verification overdue
                          </span>
                        ) : verificationState.dueSoon ? (
                          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                            Starts soon
                          </span>
                        ) : null}
                      </div>

                      {booking.status === "PAYMENT_UPLOADED" &&
                      booking.verificationDeadlineAt ? (
                        <p
                          className={`mt-3 text-sm font-semibold ${
                            verificationState.overdue
                              ? "text-red-700"
                              : verificationState.dueSoon
                              ? "text-amber-700"
                              : "text-slate-600"
                          }`}
                        >
                          Verification deadline:{" "}
                          {formatDateTime(booking.verificationDeadlineAt)}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-slate-500">Customer</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {customerName}
                            {customerUsername ? ` (@${customerUsername})` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {[customerPhone, customerEmail]
                              .filter(Boolean)
                              .join(" | ") || "Contact details unavailable"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Facility</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {facilityName}
                          </p>
                        </div>

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
                          <p className="text-slate-500">Amount</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {amount}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Uploaded At</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {uploadedAt}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg bg-white p-4 text-sm ring-1 ring-gray-200">
  <p className="font-semibold text-emerald-950">
    Payment Proof File
  </p>

  <p className="mt-2 text-slate-600">{fileName}</p>

  {fileUrl && isImageFile ? (
    <img
      src={fileUrl}
      alt="Payment proof"
      className="mt-4 max-h-72 w-full rounded-2xl object-contain ring-1 ring-gray-200"
    />
  ) : null}

  {fileUrl ? (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex rounded-xl bg-lime-100 px-4 py-2 text-xs font-bold text-emerald-950 transition hover:bg-lime-200"
    >
      Open Payment Proof
    </a>
  ) : null}
</div>
                    </div>

                    <div className="flex flex-col justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePaymentAction(booking.id, "approve")}
                        disabled={booking.status !== "PAYMENT_UPLOADED" || processingBookingId === booking.id}
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                            booking.status !== "PAYMENT_UPLOADED" || processingBookingId === booking.id
                            ? "cursor-not-allowed bg-slate-400"
                            : "bg-emerald-950 hover:bg-emerald-900"
                        }`}
                        >
                        {processingBookingId === booking.id ? "Processing..." : "Approve Payment"}
                        </button>

                        <button
                        type="button"
                        onClick={() => handlePaymentAction(booking.id, "reject")}
                        disabled={booking.status !== "PAYMENT_UPLOADED" || processingBookingId === booking.id}
                        className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                            booking.status !== "PAYMENT_UPLOADED" || processingBookingId === booking.id
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400"
                            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                        >
                        {processingBookingId === booking.id ? "Processing..." : "Reject Payment"}
                        </button>

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

export default PaymentVerificationPage;

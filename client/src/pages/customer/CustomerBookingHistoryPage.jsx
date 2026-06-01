import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { formatDisplayTimeRange } from "../../utils/timeFormat";

const TEMP_CUSTOMER_ID = 1;
const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

  return formatDisplayTimeRange(firstSlot.startTime, lastSlot.endTime);
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

const initialReviewFormData = {
  rating: "5",
  comment: "",
};

function CustomerBookingHistoryPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [reviewFormBookingId, setReviewFormBookingId] = useState(null);
  const [reviewFormData, setReviewFormData] = useState(initialReviewFormData);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({
    bookingId: null,
    message: "",
    isSuccess: false,
  });

  useEffect(() => {
    const hasPendingBooking = bookings.some(
      (booking) => booking.status === "PENDING_PAYMENT" && booking.createdAt
    );

    if (!hasPendingBooking) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [bookings]);

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
        createdAt: booking.createdAt,
      },
    });
  };

  const handleStartReview = (booking) => {
    setReviewFormBookingId(booking.id);
    setReviewFormData(initialReviewFormData);
    setReviewMessage({
      bookingId: null,
      message: "",
      isSuccess: false,
    });
  };

  const handleCancelReview = () => {
    setReviewFormBookingId(null);
    setReviewFormData(initialReviewFormData);
  };

  const handleReviewInputChange = (event) => {
    const { name, value } = event.target;

    setReviewFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmitReview = async (event, booking) => {
    event.preventDefault();

    const parsedRating = Number(reviewFormData.rating);
    const trimmedComment = reviewFormData.comment.trim();

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      setReviewMessage({
        bookingId: booking.id,
        message: "Please choose a rating from 1 to 5.",
        isSuccess: false,
      });
      return;
    }

    if (trimmedComment.length > 1000) {
      setReviewMessage({
        bookingId: booking.id,
        message: "Comment must be 1000 characters or fewer.",
        isSuccess: false,
      });
      return;
    }

    try {
      setIsReviewSubmitting(true);
      setReviewMessage({
        bookingId: booking.id,
        message: "",
        isSuccess: false,
      });

      const response = await fetch("http://localhost:5000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: TEMP_CUSTOMER_ID,
          facilityId: booking.facilityId,
          bookingId: booking.id,
          rating: parsedRating,
          comment: trimmedComment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === booking.id
            ? { ...currentBooking, review: data.review }
            : currentBooking
        )
      );
      setReviewFormBookingId(null);
      setReviewFormData(initialReviewFormData);
      setReviewMessage({
        bookingId: booking.id,
        message: "Review submitted successfully.",
        isSuccess: true,
      });
    } catch (error) {
      console.error("Submit review error:", error);
      setReviewMessage({
        bookingId: booking.id,
        message: error.message || "Unable to submit review.",
        isSuccess: false,
      });
    } finally {
      setIsReviewSubmitting(false);
    }
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
                const remainingPaymentTime = getRemainingPaymentTime(
                  booking.createdAt,
                  currentTime
                );
                const isPendingPaymentExpired =
                  bookingStatus === "PENDING_PAYMENT" &&
                  remainingPaymentTime === 0;
                const hasReview = Boolean(booking.review);
                const isReviewFormOpen = reviewFormBookingId === booking.id;
                const isReviewMessageVisible =
                  reviewMessage.bookingId === booking.id &&
                  reviewMessage.message;

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
                        isPendingPaymentExpired ? (
                          <p className="text-sm font-semibold text-red-700">
                            Payment window expired. Please make a new booking.
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-amber-700">
                              {remainingPaymentTime === null
                                ? "Payment proof is still required before the payment window expires."
                                : `Payment time remaining: ${formatRemainingTime(
                                    remainingPaymentTime
                                  )}`}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleUploadPaymentProof(booking)}
                              disabled={remainingPaymentTime === 0}
                              className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                              Upload Payment Proof
                            </button>
                          </>
                        )
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

                    {bookingStatus === "CONFIRMED" ? (
                      <div className="mt-5 border-t border-gray-200 pt-5">
                        {hasReview ? (
                          <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-gray-200">
                            <p className="font-semibold text-emerald-950">
                              Your Review
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              Rating: {booking.review.rating}/5
                            </p>
                            {booking.review.comment ? (
                              <p className="mt-2 leading-6 text-slate-600">
                                {booking.review.comment}
                              </p>
                            ) : (
                              <p className="mt-2 text-slate-500">
                                No comment added.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {!isReviewFormOpen ? (
                              <button
                                type="button"
                                onClick={() => handleStartReview(booking)}
                                className="rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
                              >
                                Leave Review
                              </button>
                            ) : null}

                            {isReviewFormOpen ? (
                              <form
                                onSubmit={(event) =>
                                  handleSubmitReview(event, booking)
                                }
                                className="rounded-2xl bg-white p-4 ring-1 ring-gray-200"
                              >
                                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                                  <div>
                                    <p className="font-semibold text-emerald-950">
                                      Leave a Review
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                      Share your experience after this confirmed
                                      booking.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleCancelReview}
                                    className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                      Rating
                                    </label>
                                    <select
                                      name="rating"
                                      value={reviewFormData.rating}
                                      onChange={handleReviewInputChange}
                                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                                    >
                                      {[5, 4, 3, 2, 1].map((rating) => (
                                        <option key={rating} value={rating}>
                                          {rating}/5
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                      Comment
                                    </label>
                                    <textarea
                                      name="comment"
                                      rows="3"
                                      value={reviewFormData.comment}
                                      onChange={handleReviewInputChange}
                                      maxLength="1000"
                                      className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                                      placeholder="Optional feedback for this facility"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                      {reviewFormData.comment.length}/1000
                                      characters
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={isReviewSubmitting}
                                  className={`mt-4 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                                    isReviewSubmitting
                                      ? "cursor-not-allowed bg-slate-400"
                                      : "bg-emerald-950 hover:bg-emerald-900"
                                  }`}
                                >
                                  {isReviewSubmitting
                                    ? "Submitting..."
                                    : "Submit Review"}
                                </button>
                              </form>
                            ) : null}
                          </div>
                        )}

                        {isReviewMessageVisible ? (
                          <div
                            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                              reviewMessage.isSuccess
                                ? "border border-lime-200 bg-lime-50 text-emerald-800"
                                : "border border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
                            {reviewMessage.message}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
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

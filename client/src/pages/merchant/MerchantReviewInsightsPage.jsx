import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getMerchantProfileId } from "../../utils/auth";
const ratingOptions = [5, 4, 3, 2, 1];
const sentimentOptions = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
const sentimentLabels = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
};

function formatDate(dateValue) {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRatingDisplay({ rating, sizeClass = "text-lg" }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <span
          key={starValue}
          className={
            starValue <= roundedRating ? "text-lime-500" : "text-gray-300"
          }
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function getSentimentBadgeClass(sentimentLabel) {
  if (sentimentLabel === "POSITIVE") {
    return "bg-lime-100 text-emerald-800 ring-lime-200";
  }

  if (sentimentLabel === "NEGATIVE") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getSatisfactionBadgeClass(satisfactionLevel) {
  if (satisfactionLevel === "Excellent Satisfaction") {
    return "bg-lime-100 text-emerald-800 ring-lime-200";
  }

  if (satisfactionLevel === "Good Satisfaction") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (satisfactionLevel === "Needs Attention") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (satisfactionLevel === "Good Rating, Needs Attention") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function InsightList({ items, emptyText, tone = "neutral" }) {
  const bulletClass =
    tone === "positive"
      ? "bg-lime-400"
      : tone === "negative"
      ? "bg-red-400"
      : "bg-amber-400";

  if (!items?.length) {
    return <p className="text-sm leading-6 text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <span
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${bulletClass}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MerchantReviewInsightsPage() {
  const merchantProfileId = getMerchantProfileId();
  const [reviews, setReviews] = useState([]);
  const [insightSummary, setInsightSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRating, setSelectedRating] = useState("All Ratings");
  const [selectedFacility, setSelectedFacility] = useState("All Facilities");

  useEffect(() => {
    const fetchMerchantReviews = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `http://localhost:5000/reviews/merchant/${merchantProfileId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch merchant reviews");
        }

        setReviews(data.reviews || []);
        setInsightSummary(data.insightSummary || null);
      } catch (error) {
        console.error("Fetch merchant reviews error:", error);
        setInsightSummary(null);
        setErrorMessage(
          error.message ||
            "Unable to load merchant reviews. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantReviews();
  }, [merchantProfileId]);

  const facilityOptions = useMemo(() => {
    const facilityNames = reviews
      .map((review) => review.facility?.name)
      .filter(Boolean);

    return ["All Facilities", ...new Set(facilityNames)];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesRating =
        selectedRating === "All Ratings" ||
        Number(review.rating) === Number(selectedRating);
      const matchesFacility =
        selectedFacility === "All Facilities" ||
        review.facility?.name === selectedFacility;

      return matchesRating && matchesFacility;
    });
  }, [reviews, selectedFacility, selectedRating]);

  const reviewStats = useMemo(() => {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce(
      (total, review) => total + Number(review.rating || 0),
      0
    );
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    const ratingCounts = ratingOptions.reduce((counts, rating) => {
      counts[rating] = reviews.filter(
        (review) => Number(review.rating) === rating
      ).length;

      return counts;
    }, {});
    const sentimentCounts = sentimentOptions.reduce((counts, sentimentLabel) => {
      counts[sentimentLabel] = reviews.filter(
        (review) => review.sentimentLabel === sentimentLabel
      ).length;

      return counts;
    }, {});

    return {
      totalReviews,
      averageRating,
      ratingCounts,
      sentimentCounts,
    };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Review Insights
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Track customer ratings and sentiment across your facilities.
            </p>
          </div>

          <Link
            to="/merchant/dashboard"
            className="rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Back to Dashboard
          </Link>
        </section>

        {isLoading ? (
          <div className="rounded-2xl bg-white px-5 py-5 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-gray-200">
            Loading review insights...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
            <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    AI-Assisted Analytics
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-emerald-950">
                    AI Review Insight Summary
                  </h2>
                </div>

                {insightSummary?.totalReviews > 0 ? (
                  <span
                    className={`w-fit rounded-full px-4 py-2 text-sm font-bold ring-1 ${getSatisfactionBadgeClass(
                      insightSummary.satisfactionLevel
                    )}`}
                  >
                    {insightSummary.satisfactionLevel}
                  </span>
                ) : null}
              </div>

              {!insightSummary || insightSummary.totalReviews === 0 ? (
                <div className="mt-5 rounded-lg bg-gray-50 px-4 py-4 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                  Not enough review data yet. Insights will appear after
                  customers submit reviews.
                </div>
              ) : (
                <>
                  <p className="mt-4 max-w-5xl text-sm leading-6 text-slate-600">
                    {insightSummary.overallSummary}
                  </p>

                  <div className="mt-5 grid gap-5 border-y border-gray-100 py-5 lg:grid-cols-3">
                    <div>
                      <h3 className="mb-3 text-sm font-black text-emerald-950">
                        Positive Points
                      </h3>
                      <InsightList
                        items={insightSummary.positivePoints}
                        emptyText="No repeated positive topic has been identified yet."
                        tone="positive"
                      />
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-black text-emerald-950">
                        Common Complaints
                      </h3>
                      <InsightList
                        items={insightSummary.commonComplaints}
                        emptyText="No common complaint has been identified."
                        tone="negative"
                      />
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-black text-emerald-950">
                        Suggested Improvements
                      </h3>
                      <InsightList
                        items={insightSummary.suggestedImprovements}
                        emptyText="Continue monitoring customer feedback."
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-emerald-950 px-4 py-4 text-sm text-white">
                    <p className="font-bold text-lime-300">
                      Merchant Recommendation
                    </p>
                    <p className="mt-2 leading-6 text-emerald-50">
                      {insightSummary.merchantRecommendation}
                    </p>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Generated from existing ratings, sentiment labels, and
                    recurring keywords in customer comments.
                  </p>
                </>
              )}
            </section>

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-slate-500">
                  Total Reviews
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-950">
                  {reviewStats.totalReviews}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Customer submissions
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-slate-500">
                  Average Rating
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-3xl font-black text-emerald-950">
                    {reviewStats.averageRating.toFixed(1)}
                  </p>
                  <StarRatingDisplay
                    rating={reviewStats.averageRating}
                    sizeClass="text-base"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">Out of 5 stars</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 xl:col-span-2">
                <p className="text-sm font-semibold text-slate-500">
                  Rating Distribution
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  {ratingOptions.map((rating) => (
                    <div
                      key={rating}
                      className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200"
                    >
                      <p className="text-xs font-bold text-slate-500">
                        {rating} Star
                      </p>
                      <p className="mt-2 text-2xl font-black text-emerald-950">
                        {reviewStats.ratingCounts[rating] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-black text-emerald-950">
                    Sentiment Snapshot
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    API sentiment analysis with an automatic rule-based fallback.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {sentimentOptions.map((sentimentLabel) => (
                  <div
                    key={sentimentLabel}
                    className="rounded-lg bg-gray-50 px-4 py-3 ring-1 ring-gray-200"
                  >
                    <p className="text-sm font-bold text-slate-500">
                      {sentimentLabels[sentimentLabel]}
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-950">
                      {reviewStats.sentimentCounts[sentimentLabel] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-black text-emerald-950">
                    Filters
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Narrow feedback by rating or facility.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                  {filteredReviews.length} shown
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select
                  value={selectedRating}
                  onChange={(event) => setSelectedRating(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
                >
                  <option>All Ratings</option>
                  {ratingOptions.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star
                    </option>
                  ))}
                </select>

                <select
                  value={selectedFacility}
                  onChange={(event) => setSelectedFacility(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
                >
                  {facilityOptions.map((facilityName) => (
                    <option key={facilityName}>{facilityName}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-emerald-950">
                  Recent Reviews
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Most recent customer feedback for merchant facilities.
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                  No customer reviews yet.
                </div>
              ) : null}

              {reviews.length > 0 && filteredReviews.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                  No reviews match the selected filters.
                </div>
              ) : null}

              {filteredReviews.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredReviews.map((review) => {
                    const reviewerName =
                      review.customer?.user?.fullName || "Customer";
                    const facilityName = review.facility?.name || "Facility";
                    const sportName = review.facility?.sportType?.name || "Sport";

                    return (
                      <article
                        key={review.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              {facilityName}
                            </p>
                            <h3 className="mt-2 text-lg font-black text-emerald-950">
                              {reviewerName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {sportName} - {formatDate(review.createdAt)}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <StarRatingDisplay rating={review.rating} />
                            <p className="mt-1 text-xs font-bold text-emerald-950">
                              {review.rating}/5
                            </p>
                            {review.sentimentLabel ? (
                              <span
                                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getSentimentBadgeClass(
                                  review.sentimentLabel
                                )}`}
                              >
                                {sentimentLabels[review.sentimentLabel] ||
                                  review.sentimentLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white px-4 py-4 ring-1 ring-gray-100">
                          <p className="text-sm leading-6 text-slate-600">
                            {review.comment || "No comment added."}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default MerchantReviewInsightsPage;

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAuthUser, getMerchantProfileId } from "../../utils/auth";
import { authFetch } from "../../utils/api";

const API_BASE_URL = "http://localhost:5000";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatRating(value) {
  return value === null || value === undefined
    ? "No ratings"
    : `${Number(value).toFixed(1)} / 5`;
}

function TrendChart({ title, description, data, valueKey, formatValue }) {
  const maximumValue = Math.max(
    1,
    ...data.map((item) => Number(item[valueKey] || 0))
  );

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="text-lg font-black text-emerald-950">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      <div className="mt-5 grid h-44 grid-cols-12 items-end gap-1.5">
        {data.map((item) => {
          const value = Number(item[valueKey] || 0);
          const barHeight =
            value > 0 ? Math.max(8, (value / maximumValue) * 100) : 2;

          return (
            <div
              key={item.month}
              className="flex h-full min-w-0 flex-col justify-end"
              title={`${item.monthName}: ${formatValue(value)}`}
            >
              <span className="mb-1 truncate text-center text-[10px] font-bold text-slate-600">
                {value > 0 ? formatValue(value) : ""}
              </span>
              <div
                className="w-full rounded-t bg-emerald-800 transition hover:bg-lime-500"
                style={{ height: `${barHeight}%` }}
              />
              <span className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                {item.monthName.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BookingTrendChart({ data, year }) {
  const maximumValue = Math.max(
    1,
    ...data.flatMap((item) => [
      Number(item.totalBookingRequests || 0),
      Number(item.confirmedBookings || 0),
    ])
  );

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-black text-emerald-950">
            Monthly Booking Trend
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Total booking requests compared with confirmed bookings across{" "}
            {year}.
          </p>
        </div>
        <div className="flex gap-3 text-[11px] font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-800" />
            Total Booking Requests
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lime-400" />
            Confirmed Bookings
          </span>
        </div>
      </div>

      <div className="mt-5 grid h-44 grid-cols-12 items-end gap-1.5">
        {data.map((item) => {
          const totalRequests = Number(item.totalBookingRequests || 0);
          const confirmedBookings = Number(item.confirmedBookings || 0);

          return (
            <div
              key={item.month}
              className="flex h-full min-w-0 flex-col justify-end"
              title={`${item.monthName}: ${totalRequests} requests, ${confirmedBookings} confirmed`}
            >
              <div className="flex h-full items-end justify-center gap-px">
                <div
                  className="w-1/2 rounded-t bg-emerald-800"
                  style={{
                    height: `${
                      totalRequests > 0
                        ? Math.max(8, (totalRequests / maximumValue) * 100)
                        : 2
                    }%`,
                  }}
                />
                <div
                  className="w-1/2 rounded-t bg-lime-400"
                  style={{
                    height: `${
                      confirmedBookings > 0
                        ? Math.max(
                            8,
                            (confirmedBookings / maximumValue) * 100
                          )
                        : 2
                    }%`,
                  }}
                />
              </div>
              <span className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                {item.monthName.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SentimentBar({ label, count, total, className }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MerchantAnalyticsPage() {
  const merchantId = getMerchantProfileId();
  const authUser = getAuthUser();
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    year: String(currentYear),
    month: "",
    facilityId: "",
  });
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!merchantId || !authUser?.userId) {
        setErrorMessage("Merchant session information is unavailable.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const query = new URLSearchParams({ year: filters.year });

        if (filters.month) query.set("month", filters.month);
        if (filters.facilityId) {
          query.set("facilityId", filters.facilityId);
        }

        const response = await authFetch(
          `${API_BASE_URL}/merchants/${merchantId}/analytics?${query}`,
          {}
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load analytics.");
        }

        setAnalytics(data.analytics);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [
    authUser?.userId,
    filters.facilityId,
    filters.month,
    filters.year,
    merchantId,
  ]);

  const summary = analytics?.summary;
  const sentimentTotal = useMemo(() => {
    const counts = summary?.sentimentCounts;
    return counts
      ? counts.positive + counts.neutral + counts.negative
      : 0;
  }, [summary]);

  const kpis = [
    {
      label: "Total Booking Requests",
      value: summary?.totalBookings ?? 0,
      note: "Selected period",
    },
    {
      label: "Confirmed Bookings",
      value: summary?.confirmedBookings ?? 0,
      note: "Revenue eligible",
    },
    {
      label: "Confirmed Revenue",
      value: formatCurrency(summary?.estimatedRevenue),
      note: "Confirmed bookings only",
    },
    {
      label: "Pending Verification",
      value: summary?.pendingVerifications ?? 0,
      note: "Needs merchant action",
    },
    {
      label: "Average Rating",
      value:
        summary?.averageRating === null ||
        summary?.averageRating === undefined
          ? "-"
          : Number(summary.averageRating).toFixed(1),
      note: summary?.totalReviews
        ? `${summary.totalReviews} review${
            summary.totalReviews === 1 ? "" : "s"
          }`
        : "No reviews in period",
    },
    {
      label: "Total Reviews",
      value: summary?.totalReviews ?? 0,
      note: "Selected period",
    },
  ];

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Analytics
            </p>
            <h1 className="mt-2 text-3xl font-black text-emerald-950">
              Business Performance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review booking demand, confirmed revenue, payments, facility
              performance, and customer feedback.
            </p>
          </div>

          <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:grid-cols-3">
            <label className="text-xs font-bold text-slate-600">
              Year
              <input
                name="year"
                type="number"
                min="2000"
                max="2100"
                value={filters.year}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-lime-400"
              />
            </label>

            <label className="text-xs font-bold text-slate-600">
              Month
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-lime-400"
              >
                <option value="">All Months</option>
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold text-slate-600">
              Facility
              <select
                name="facilityId"
                value={filters.facilityId}
                onChange={handleFilterChange}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-lime-400"
              >
                <option value="">All Facilities</option>
                {(analytics?.facilities || []).map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {isLoading ? (
          <div className="mt-6 rounded-xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-gray-200">
            Loading merchant analytics...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="mt-6 rounded-xl bg-red-50 p-5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage && analytics ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {kpis.map((kpi) => (
                <article
                  key={kpi.label}
                  className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-emerald-950">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{kpi.note}</p>
                </article>
              ))}
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <BookingTrendChart
                data={analytics.monthlyAnalytics || []}
                year={filters.year}
              />
              <TrendChart
                title="Confirmed Revenue"
                description="Monthly revenue from confirmed bookings only."
                data={analytics.monthlyAnalytics || []}
                valueKey="confirmedRevenue"
                formatValue={(value) =>
                  value >= 1000
                    ? `RM ${(value / 1000).toFixed(1)}k`
                    : `RM ${value.toFixed(0)}`
                }
              />
            </section>

            <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-black text-emerald-950">
                    Facility Performance
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Booking and feedback results for the selected period.
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {summary.totalFacilities} facilities,{" "}
                  {summary.activeFacilities} active
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Facility</th>
                      <th className="px-4 py-3">Total Requests</th>
                      <th className="px-4 py-3">Confirmed Bookings</th>
                      <th className="px-4 py-3">Confirmed Revenue</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Reviews</th>
                      <th className="px-4 py-3">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(analytics.facilityPerformance || []).map((facility) => (
                      <tr key={facility.facilityId}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-emerald-950">
                            {facility.facilityName}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              facility.isActive
                                ? "bg-lime-100 text-emerald-800"
                                : "bg-gray-200 text-slate-600"
                            }`}
                          >
                            {facility.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {facility.totalBookings}
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {facility.confirmedBookings}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-bold">
                          {formatCurrency(facility.estimatedRevenue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {formatRating(facility.averageRating)}
                        </td>
                        <td className="px-4 py-4">{facility.totalReviews}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold">
                          <span className="text-emerald-700">
                            Pos {facility.sentimentCounts.positive}
                          </span>{" "}
                          <span className="text-slate-500">
                            / Neu {facility.sentimentCounts.neutral}
                          </span>{" "}
                          <span className="text-red-600">
                            / Neg {facility.sentimentCounts.negative}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {analytics.facilityPerformance?.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  No facilities match the selected filter.
                </p>
              ) : null}
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-3">
              <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <h2 className="text-lg font-black text-emerald-950">
                  Sentiment Distribution
                </h2>
                <div className="mt-5 space-y-4">
                  <SentimentBar
                    label="Positive"
                    count={summary.sentimentCounts.positive}
                    total={sentimentTotal}
                    className="bg-emerald-600"
                  />
                  <SentimentBar
                    label="Neutral"
                    count={summary.sentimentCounts.neutral}
                    total={sentimentTotal}
                    className="bg-slate-400"
                  />
                  <SentimentBar
                    label="Negative"
                    count={summary.sentimentCounts.negative}
                    total={sentimentTotal}
                    className="bg-red-500"
                  />
                </div>
              </article>

              <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <h2 className="text-lg font-black text-emerald-950">
                  Popular Booking Times
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Based on the first selected slot.
                </p>
                <div className="mt-4 space-y-3">
                  {(analytics.timeAnalytics.popularStartTimes || []).map(
                    (time, index) => (
                      <div
                        key={time.label}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {index + 1}. {time.label}
                        </span>
                        <span className="text-sm font-black text-emerald-900">
                          {time.count}
                        </span>
                      </div>
                    )
                  )}
                  {analytics.timeAnalytics.popularStartTimes?.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No booking time data for this period.
                    </p>
                  ) : null}
                </div>
                {analytics.timeAnalytics.mostPopularBookingDay ? (
                  <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-slate-600">
                    Most popular day:{" "}
                    <strong className="text-emerald-950">
                      {
                        analytics.timeAnalytics.mostPopularBookingDay
                          .label
                      }
                    </strong>
                  </p>
                ) : null}
              </article>

              <article className="rounded-xl bg-emerald-950 p-5 text-white shadow-sm">
                <h2 className="text-lg font-black">Actionable Insights</h2>
                <div className="mt-4 space-y-3">
                  {(analytics.actionableInsights || []).map((insight) => (
                    <p
                      key={insight}
                      className="rounded-lg bg-white/10 px-3 py-3 text-sm leading-5 text-emerald-50"
                    >
                      {insight}
                    </p>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <div>
                    <p className="text-xl font-black">
                      {analytics.paymentAnalytics.pendingVerification}
                    </p>
                    <p className="text-[10px] uppercase text-emerald-100/70">
                      Pending
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-black">
                      {analytics.paymentAnalytics.approvedProofs}
                    </p>
                    <p className="text-[10px] uppercase text-emerald-100/70">
                      Approved
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-black">
                      {analytics.paymentAnalytics.rejectedProofs}
                    </p>
                    <p className="text-[10px] uppercase text-emerald-100/70">
                      Rejected
                    </p>
                  </div>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default MerchantAnalyticsPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { authFetch } from "../../utils/api";
import { getUploadFileUrl } from "../../utils/uploadUrl";
import { formatDisplayTimeRange } from "../../utils/timeFormat";

const statusOptions = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
];

const actionStatuses = ["UNDER_REVIEW", "RESOLVED", "DISMISSED"];

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

function formatLabel(value) {
  return value ? value.replaceAll("_", " ") : "Not provided";
}

function getStatusClass(status) {
  if (status === "RESOLVED") {
    return "bg-lime-100 text-emerald-800 ring-lime-200";
  }

  if (status === "DISMISSED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (status === "UNDER_REVIEW") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function getBookingTimeLabel(report) {
  const startTime = report.booking?.time?.startTime;
  const endTime = report.booking?.time?.endTime;

  if (!startTime || !endTime) return "No slots";

  return formatDisplayTimeRange(startTime, endTime);
}

function getMerchantApprovalLink(report) {
  const params = new URLSearchParams();
  const approvalStatus = report.merchant?.approvalStatus;
  const search =
    report.merchant?.email ||
    report.merchant?.businessName ||
    report.merchant?.username ||
    "";

  if (approvalStatus) params.set("approvalStatus", approvalStatus);
  if (search) params.set("search", search);

  return `/admin/merchants${params.toString() ? `?${params.toString()}` : ""}`;
}

function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingReportId, setProcessingReportId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authFetch("http://localhost:5000/admin/reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load reports");
      }

      setReports(data.reports || []);
    } catch (error) {
      console.error("Fetch admin reports error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "ALL" || report.status === statusFilter;

      const searchableText = [
        report.id,
        report.booking?.bookingId,
        report.reason,
        report.description,
        report.customer?.fullName,
        report.customer?.username,
        report.customer?.email,
        report.merchant?.businessName,
        report.merchant?.email,
        report.facility?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [reports, searchTerm, statusFilter]);

  const statusCounts = useMemo(
    () =>
      statusOptions.reduce((counts, status) => {
        counts[status] =
          status === "ALL"
            ? reports.length
            : reports.filter((report) => report.status === status).length;
        return counts;
      }, {}),
    [reports]
  );

  const handleUpdateReport = async (report, status) => {
    try {
      setProcessingReportId(report.id);
      setMessage("");

      const response = await authFetch(
        `http://localhost:5000/admin/reports/${report.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            adminNote: adminNotes[report.id] ?? report.adminNote ?? "",
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update report");
      }

      setReports((currentReports) =>
        currentReports.map((currentReport) =>
          currentReport.id === report.id ? data.report : currentReport
        )
      );
      setAdminNotes((currentNotes) => ({
        ...currentNotes,
        [report.id]: data.report.adminNote || "",
      }));
      setIsSuccess(true);
      setMessage(data.message);
    } catch (error) {
      console.error("Update admin report error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to update report.");
    } finally {
      setProcessingReportId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950">
            Customer Reports
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review booking-based customer disputes before taking any account or
            facility action.
          </p>
        </section>

        <section className="mt-5 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200 md:grid-cols-[220px_1fr]">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)} ({statusCounts[status] || 0})
              </option>
            ))}
          </select>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search customer, merchant, facility, reason, or booking ID"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-lime-400"
          />
        </section>

        {message ? (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
              isSuccess
                ? "bg-lime-50 text-emerald-800 ring-1 ring-lime-100"
                : "bg-red-50 text-red-700 ring-1 ring-red-100"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="mt-5 space-y-4">
          {isLoading ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading reports...
            </div>
          ) : null}

          {!isLoading && filteredReports.length === 0 ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No reports match this filter.
            </div>
          ) : null}

          {!isLoading
            ? filteredReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const proofUrl =
                  report.paymentProof?.fileUrl ||
                  getUploadFileUrl(report.paymentProof?.filePath);
                const isImageProof = /\.(jpe?g|png|webp)$/i.test(
                  [
                    report.paymentProof?.fileUrl,
                    report.paymentProof?.filePath,
                    report.paymentProof?.originalFileName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                );

                return (
                  <article
                    key={report.id}
                    className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                            Report #{report.id}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClass(
                              report.status
                            )}`}
                          >
                            {formatLabel(report.status)}
                          </span>
                        </div>
                        <h2 className="mt-2 text-xl font-black text-emerald-950">
                          {formatLabel(report.reason)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Booking #{report.booking?.bookingId} -{" "}
                          {report.facility?.name || "Facility"} -{" "}
                          {formatDate(report.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReportId((currentId) =>
                            currentId === report.id ? null : report.id
                          )
                        }
                        className="w-fit rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>

                    <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-slate-700 ring-1 ring-gray-200">
                      {report.description}
                    </p>

                    {isExpanded ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 text-sm lg:grid-cols-3">
                          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                            <p className="font-black text-emerald-950">
                              Customer
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {report.customer?.fullName || "Not provided"}
                            </p>
                            <p className="text-slate-500">
                              {report.customer?.username
                                ? `@${report.customer.username}`
                                : "Username not set"}
                            </p>
                            <p className="break-all text-slate-500">
                              {report.customer?.email || "Email not provided"}
                            </p>
                            <p className="text-slate-500">
                              {report.customer?.phoneNumber ||
                                "Phone not provided"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                            <p className="font-black text-emerald-950">
                              Merchant
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {report.merchant?.businessName ||
                                "Business not provided"}
                            </p>
                            <p className="break-all text-slate-500">
                              {report.merchant?.email || "Email not provided"}
                            </p>
                            <p className="text-slate-500">
                              {report.merchant?.phoneNumber ||
                                "Phone not provided"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                to={`/admin/users?role=MERCHANT&userId=${report.merchant?.merchantUserId}`}
                                className="inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
                              >
                                Open Merchant Account
                              </Link>
                              <Link
                                to={getMerchantApprovalLink(report)}
                                className="inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-gray-200 hover:bg-gray-50"
                              >
                                Open Merchant Approval
                              </Link>
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                            <p className="font-black text-emerald-950">
                              Facility
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {report.facility?.name || "Facility"}
                            </p>
                            <p className="text-slate-500">
                              {[report.facility?.areaName, report.facility?.stateName]
                                .filter(Boolean)
                                .join(", ") ||
                                report.facility?.location ||
                                "Location not provided"}
                            </p>
                            <p className="text-slate-500">
                              Status:{" "}
                              {report.facility?.isActive
                                ? "Active"
                                : "Inactive"}
                            </p>
                            <Link
                              to="/admin/facilities"
                              className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
                            >
                              Open Facility Management
                            </Link>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm lg:grid-cols-2">
                          <div className="rounded-lg bg-white p-4 ring-1 ring-gray-200">
                            <p className="font-black text-emerald-950">
                              Booking Details
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <p>
                                <span className="font-semibold text-slate-500">
                                  Date:
                                </span>{" "}
                                {formatDate(report.booking?.bookingDate)}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-500">
                                  Time:
                                </span>{" "}
                                {getBookingTimeLabel(report)}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-500">
                                  Status:
                                </span>{" "}
                                {formatLabel(report.booking?.status)}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-500">
                                  Total:
                                </span>{" "}
                                {formatCurrency(report.booking?.totalPrice)}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-lg bg-white p-4 ring-1 ring-gray-200">
                            <p className="font-black text-emerald-950">
                              Payment Proof
                            </p>
                            {report.paymentProof ? (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm text-slate-600">
                                  Status:{" "}
                                  <span className="font-bold">
                                    {report.paymentProof.status}
                                  </span>
                                </p>
                                <p className="text-sm text-slate-600">
                                  Uploaded:{" "}
                                  {formatDateTime(
                                    report.paymentProof.uploadedAt
                                  )}
                                </p>
                                {proofUrl ? (
                                  <div className="space-y-3">
                                    {isImageProof ? (
                                      <a
                                        href={proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                                      >
                                        <img
                                          src={proofUrl}
                                          alt="Payment proof"
                                          className="max-h-56 w-full object-contain"
                                        />
                                      </a>
                                    ) : null}
                                    <a
                                      href={proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex rounded-lg bg-emerald-950 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                                    >
                                      Open Full Image
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-500">
                                No payment proof uploaded.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
                          <label className="text-sm font-bold text-emerald-950">
                            Admin Note
                          </label>
                          <textarea
                            rows="3"
                            maxLength="1500"
                            value={adminNotes[report.id] ?? report.adminNote ?? ""}
                            onChange={(event) =>
                              setAdminNotes((currentNotes) => ({
                                ...currentNotes,
                                [report.id]: event.target.value,
                              }))
                            }
                            className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400"
                            placeholder="Add admin review note"
                          />

                          <div className="mt-3 flex flex-wrap gap-2">
                            {actionStatuses.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleUpdateReport(report, status)}
                                disabled={processingReportId === report.id}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                              >
                                {processingReportId === report.id
                                  ? "Updating..."
                                  : `Mark ${formatLabel(status)}`}
                              </button>
                            ))}
                          </div>

                          {report.reviewedAt ? (
                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              Last reviewed {formatDateTime(report.reviewedAt)}
                              {report.reviewedBy?.fullName
                                ? ` by ${report.reviewedBy.fullName}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminReportsPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAuthUser } from "../../utils/auth";
import { getUploadFileUrl } from "../../utils/uploadUrl";

const approvalTabs = [
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  return new Date(dateValue).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "APPROVED") {
    return "bg-lime-100 text-emerald-800 ring-lime-200";
  }

  if (status === "REJECTED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function AdminMerchantApprovalPage() {
  const authUser = getAuthUser();
  const [merchants, setMerchants] = useState([]);
  const [selectedTab, setSelectedTab] = useState("PENDING_APPROVAL");
  const [approvalNotes, setApprovalNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingMerchantId, setProcessingMerchantId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchMerchants = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/admin/merchants", {
        headers: {
          "x-user-id": String(authUser?.userId || ""),
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load merchants");
      }

      setMerchants(data.merchants || []);
    } catch (error) {
      console.error("Fetch admin merchants error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to load merchant applications.");
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.userId]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const filteredMerchants = useMemo(
    () =>
      merchants.filter(
        (merchant) => merchant.approvalStatus === selectedTab
      ),
    [merchants, selectedTab]
  );

  const statusCounts = useMemo(
    () =>
      approvalTabs.reduce((counts, tab) => {
        counts[tab.value] = merchants.filter(
          (merchant) => merchant.approvalStatus === tab.value
        ).length;
        return counts;
      }, {}),
    [merchants]
  );

  const handleApprovalAction = async (merchantId, action) => {
    try {
      setProcessingMerchantId(merchantId);
      setMessage("");
      setIsSuccess(false);

      const response = await fetch(
        `http://localhost:5000/admin/merchants/${merchantId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": String(authUser?.userId || ""),
          },
          body: JSON.stringify({
            approvalNote:
              action === "reject" ? approvalNotes[merchantId] || "" : "",
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} merchant`);
      }

      setApprovalNotes((currentNotes) => ({
        ...currentNotes,
        [merchantId]: "",
      }));
      setIsSuccess(true);
      setMessage(data.message);
      await fetchMerchants();
    } catch (error) {
      console.error(`Admin merchant ${action} error:`, error);
      setIsSuccess(false);
      setMessage(error.message || `Unable to ${action} merchant.`);
    } finally {
      setProcessingMerchantId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin Portal
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950 md:text-4xl">
            Merchant Approvals
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Review merchant registrations before allowing facility and payment
            setup access.
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 md:p-5">
          <div className="flex gap-2 overflow-x-auto">
            {approvalTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedTab(tab.value)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  selectedTab === tab.value
                    ? "bg-emerald-950 text-white"
                    : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                }`}
              >
                {tab.label} ({statusCounts[tab.value] || 0})
              </button>
            ))}
          </div>
        </section>

        {message ? (
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${
              isSuccess
                ? "bg-lime-50 text-emerald-800 ring-1 ring-lime-100"
                : "bg-red-50 text-red-700 ring-1 ring-red-100"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="mt-5">
          {isLoading ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading merchant applications...
            </div>
          ) : null}

          {!isLoading && filteredMerchants.length === 0 ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No {selectedTab.toLowerCase().replace("_", " ")} merchants.
            </div>
          ) : null}

          {!isLoading && filteredMerchants.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredMerchants.map((merchant) => (
                <article
                  key={merchant.merchantProfileId}
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Merchant #{merchant.merchantProfileId}
                      </p>
                      <h2 className="mt-2 text-xl font-black text-emerald-950">
                        {merchant.businessName}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {merchant.fullName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {merchant.username
                          ? `@${merchant.username}`
                          : "Username not set"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {merchant.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Contact: {merchant.phoneNumber || "Not provided"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusClass(
                        merchant.approvalStatus
                      )}`}
                    >
                      {merchant.approvalStatus.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                      <p className="text-slate-500">Registered</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(merchant.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                      <p className="text-slate-500">Approved</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(merchant.approvedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-emerald-950">
                        Business Verification
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          merchant.verificationDocumentUrl &&
                          merchant.ownershipProofUrl
                            ? "bg-lime-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {merchant.verificationDocumentUrl &&
                        merchant.ownershipProofUrl
                          ? "Documents Submitted"
                          : "Documents Incomplete"}
                      </span>
                    </div>

                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Business Phone Number
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-800">
                          {merchant.businessPhone || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Registration / SSM Number
                        </dt>
                        <dd className="mt-1 break-words font-semibold text-slate-800">
                          {merchant.businessRegistrationNumber ||
                            "Not provided"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500">
                          Business Address
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                          {merchant.businessAddress || "Not provided"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-100 pt-3">
                      {merchant.verificationDocumentUrl ? (
                        <a
                          href={getUploadFileUrl(
                            merchant.verificationDocumentUrl
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                        >
                          Open Verification Document
                        </a>
                      ) : (
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          Verification document missing
                        </span>
                      )}

                      {merchant.ownershipProofUrl ? (
                        <a
                          href={getUploadFileUrl(merchant.ownershipProofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                        >
                          Open Ownership Proof
                        </a>
                      ) : (
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          Ownership proof missing
                        </span>
                      )}
                    </div>
                  </div>

                  {merchant.approvalNote ? (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
                      <span className="font-bold">Admin note:</span>{" "}
                      {merchant.approvalNote}
                    </div>
                  ) : null}

                  {merchant.approvalStatus !== "APPROVED" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleApprovalAction(
                          merchant.merchantProfileId,
                          "approve"
                        )
                      }
                      disabled={
                        processingMerchantId === merchant.merchantProfileId
                      }
                      className="mt-4 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Approve Merchant
                    </button>
                  ) : null}

                  {merchant.approvalStatus !== "REJECTED" ? (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <label className="text-sm font-semibold text-slate-700">
                        Rejection Note (optional)
                      </label>
                      <textarea
                        rows="2"
                        maxLength="500"
                        value={
                          approvalNotes[merchant.merchantProfileId] || ""
                        }
                        onChange={(event) =>
                          setApprovalNotes((currentNotes) => ({
                            ...currentNotes,
                            [merchant.merchantProfileId]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
                        placeholder="Reason for rejection"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleApprovalAction(
                            merchant.merchantProfileId,
                            "reject"
                          )
                        }
                        disabled={
                          processingMerchantId === merchant.merchantProfileId
                        }
                        className="mt-3 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        Reject Merchant
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminMerchantApprovalPage;

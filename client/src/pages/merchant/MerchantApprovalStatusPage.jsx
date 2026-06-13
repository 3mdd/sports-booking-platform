import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  getAuthUser,
  getMerchantApprovalStatus,
  getMerchantProfileId,
} from "../../utils/auth";
import { getUploadFileUrl } from "../../utils/uploadUrl";

const emptyVerification = {
  businessPhone: "",
  businessAddress: "",
  businessRegistrationNumber: "",
  verificationDocumentUrl: "",
  ownershipProofUrl: "",
};

function MerchantApprovalStatusPage() {
  const location = useLocation();
  const authUser = getAuthUser();
  const merchantId = getMerchantProfileId();
  const approvalStatus = getMerchantApprovalStatus();
  const isRejected = approvalStatus === "REJECTED";
  const [verification, setVerification] = useState(emptyVerification);
  const [verificationDocument, setVerificationDocument] = useState(null);
  const [ownershipProof, setOwnershipProof] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    location.state?.verificationMessage || ""
  );
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/merchants/${merchantId}/verification`,
          {
            headers: {
              "x-user-id": String(authUser?.userId || ""),
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load verification");
        }

        setVerification({
          businessPhone: data.verification?.businessPhone || "",
          businessAddress: data.verification?.businessAddress || "",
          businessRegistrationNumber:
            data.verification?.businessRegistrationNumber || "",
          verificationDocumentUrl:
            data.verification?.verificationDocumentUrl || "",
          ownershipProofUrl: data.verification?.ownershipProofUrl || "",
        });
      } catch (error) {
        console.error("Fetch merchant verification error:", error);
        setMessage(error.message || "Unable to load verification details.");
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [authUser?.userId, merchantId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setVerification((currentVerification) => ({
      ...currentVerification,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");
      setIsSuccess(false);

      const formData = new FormData();
      formData.append("businessPhone", verification.businessPhone.trim());
      formData.append("businessAddress", verification.businessAddress.trim());
      formData.append(
        "businessRegistrationNumber",
        verification.businessRegistrationNumber.trim()
      );

      if (verificationDocument) {
        formData.append("verificationDocument", verificationDocument);
      }

      if (ownershipProof) {
        formData.append("ownershipProof", ownershipProof);
      }

      const response = await fetch(
        `http://localhost:5000/merchants/${merchantId}/verification`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": String(authUser?.userId || ""),
          },
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit verification");
      }

      setVerification((currentVerification) => ({
        ...currentVerification,
        ...data.verification,
      }));
      setVerificationDocument(null);
      setOwnershipProof(null);
      setIsSuccess(true);
      setMessage(
        "Verification details submitted. The admin can now review your documents."
      );
    } catch (error) {
      console.error("Submit merchant verification error:", error);
      setMessage(error.message || "Unable to submit verification details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="text-center">
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ring-1 ${
                isRejected
                  ? "bg-red-50 text-red-700 ring-red-100"
                  : "bg-amber-50 text-amber-700 ring-amber-100"
              }`}
            >
              {isRejected ? "Application Rejected" : "Pending Approval"}
            </span>

            <h1 className="mt-5 text-3xl font-black text-emerald-950">
              {isRejected
                ? "Merchant account rejected"
                : "Waiting for admin approval"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {isRejected
                ? "Review the admin note and update your business verification information before contacting the platform administrator."
                : "Submit your business verification details below so the admin can review your application."}
            </p>
          </div>

          {isRejected && authUser?.merchantApprovalNote ? (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-4 text-sm text-red-700 ring-1 ring-red-100">
              <p className="font-bold">Admin note</p>
              <p className="mt-2 leading-6">
                {authUser.merchantApprovalNote}
              </p>
            </div>
          ) : null}

          {message ? (
            <div
              className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${
                isSuccess
                  ? "bg-lime-50 text-emerald-800 ring-1 ring-lime-100"
                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
              }`}
            >
              {message}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl bg-gray-50 p-5 ring-1 ring-gray-200"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-emerald-950">
                  Submit verification documents
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Upload business registration, license, or authorization
                  document. Do not upload unnecessary sensitive personal
                  documents.
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {authUser?.fullName}
                </p>
                <p>{authUser?.email}</p>
              </div>
            </div>

            {isLoading ? (
              <p className="mt-5 text-sm font-medium text-slate-500">
                Loading verification details...
              </p>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Business Phone
                    </label>
                    <input
                      name="businessPhone"
                      type="tel"
                      maxLength="50"
                      value={verification.businessPhone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Business Registration / SSM Number
                    </label>
                    <input
                      name="businessRegistrationNumber"
                      type="text"
                      maxLength="100"
                      value={verification.businessRegistrationNumber}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Business Address
                  </label>
                  <textarea
                    name="businessAddress"
                    rows="2"
                    maxLength="500"
                    value={verification.businessAddress}
                    onChange={handleInputChange}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Verification Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(event) =>
                        setVerificationDocument(
                          event.target.files?.[0] || null
                        )
                      }
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-950 file:px-3 file:py-2 file:font-semibold file:text-white"
                    />
                    {verification.verificationDocumentUrl ? (
                      <a
                        href={getUploadFileUrl(
                          verification.verificationDocumentUrl
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-bold text-emerald-800 hover:text-lime-600"
                      >
                        View current document
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        No document uploaded
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ownership / Authorization Proof
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(event) =>
                        setOwnershipProof(event.target.files?.[0] || null)
                      }
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-950 file:px-3 file:py-2 file:font-semibold file:text-white"
                    />
                    {verification.ownershipProofUrl ? (
                      <a
                        href={getUploadFileUrl(verification.ownershipProofUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-bold text-emerald-800 hover:text-lime-600"
                      >
                        View current proof
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        No proof uploaded
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    PDF, JPG, PNG, or WEBP. Maximum 5 MB per file.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Verification"}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default MerchantApprovalStatusPage;

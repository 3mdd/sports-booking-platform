import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getMerchantProfileId } from "../../utils/auth";
import { getUploadFileUrl } from "../../utils/uploadUrl";
import { authFetch } from "../../utils/api";

const initialFormData = {
  paymentBankName: "",
  paymentAccountName: "",
  paymentAccountNumber: "",
  paymentInstructions: "",
};

function MerchantPaymentSettingsPage() {
  const merchantProfileId = getMerchantProfileId();
  const qrInputRef = useRef(null);
  const [formData, setFormData] = useState(initialFormData);
  const [businessName, setBusinessName] = useState("");
  const [currentQrImageUrl, setCurrentQrImageUrl] = useState("");
  const [selectedQrFile, setSelectedQrFile] = useState(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setIsLoading(true);
        setMessage("");

        const response = await authFetch(
          `http://localhost:5000/merchants/${merchantProfileId}/payment-details`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load payment details");
        }

        const paymentDetails = data.paymentDetails || {};

        setBusinessName(paymentDetails.businessName || "");
        setCurrentQrImageUrl(paymentDetails.paymentQrImageUrl || "");
        setFormData({
          paymentBankName: paymentDetails.paymentBankName || "",
          paymentAccountName: paymentDetails.paymentAccountName || "",
          paymentAccountNumber:
            paymentDetails.paymentAccountNumber || "",
          paymentInstructions: paymentDetails.paymentInstructions || "",
        });
      } catch (error) {
        console.error("Fetch merchant payment details error:", error);
        setIsSuccess(false);
        setMessage(error.message || "Unable to load payment details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [merchantProfileId]);

  useEffect(() => {
    return () => {
      if (qrPreviewUrl) {
        URL.revokeObjectURL(qrPreviewUrl);
      }
    };
  }, [qrPreviewUrl]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setMessage("");
  };

  const handleQrFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (qrPreviewUrl) {
      URL.revokeObjectURL(qrPreviewUrl);
    }

    setSelectedQrFile(file);
    setQrPreviewUrl(file ? URL.createObjectURL(file) : "");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.paymentInstructions.length > 500) {
      setIsSuccess(false);
      setMessage("Payment instructions must be 500 characters or fewer.");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsSuccess(false);
      setMessage("");

      const requestData = new FormData();
      requestData.append("paymentBankName", formData.paymentBankName);
      requestData.append("paymentAccountName", formData.paymentAccountName);
      requestData.append(
        "paymentAccountNumber",
        formData.paymentAccountNumber
      );
      requestData.append(
        "paymentInstructions",
        formData.paymentInstructions
      );

      if (selectedQrFile) {
        requestData.append("paymentQrImage", selectedQrFile);
      }

      const response = await authFetch(
        `http://localhost:5000/merchants/${merchantProfileId}/payment-details`,
        {
          method: "PATCH",
          body: requestData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update payment details");
      }

      const paymentDetails = data.paymentDetails || {};

      setCurrentQrImageUrl(paymentDetails.paymentQrImageUrl || "");
      setSelectedQrFile(null);

      if (qrPreviewUrl) {
        URL.revokeObjectURL(qrPreviewUrl);
      }

      setQrPreviewUrl("");

      if (qrInputRef.current) {
        qrInputRef.current.value = "";
      }

      setIsSuccess(true);
      setMessage("Payment details updated successfully.");
    } catch (error) {
      console.error("Update merchant payment details error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to update payment details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedQrImage =
    qrPreviewUrl || getUploadFileUrl(currentQrImageUrl);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-7 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Payment Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Set the bank transfer and QR details customers see before
              uploading payment proof.
            </p>
          </div>

          <Link
            to="/merchant/payments"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50"
          >
            Payment Verification
          </Link>
        </section>

        {isLoading ? (
          <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-gray-200">
            Loading payment settings...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div>
                <h2 className="text-xl font-black text-emerald-950">
                  Bank Transfer Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {businessName || "Merchant business"}
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bank Name
                  </label>
                  <input
                    name="paymentBankName"
                    type="text"
                    value={formData.paymentBankName}
                    onChange={handleInputChange}
                    placeholder="e.g. Maybank"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Account Holder Name
                  </label>
                  <input
                    name="paymentAccountName"
                    type="text"
                    value={formData.paymentAccountName}
                    onChange={handleInputChange}
                    placeholder="Account holder or business name"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Account Number
                  </label>
                  <input
                    name="paymentAccountNumber"
                    type="text"
                    value={formData.paymentAccountNumber}
                    onChange={handleInputChange}
                    placeholder="Account number"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Instructions
                  </label>
                  <textarea
                    name="paymentInstructions"
                    rows="4"
                    maxLength="500"
                    value={formData.paymentInstructions}
                    onChange={handleInputChange}
                    placeholder="Optional transfer reference or payment guidance"
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none focus:border-lime-400 focus:bg-white"
                  />
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {formData.paymentInstructions.length}/500
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-xl font-black text-emerald-950">
                Payment QR
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Optional. JPG, PNG, and WEBP images are supported.
              </p>

              {displayedQrImage ? (
                <img
                  src={displayedQrImage}
                  alt="Payment QR preview"
                  className="mt-5 aspect-square w-full rounded-xl object-contain ring-1 ring-gray-200"
                />
              ) : (
                <div className="mt-5 flex aspect-square items-center justify-center rounded-xl bg-gray-50 px-6 text-center text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                  No payment QR image uploaded.
                </div>
              )}

              <input
                ref={qrInputRef}
                name="paymentQrImage"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleQrFileChange}
                className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-lime-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-emerald-950"
              />

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

              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-5 w-full rounded-lg px-5 py-3 text-sm font-bold text-white transition ${
                  isSubmitting
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-emerald-950 hover:bg-emerald-900"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Payment Details"}
              </button>
            </section>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MerchantPaymentSettingsPage;

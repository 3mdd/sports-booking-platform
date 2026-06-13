import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { saveAuthUser } from "../../utils/auth";

function RegisterPage({ role }) {
  const navigate = useNavigate();
  const isMerchantRegistration = role === "MERCHANT";
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessPhone: "",
    businessAddress: "",
    businessRegistrationNumber: "",
  });
  const [verificationDocument, setVerificationDocument] = useState(null);
  const [ownershipProof, setOwnershipProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      (isMerchantRegistration && !formData.businessName.trim())
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const endpoint = isMerchantRegistration
        ? "http://localhost:5000/auth/register/merchant"
        : "http://localhost:5000/auth/register/customer";
      const requestBody = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
      };

      if (isMerchantRegistration) {
        requestBody.businessName = formData.businessName.trim();
        requestBody.businessPhone = formData.businessPhone.trim();
        requestBody.businessAddress = formData.businessAddress.trim();
        requestBody.businessRegistrationNumber =
          formData.businessRegistrationNumber.trim();
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      saveAuthUser({
        userId: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
        role: data.user.role,
        customerProfileId: data.customerProfile?.id,
        merchantProfileId: data.merchantProfile?.id,
        merchantApprovalStatus: data.merchantProfile?.approvalStatus,
        merchantApprovalNote: data.merchantProfile?.approvalNote,
      });

      let verificationMessage = "";

      if (
        isMerchantRegistration &&
        (verificationDocument || ownershipProof)
      ) {
        try {
          const verificationData = new FormData();

          if (verificationDocument) {
            verificationData.append(
              "verificationDocument",
              verificationDocument
            );
          }

          if (ownershipProof) {
            verificationData.append("ownershipProof", ownershipProof);
          }

          const verificationResponse = await fetch(
            `http://localhost:5000/merchants/${data.merchantProfile.id}/verification`,
            {
              method: "PATCH",
              headers: {
                "x-user-id": String(data.user.id),
              },
              body: verificationData,
            }
          );
          const verificationResult = await verificationResponse.json();

          if (!verificationResponse.ok) {
            throw new Error(
              verificationResult.message ||
                "Verification documents could not be uploaded"
            );
          }
        } catch (verificationError) {
          console.error(
            "Merchant verification upload error:",
            verificationError
          );
          verificationMessage =
            "Your account was created, but the documents were not uploaded. Please submit them again below.";
        }
      }

      navigate(
        isMerchantRegistration
          ? "/merchant/approval-status"
          : "/facilities",
        {
          replace: true,
          state: verificationMessage ? { verificationMessage } : undefined,
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {isMerchantRegistration
              ? "Merchant Registration"
              : "Customer Registration"}
          </p>
          <h1 className="mt-2 text-3xl font-black text-emerald-950">
            Create your {isMerchantRegistration ? "merchant" : "customer"}{" "}
            account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isMerchantRegistration
              ? "Register your business to manage facilities, slots, payments, and customer feedback."
              : "Register to book facilities, upload payment proof, and manage your bookings."}
          </p>

          {errorMessage ? (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {isMerchantRegistration
                  ? "Contact Phone Number"
                  : "Phone Number"}
              </label>
              <input
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                maxLength="50"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g. 012-345 6789"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
              />
              {isMerchantRegistration ? (
                <p className="mt-2 text-xs text-slate-500">
                  Personal contact for account and approval communication.
                </p>
              ) : null}
            </div>

            {isMerchantRegistration ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Business Name
                  </label>
                  <input
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Business Phone Number
                  </label>
                  <input
                    name="businessPhone"
                    type="tel"
                    maxLength="50"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                    placeholder="Public business contact"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>
              </div>
            ) : null}

            {isMerchantRegistration ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Business Address
                  </label>
                  <textarea
                    name="businessAddress"
                    rows="2"
                    maxLength="500"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
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
                    value={formData.businessRegistrationNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
              />
            </div>

            {isMerchantRegistration ? (
              <div className="rounded-lg bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
                <p className="text-sm font-bold text-emerald-950">
                  Business verification documents
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Upload business registration, license, or authorization
                  document. Do not upload unnecessary sensitive personal
                  documents.
                </p>
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
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Optional during registration. Maximum 5 MB per file.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength="6"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength="6"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                />
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Use at least 6 characters and enter the same password twice.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-2 rounded-lg px-6 py-3 text-sm font-bold text-emerald-950 transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-lime-400 hover:bg-lime-300"
              }`}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered?
            <Link
              to="/login"
              className="ml-2 font-semibold text-emerald-900 hover:text-lime-600"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default RegisterPage;

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
    password: "",
    businessName: "",
  });
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
      (isMerchantRegistration && !formData.businessName.trim())
    ) {
      setErrorMessage("Please complete all required fields.");
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
        password: formData.password,
      };

      if (isMerchantRegistration) {
        requestBody.businessName = formData.businessName.trim();
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
        role: data.user.role,
        customerProfileId: data.customerProfile?.id,
        merchantProfileId: data.merchantProfile?.id,
      });

      navigate(
        isMerchantRegistration ? "/merchant/dashboard" : "/facilities",
        { replace: true }
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

      <main className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
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

            {isMerchantRegistration ? (
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
              <p className="mt-2 text-xs text-slate-500">
                Use at least 6 characters for this demonstration account.
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

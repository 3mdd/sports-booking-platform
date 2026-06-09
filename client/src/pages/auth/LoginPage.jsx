import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveAuthUser } from "../../utils/auth";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const user = data.user;

      if (
        (user.role === "CUSTOMER" && !user.customerProfile?.id) ||
        (user.role === "MERCHANT" && !user.merchantProfile?.id)
      ) {
        throw new Error("This account does not have a valid role profile.");
      }

      if (user.role !== "CUSTOMER" && user.role !== "MERCHANT") {
        throw new Error("This account role is not supported by the frontend.");
      }

      saveAuthUser({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        customerProfileId: user.customerProfile?.id,
        merchantProfileId: user.merchantProfile?.id,
      });

      navigate(
        user.role === "MERCHANT" ? "/merchant/dashboard" : "/facilities",
        { replace: true }
      );
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f3f4f6] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80"
          alt="Sports facility"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/65" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
          <Link to="/" className="text-3xl font-black tracking-tight">
            EliteSport
          </Link>
          <div className="max-w-lg">
            <h1 className="text-4xl font-black leading-tight">
              Book and manage sports facilities in one place.
            </h1>
            <p className="mt-4 text-sm leading-6 text-emerald-50/85">
              Customers can reserve slots and merchants can manage facilities,
              payments, availability, and reviews.
            </p>
          </div>
        </div>
      </div>

      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-emerald-950 lg:hidden"
          >
            EliteSport
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 lg:mt-0">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-black text-emerald-950">
            Log in to your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account role determines which customer or merchant workspace
            opens after login.
          </p>

          {location.state?.message ? (
            <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
              {location.state.message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg px-6 py-3 text-sm font-bold text-emerald-950 transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-lime-400 hover:bg-lime-300"
              }`}
            >
              {isSubmitting ? "Logging In..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-5">
            <p className="text-sm font-semibold text-slate-700">
              Create a new account
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                to="/register/customer"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                Customer
              </Link>
              <Link
                to="/register/merchant"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                Merchant
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

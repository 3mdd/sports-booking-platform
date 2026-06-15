import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import {
  AUTH_USER_UPDATED_EVENT,
  getAuthUser,
} from "../../utils/auth";

const platformFeatures = [
  {
    label: "Customers",
    title: "Book with clear availability",
    description:
      "Browse approved facilities, filter by sport and location, choose connected time slots, and track payment verification.",
  },
  {
    label: "Merchants",
    title: "Manage daily operations",
    description:
      "Maintain facilities and galleries, generate or block slots, verify payments, review bookings, and monitor performance.",
  },
  {
    label: "Administration",
    title: "Build platform trust",
    description:
      "Review merchant verification documents, approve business accounts, and manage users and facilities from one admin area.",
  },
  {
    label: "Review Insights",
    title: "Understand customer feedback",
    description:
      "Facility reviews include ratings and sentiment analysis, with practical summaries that help merchants identify improvements.",
  },
];

const customerSteps = [
  {
    number: "01",
    title: "Find a facility",
    description:
      "Search active facilities and narrow the list by sport, state, area, or name.",
  },
  {
    number: "02",
    title: "Choose date and duration",
    description:
      "Select a start time and an available duration built from connected 30-minute slots.",
  },
  {
    number: "03",
    title: "Complete the booking",
    description:
      "Confirm the reservation, follow the merchant payment details, and upload proof for verification.",
  },
];

function getSignedInAction(user) {
  if (user?.role === "ADMIN") {
    return { label: "Open Admin Dashboard", to: "/admin/dashboard" };
  }

  if (user?.role === "MERCHANT") {
    const isApproved =
      (user.merchantApprovalStatus || "APPROVED") === "APPROVED";

    return isApproved
      ? { label: "Open Merchant Dashboard", to: "/merchant/dashboard" }
      : { label: "View Approval Status", to: "/merchant/approval-status" };
  }

  if (user?.role === "CUSTOMER") {
    return { label: "Browse Facilities", to: "/facilities" };
  }

  return null;
}

function LandingPage() {
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const signedInAction = getSignedInAction(authUser);

  useEffect(() => {
    const refreshAuthUser = () => setAuthUser(getAuthUser());

    window.addEventListener("storage", refreshAuthUser);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, refreshAuthUser);

    return () => {
      window.removeEventListener("storage", refreshAuthUser);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, refreshAuthUser);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main>
        <section className="relative isolate min-h-[520px] overflow-hidden">
          <img
            src={padelImage}
            alt="Sports court prepared for facility booking"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-emerald-950/80" />

          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-6 py-16 lg:px-8">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">
                Multi-Vendor Sports Facility Booking
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Book, manage, and monitor sports facilities in one platform.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/90 sm:text-lg">
                EliteSport connects customers with approved facility
                merchants through live slot availability, payment proof
                verification, reviews, and operational tools.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {signedInAction ? (
                  <>
                    <Link
                      to={signedInAction.to}
                      className="rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
                    >
                      {signedInAction.label}
                    </Link>
                    <Link
                      to="/profile"
                      className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      View Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/facilities"
                      className="rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
                    >
                      Browse Facilities
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {!authUser ? (
          <section className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div>
                <h2 className="text-xl font-black text-emerald-950">
                  Create the account that fits your role
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Customers can book immediately. New merchants enter the
                  admin approval process before using merchant tools.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/register/customer"
                  className="rounded-lg border border-emerald-950 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
                >
                  Register Customer
                </Link>
                <Link
                  to="/register/merchant"
                  className="rounded-lg bg-emerald-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  Register Merchant
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Platform Workflows
            </p>
            <h2 className="mt-2 text-3xl font-black text-emerald-950">
              Useful tools for every side of a booking
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Each area below represents a working part of the current
              platform and supports a complete role-specific workflow.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {platformFeatures.map((feature) => (
              <article
                key={feature.label}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {feature.label}
                </p>
                <h3 className="mt-2 text-xl font-black text-emerald-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Customer Booking Flow
                </p>
                <h2 className="mt-2 text-3xl font-black text-emerald-950">
                  From search to merchant verification
                </h2>
              </div>
              <Link
                to="/facilities"
                className="w-fit rounded-lg bg-emerald-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
              >
                Browse Facilities
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {customerSteps.map((step) => (
                <article key={step.number} className="border-t-2 border-lime-400 pt-4">
                  <p className="text-sm font-black text-emerald-700">
                    {step.number}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-emerald-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;

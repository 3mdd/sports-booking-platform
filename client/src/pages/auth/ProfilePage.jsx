import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAuthUser, updateStoredUserName } from "../../utils/auth";

function getInitials(fullName) {
  const nameParts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length === 0) return "U";

  return nameParts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function ProfilePage() {
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const [displayName, setDisplayName] = useState(authUser?.fullName || "");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const roleLabel =
    authUser?.role === "ADMIN"
      ? "Admin"
      : authUser?.role === "MERCHANT"
      ? "Merchant"
      : "Customer";
  const profileId =
    authUser?.role === "MERCHANT"
      ? authUser.merchantProfileId
      : authUser?.role === "CUSTOMER"
      ? authUser.customerProfileId
      : null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!displayName.trim()) {
      setIsSuccess(false);
      setMessage("Display name cannot be empty.");
      return;
    }

    const updatedUser = updateStoredUserName(displayName);

    if (!updatedUser) {
      setIsSuccess(false);
      setMessage("Unable to update the local profile.");
      return;
    }

    setAuthUser(updatedUser);
    setDisplayName(updatedUser.fullName);
    setIsSuccess(true);
    setMessage("Display name updated for this local demo session.");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
            Profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review the account details currently used by the frontend session.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl bg-emerald-950 p-6 text-white shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lime-400 text-2xl font-black text-emerald-950 ring-4 ring-white/10">
              {getInitials(authUser?.fullName)}
            </div>
            <h2 className="mt-5 text-2xl font-black">
              {authUser?.fullName}
            </h2>
            <p className="mt-1 text-sm text-emerald-100/80">
              {authUser?.email}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-lime-300">
              {roleLabel}
            </span>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-black text-emerald-950">
              Account Details
            </h2>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                <dt className="text-slate-500">User ID</dt>
                <dd className="mt-1 font-bold text-slate-900">
                  #{authUser?.userId}
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
                <dt className="text-slate-500">Role</dt>
                <dd className="mt-1 font-bold text-slate-900">{roleLabel}</dd>
              </div>
              {profileId ? (
                <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200 sm:col-span-2">
                  <dt className="text-slate-500">
                    {roleLabel} Profile ID
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    #{profileId}
                  </dd>
                </div>
              ) : null}
            </dl>

            <form
              onSubmit={handleSubmit}
              className="mt-6 border-t border-gray-200 pt-5"
            >
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Display Name
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    setMessage("");
                  }}
                  maxLength="100"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-lime-400 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
                >
                  Save Name
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                This is a local demo profile update stored in this browser. It
                does not change the name in the backend database.
              </p>

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
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ProfilePage;

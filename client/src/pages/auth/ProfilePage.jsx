import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  getAuthUser,
  updateStoredAuthUser,
} from "../../utils/auth";
import { getUploadFileUrl } from "../../utils/uploadUrl";
import { getPhoneValidationError } from "../../utils/phoneValidation";

const API_BASE_URL = "http://localhost:5000";

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

function getRoleLabel(role) {
  if (role === "ADMIN") return "Admin";
  if (role === "MERCHANT") return "Merchant";
  return "Customer";
}

function getQuickLinks(role) {
  if (role === "ADMIN") {
    return [
      { label: "Admin Dashboard", to: "/admin/dashboard" },
      { label: "Manage Users", to: "/admin/users" },
      { label: "Manage Facilities", to: "/admin/facilities" },
    ];
  }

  if (role === "MERCHANT") {
    return [
      { label: "Merchant Dashboard", to: "/merchant/dashboard" },
      { label: "Payment Setup", to: "/merchant/payment-settings" },
      { label: "Approval Status", to: "/merchant/approval-status" },
    ];
  }

  return [
    { label: "Browse Facilities", to: "/facilities" },
    { label: "My Bookings", to: "/customer/bookings" },
  ];
}

function ProfileAvatar({ user, previewUrl, sizeClass = "h-24 w-24" }) {
  const imageUrl = previewUrl || getUploadFileUrl(user?.avatarUrl);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-400 font-black text-emerald-950 ring-4 ring-white/15 ${sizeClass}`}
    >
      <span className="text-2xl">{getInitials(user?.fullName)}</span>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${user?.fullName || "User"} avatar`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function ProfilePage() {
  const [authUser, setAuthUser] = useState(() => getAuthUser());
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    phoneNumber: authUser?.phoneNumber || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const syncProfile = (profile) => {
    const currentUser = getAuthUser();
    const updatedUser = updateStoredAuthUser({
      fullName: profile.fullName,
      username: profile.username,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      isActive: profile.isActive,
      customerProfileId:
        profile.customerProfile?.id ?? currentUser?.customerProfileId,
      merchantProfileId:
        profile.merchantProfile?.id ?? currentUser?.merchantProfileId,
      merchantApprovalStatus:
        profile.merchantProfile?.approvalStatus ??
        currentUser?.merchantApprovalStatus,
      merchantApprovalNote:
        profile.merchantProfile?.approvalNote ??
        currentUser?.merchantApprovalNote,
    });

    setAuthUser(updatedUser);
    setFormData({
      fullName: updatedUser?.fullName || "",
      phoneNumber: updatedUser?.phoneNumber || "",
    });
  };

  useEffect(() => {
    const userId = authUser?.userId;

    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/users/${userId}/profile`,
          {
            headers: {
              "x-user-id": String(userId),
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        syncProfile(data.user);
      } catch (error) {
        setNotice({ type: "error", message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [authUser?.userId]);

  useEffect(
    () => () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    },
    [avatarPreview]
  );

  const roleLabel = getRoleLabel(authUser?.role);
  const profileId =
    authUser?.role === "MERCHANT"
      ? authUser.merchantProfileId
      : authUser?.role === "CUSTOMER"
      ? authUser.customerProfileId
      : null;
  const quickLinks = getQuickLinks(authUser?.role);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: "", message: "" });

    if (!formData.fullName.trim()) {
      setNotice({ type: "error", message: "Full name cannot be empty." });
      return;
    }

    const normalizedPhoneNumber = formData.phoneNumber.trim();
    const phoneNumberError = getPhoneValidationError(normalizedPhoneNumber, {
      required: Boolean(authUser?.phoneNumber),
    });

    if (phoneNumberError) {
      setNotice({ type: "error", message: phoneNumberError });
      return;
    }

    setIsSaving(true);

    try {
      const updatePayload = {
        fullName: formData.fullName.trim(),
      };

      if (normalizedPhoneNumber) {
        updatePayload.phoneNumber = normalizedPhoneNumber;
      }

      const response = await fetch(
        `${API_BASE_URL}/users/${authUser.userId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": String(authUser.userId),
          },
          body: JSON.stringify(updatePayload),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      syncProfile(data.user);
      setNotice({ type: "success", message: data.message });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotice({
        type: "error",
        message: "Avatar image must be 5 MB or smaller.",
      });
      event.target.value = "";
      return;
    }

    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setNotice({ type: "", message: "" });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setNotice({ type: "error", message: "Please select an avatar image." });
      return;
    }

    setIsUploading(true);
    setNotice({ type: "", message: "" });

    try {
      const uploadData = new FormData();
      uploadData.append("avatar", avatarFile);

      const response = await fetch(
        `${API_BASE_URL}/users/${authUser.userId}/avatar`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": String(authUser.userId),
          },
          body: uploadData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to upload avatar.");
      }

      syncProfile(data.user);
      setAvatarFile(null);
      setAvatarPreview("");
      setNotice({ type: "success", message: data.message });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-xl bg-emerald-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProfileAvatar
              user={authUser}
              previewUrl={avatarPreview}
              sizeClass="h-24 w-24"
            />
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-lime-300">
                {roleLabel}
              </span>
              <h1 className="mt-3 truncate text-3xl font-black">
                {authUser?.fullName || "Your Profile"}
              </h1>
              <p className="mt-1 truncate text-sm text-emerald-100/75">
                {authUser?.username
                  ? `@${authUser.username}`
                  : authUser?.email}
              </p>
            </div>
            <div className="sm:text-right">
              <label
                htmlFor="avatar"
                className="inline-flex cursor-pointer rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold transition hover:bg-white/10"
              >
                Choose Avatar
              </label>
              <input
                id="avatar"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              {avatarFile ? (
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={isUploading}
                  className="ml-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? "Uploading..." : "Save Avatar"}
                </button>
              ) : null}
              <p className="mt-2 text-xs text-emerald-100/65">
                JPG, PNG or WEBP, up to 5 MB
              </p>
            </div>
          </div>
        </section>

        {notice.message ? (
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm font-medium ${
              notice.type === "success"
                ? "bg-lime-50 text-emerald-800 ring-1 ring-lime-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-emerald-950">
                  Edit Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These changes are saved to your account.
                </p>
              </div>
              {isLoading ? (
                <span className="text-xs font-semibold text-slate-400">
                  Loading...
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Full Name
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  maxLength="100"
                  required
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Phone Number
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  maxLength="50"
                  placeholder="e.g. 012-345 6789"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  Use at least 8 digits. Spaces, +, hyphens, and brackets are
                  allowed.
                </span>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Username
                <input
                  type="text"
                  value={authUser?.username || "Not set"}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-slate-500"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  value={authUser?.email || ""}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-slate-500"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Role
                <input
                  type="text"
                  value={roleLabel}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-slate-500"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="rounded-lg bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-lg font-black text-emerald-950">
                Account Details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">User ID</dt>
                  <dd className="font-bold text-slate-900">
                    #{authUser?.userId}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Account role</dt>
                  <dd className="font-bold text-slate-900">{roleLabel}</dd>
                </div>
                {profileId ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">{roleLabel} Profile ID</dt>
                    <dd className="font-bold text-slate-900">#{profileId}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-lg font-black text-emerald-950">
                Quick Links
              </h2>
              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-bold text-emerald-900 ring-1 ring-gray-200 transition hover:bg-lime-50 hover:ring-lime-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ProfilePage;

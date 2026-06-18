import { Fragment, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { authFetch } from "../../utils/api";

const PROTECTED_ADMIN_EMAIL = "admin@elitesport.test";

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || ""
  );
  const [roleFilter, setRoleFilter] = useState(
    () => searchParams.get("role") || "ALL"
  );
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "ALL"
  );
  const [userIdFilter, setUserIdFilter] = useState(
    () => searchParams.get("userId") || ""
  );
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (userIdFilter) params.set("userId", userIdFilter);

      const response = await authFetch(
        `http://localhost:5000/admin/users${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Fetch admin users error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchTerm, statusFilter, userIdFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setRoleFilter(searchParams.get("role") || "ALL");
    setStatusFilter(searchParams.get("status") || "ALL");
    setUserIdFilter(searchParams.get("userId") || "");
  }, [searchParams]);

  const updateUrlFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "ALL") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters =
    searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL" || userIdFilter;

  const handleStatusChange = async (user) => {
    const action = user.isActive ? "deactivate" : "activate";

    try {
      setProcessingUserId(user.userId);
      setMessage("");
      const response = await authFetch(
        `http://localhost:5000/admin/users/${user.userId}/${action}`,
        {
          method: "PATCH",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} user`);
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? { ...currentUser, ...data.user }
            : currentUser
        )
      );
      setIsSuccess(true);
      setMessage(data.message);
    } catch (error) {
      console.error("Update admin user status error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to update user status.");
    } finally {
      setProcessingUserId(null);
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
            User Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review account roles and control login access.
          </p>
        </section>

        <section className="mt-5 flex flex-wrap gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <select
            value={roleFilter}
            onChange={(event) =>
              updateUrlFilters({ role: event.target.value })
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="MERCHANT">Merchants</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              updateUrlFilters({ status: event.target.value })
            }
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              updateUrlFilters({ search: event.target.value })
            }
            placeholder="Search name, username, email, or phone"
            className="min-w-64 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-lime-400"
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-gray-50"
            >
              Clear Filters
            </button>
          ) : null}
          <span className="self-center text-sm font-semibold text-slate-500">
            {users.length} users
          </span>
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

        <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {isLoading ? (
            <p className="p-5 text-sm font-medium text-slate-500">
              Loading users...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const isProtected =
                      user.email === PROTECTED_ADMIN_EMAIL;

                    const isCustomer = user.role === "CUSTOMER";
                    const summary = user.activitySummary;
                    const isExpanded = expandedUserId === user.userId;

                    return (
                      <Fragment key={user.userId}>
                      <tr>
                        <td className="px-4 py-4">
                          <p className="font-bold text-emerald-950">
                            {user.fullName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            {user.username
                              ? `@${user.username}`
                              : "Username not set"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.phoneNumber || "No phone number"}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {user.role}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {user.businessName ||
                            (user.customerProfileId
                              ? `Customer #${user.customerProfileId}`
                              : "Platform account")}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              user.isActive
                                ? "bg-lime-100 text-emerald-800"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {isCustomer ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedUserId((currentId) =>
                                  currentId === user.userId
                                    ? null
                                    : user.userId
                                )
                              }
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                            >
                              {isExpanded ? "Hide Summary" : "View Summary"}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Not applicable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isProtected ? (
                            <span className="text-xs font-bold text-slate-500">
                              Protected Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(user)}
                              disabled={processingUserId === user.userId}
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
                                user.isActive
                                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                                  : "bg-lime-400 text-emerald-950 hover:bg-lime-300"
                              }`}
                            >
                              {processingUserId === user.userId
                                ? "Updating..."
                                : user.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isCustomer && isExpanded ? (
                        <tr key={`${user.userId}-summary`}>
                          <td
                            colSpan="7"
                            className="bg-emerald-50/50 px-4 py-4"
                          >
                            <div className="rounded-lg bg-white p-4 ring-1 ring-emerald-100">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-black text-emerald-950">
                                  Activity Summary
                                </p>
                                <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-gray-200">
                                  Account{" "}
                                  {user.accountStatus ||
                                    (user.isActive ? "ACTIVE" : "INACTIVE")}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Total Bookings
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {summary?.totalBookings || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Confirmed Bookings
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {summary?.confirmedBookings || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Pending / Uploaded
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {summary?.pendingOrPaymentUploadedBookings ||
                                      0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Rejected / Cancelled / Expired
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {summary?.rejectedCancelledExpiredBookings ||
                                      0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Confirmed Spend
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {formatCurrency(summary?.totalAmountSpent)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500">
                                    Last Booking
                                  </p>
                                  <p className="font-bold text-slate-900">
                                    {summary?.lastBookingDate
                                      ? formatDate(summary.lastBookingDate)
                                      : "No activity yet"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && users.length === 0 ? (
            <p className="p-5 text-sm font-medium text-slate-500">
              No matching users found.
            </p>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminUsersPage;

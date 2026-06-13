import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAuthUser } from "../../utils/auth";

const PROTECTED_ADMIN_EMAIL = "admin@elitesport.test";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminUsersPage() {
  const authUser = getAuthUser();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/admin/users", {
        headers: {
          "x-user-id": String(authUser?.userId || ""),
        },
      });
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
  }, [authUser?.userId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);
        return matchesRole && matchesStatus;
      }),
    [roleFilter, statusFilter, users]
  );

  const handleStatusChange = async (user) => {
    const action = user.isActive ? "deactivate" : "activate";

    try {
      setProcessingUserId(user.userId);
      setMessage("");
      const response = await fetch(
        `http://localhost:5000/admin/users/${user.userId}/${action}`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": String(authUser?.userId || ""),
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} user`);
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId ? data.user : currentUser
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
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="MERCHANT">Merchants</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <span className="self-center text-sm font-semibold text-slate-500">
            {filteredUsers.length} users
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
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const isProtected =
                      user.email === PROTECTED_ADMIN_EMAIL;

                    return (
                      <tr key={user.userId}>
                        <td className="px-4 py-4">
                          <p className="font-bold text-emerald-950">
                            {user.fullName}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminUsersPage;

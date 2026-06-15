import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { authFetch } from "../../utils/api";

function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [processingFacilityId, setProcessingFacilityId] = useState(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchFacilities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authFetch(
        "http://localhost:5000/admin/facilities"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load facilities");
      }

      setFacilities(data.facilities || []);
    } catch (error) {
      console.error("Fetch admin facilities error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to load facilities.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const filteredFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) =>
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE"
            ? facility.isActive
            : !facility.isActive)
      ),
    [facilities, statusFilter]
  );

  const handleStatusChange = async (facility) => {
    const action = facility.isActive ? "deactivate" : "activate";

    try {
      setProcessingFacilityId(facility.facilityId);
      setMessage("");
      const response = await authFetch(
        `http://localhost:5000/admin/facilities/${facility.facilityId}/${action}`,
        {
          method: "PATCH",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} facility`);
      }

      setFacilities((currentFacilities) =>
        currentFacilities.map((currentFacility) =>
          currentFacility.facilityId === facility.facilityId
            ? data.facility
            : currentFacility
        )
      );
      setIsSuccess(true);
      setMessage(data.message);
    } catch (error) {
      console.error("Update admin facility status error:", error);
      setIsSuccess(false);
      setMessage(error.message || "Unable to update facility status.");
    } finally {
      setProcessingFacilityId(null);
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
            Facility Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor facility ownership and control availability to customers.
          </p>
        </section>

        <section className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-lime-400"
          >
            <option value="ALL">All Facilities</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <span className="text-sm font-semibold text-slate-500">
            {filteredFacilities.length} facilities
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

        <section className="mt-5">
          {isLoading ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading facilities...
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredFacilities.map((facility) => (
                <article
                  key={facility.facilityId}
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                        {facility.sportType?.name || "Sports Facility"}
                      </p>
                      <h2 className="mt-2 text-xl font-black text-emerald-950">
                        {facility.name}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {facility.businessName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        facility.isActive
                          ? "bg-lime-100 text-emerald-800"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {facility.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                      <p className="text-xs font-semibold text-slate-500">
                        Location
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {[facility.areaName, facility.stateName]
                          .filter(Boolean)
                          .join(", ") || facility.location}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {facility.location}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200">
                      <p className="text-xs font-semibold text-slate-500">
                        Merchant Status
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {facility.merchantApprovalStatus.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Account{" "}
                        {facility.merchantUserActive ? "active" : "inactive"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs text-slate-500">
                      Facility #{facility.facilityId}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(facility)}
                      disabled={
                        processingFacilityId === facility.facilityId
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
                        facility.isActive
                          ? "border border-red-200 text-red-700 hover:bg-red-50"
                          : "bg-lime-400 text-emerald-950 hover:bg-lime-300"
                      }`}
                    >
                      {processingFacilityId === facility.facilityId
                        ? "Updating..."
                        : facility.isActive
                        ? "Deactivate Facility"
                        : "Activate Facility"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && filteredFacilities.length === 0 ? (
            <div className="rounded-xl bg-white p-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No facilities match this filter.
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdminFacilitiesPage;

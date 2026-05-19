import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const TEMP_MERCHANT_ID = 1;

const initialFormData = {
  sportTypeId: "",
  name: "",
  description: "",
  location: "",
  pricePerSlot: "",
};

// Temporary mapping until sport types are fetched from the backend.
const sportTypeOptions = [
  { id: 1, name: "Football" },
  { id: 2, name: "Badminton" },
  { id: 3, name: "Futsal" },
  { id: 4, name: "Padel" },
  { id: 5, name: "Volleyball" },
  { id: 6, name: "Basketball" },
];

function getFacilityPricePerHour(facility) {
  const pricePerSlot = Number(facility.pricePerSlot || 0);

  if (!pricePerSlot) {
    return "Price not set";
  }

  return `RM ${(pricePerSlot * 2).toFixed(2)} / hour`;
}

function getSportTypeName(sportTypeId) {
  const sportType = sportTypeOptions.find(
    (option) => option.id === Number(sportTypeId)
  );

  return sportType?.name || "Sport";
}

function MerchantFacilityManagementPage() {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  const fetchFacilities = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("http://localhost:5000/facilities");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch facilities");
      }

      setFacilities(data.facilities || []);
    } catch (error) {
      console.error("Fetch merchant facilities error:", error);
      setErrorMessage(
        error.message ||
          "Unable to load facilities. Please make sure the backend server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const hasMerchantOwnershipData = useMemo(() => {
    return facilities.some(
      (facility) =>
        facility.merchantProfileId !== undefined ||
        facility.merchantProfile?.id !== undefined
    );
  }, [facilities]);

  const merchantFacilities = useMemo(() => {
    if (!hasMerchantOwnershipData) {
      // GET /facilities may omit merchant ownership fields in some responses; show all until merchant filtering data is available.
      return facilities;
    }

    return facilities.filter((facility) => {
      const merchantId =
        facility.merchantProfileId || facility.merchantProfile?.id;

      return Number(merchantId) === TEMP_MERCHANT_ID;
    });
  }, [facilities, hasMerchantOwnershipData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleCreateFacility = async (event) => {
    event.preventDefault();

    if (
      !formData.sportTypeId ||
      !formData.name ||
      !formData.location ||
      !formData.pricePerSlot
    ) {
      setIsSubmitSuccess(false);
      setSubmitMessage(
        "Sport type ID, facility name, location, and price per slot are required."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setIsSubmitSuccess(false);
      setSubmitMessage("");

      const response = await fetch("http://localhost:5000/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantProfileId: TEMP_MERCHANT_ID,
          sportTypeId: Number(formData.sportTypeId),
          name: formData.name,
          description: formData.description || null,
          location: formData.location,
          pricePerSlot: Number(formData.pricePerSlot),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create facility");
      }

      setFormData(initialFormData);
      setIsSubmitSuccess(true);
      setSubmitMessage("Facility created successfully.");
      await fetchFacilities();
    } catch (error) {
      console.error("Create facility error:", error);
      setIsSubmitSuccess(false);
      setSubmitMessage(error.message || "Unable to create facility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Portal
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
              Facility Management
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Manage listed sports facilities, review their details, and create
              new venues for customer bookings.
            </p>
          </div>

          <Link
            to="/merchant/dashboard"
            className="rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Back to Dashboard
          </Link>
        </section>

        <section className="mb-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleCreateFacility}
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8"
          >
            <h2 className="text-2xl font-black text-emerald-950">
              Add Facility
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create a facility using the backend fields currently supported by
              the API.
            </p>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Facility Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  placeholder="e.g. Skyline Padel Court"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sport Type
                  </label>
                  <select
                    name="sportTypeId"
                    value={formData.sportTypeId}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  >
                    <option value="">Select sport type</option>
                    {sportTypeOptions.map((sportType) => (
                      <option key={sportType.id} value={sportType.id}>
                        {sportType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price Per 30-Min Slot
                  </label>
                  <input
                    name="pricePerSlot"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerSlot}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                    placeholder="35.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  placeholder="e.g. Kuala Lumpur"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  placeholder="Optional facility description"
                />
              </div>
            </div>

            {submitMessage ? (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                  isSubmitSuccess
                    ? "border border-lime-200 bg-lime-50 text-emerald-800"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 w-full rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isSubmitting ? "Creating Facility..." : "Create Facility"}
            </button>
          </form>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Listed Facilities
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Facilities connected to merchant #{TEMP_MERCHANT_ID}.
                </p>
              </div>

              <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                {merchantFacilities.length} facilities
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                Loading facilities...
              </div>
            ) : null}

            {!isLoading && errorMessage ? (
              <div className="rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !errorMessage && merchantFacilities.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                No facilities found for this merchant yet.
              </div>
            ) : null}

            {!isLoading && !errorMessage && merchantFacilities.length > 0 ? (
              <div className="space-y-4">
                {merchantFacilities.map((facility) => (
                  <article
                    key={facility.id}
                    className="rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                          {facility.sportType?.name ||
                            getSportTypeName(facility.sportTypeId)}
                        </p>
                        <h3 className="mt-2 text-xl font-black text-emerald-950">
                          {facility.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {facility.location || "Location not set"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          facility.isActive
                            ? "bg-lime-100 text-emerald-950"
                            : "bg-gray-200 text-slate-600"
                        }`}
                      >
                        {facility.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-slate-500">Price</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {getFacilityPricePerHour(facility)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">30-Min Slot</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          RM {Number(facility.pricePerSlot || 0).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Facility ID</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          #{facility.id}
                        </p>
                      </div>
                    </div>

                    {facility.description ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {facility.description}
                      </p>
                    ) : null}

                    <div className="mt-5 border-t border-gray-200 pt-5">
                      <Link
                        to={`/merchant/facilities/${facility.id}/slots`}
                        className="inline-flex rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                      >
                        Manage Slots
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default MerchantFacilityManagementPage;

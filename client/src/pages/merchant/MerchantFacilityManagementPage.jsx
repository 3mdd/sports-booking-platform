import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  getAreasByState,
  getStates,
} from "../../data/malaysiaLocations";
import { getUploadFileUrl } from "../../utils/uploadUrl";
import { getMerchantProfileId } from "../../utils/auth";

const malaysiaStates = getStates();

const initialFormData = {
  sportTypeId: "",
  name: "",
  description: "",
  stateName: "",
  areaName: "",
  location: "",
  pricePerSlot: "",
};

const initialEditFormData = {
  sportTypeId: "",
  name: "",
  description: "",
  stateName: "",
  areaName: "",
  location: "",
  pricePerSlot: "",
  isActive: true,
};

function getFacilityPricePerHour(facility) {
  const pricePerSlot = Number(facility.pricePerSlot || 0);

  if (!pricePerSlot) {
    return "Price not set";
  }

  return `RM ${(pricePerSlot * 2).toFixed(2)} / hour`;
}

function getFacilityPhotoUrl(facility) {
  return getUploadFileUrl(facility.images?.[0]?.imageUrl);
}

function MerchantFacilityManagementPage() {
  const merchantProfileId = getMerchantProfileId();
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sportTypes, setSportTypes] = useState([]);
  const [isSportTypesLoading, setIsSportTypesLoading] = useState(true);
  const [sportTypesError, setSportTypesError] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState(null);
  const [editFormData, setEditFormData] = useState(initialEditFormData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [isEditSuccess, setIsEditSuccess] = useState(false);
  const [uploadingPhotoFacilityId, setUploadingPhotoFacilityId] =
    useState(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState({
    facilityId: null,
    message: "",
    isSuccess: false,
  });
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState({});

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

  const fetchSportTypes = async () => {
    try {
      setIsSportTypesLoading(true);
      setSportTypesError("");

      const response = await fetch("http://localhost:5000/facilities/sport-types");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sport types");
      }

      setSportTypes(data.sportTypes || []);
    } catch (error) {
      console.error("Fetch sport types error:", error);
      setSportTypesError(
        error.message ||
          "Unable to load sport types. Please make sure the backend server is running."
      );
    } finally {
      setIsSportTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchSportTypes();
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

      return Number(merchantId) === merchantProfileId;
    });
  }, [facilities, hasMerchantOwnershipData, merchantProfileId]);

  const getSportTypeName = (sportTypeId) => {
    const sportType = sportTypes.find(
      (option) => option.id === Number(sportTypeId)
    );

    return sportType?.name || "Sport";
  };

  const isSportTypeSelectDisabled =
    isSportTypesLoading || Boolean(sportTypesError) || sportTypes.length === 0;

  const addAreaOptions = useMemo(
    () => getAreasByState(formData.stateName),
    [formData.stateName]
  );

  const editAreaOptions = useMemo(
    () => getAreasByState(editFormData.stateName),
    [editFormData.stateName]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => {
      if (name === "stateName") {
        return {
          ...currentFormData,
          stateName: value,
          areaName: "",
        };
      }

      return {
        ...currentFormData,
        [name]: value,
      };
    });
  };

  const handleEditInputChange = (event) => {
    const { checked, name, type, value } = event.target;

    setEditFormData((currentFormData) => {
      if (name === "stateName") {
        return {
          ...currentFormData,
          stateName: value,
          areaName: "",
        };
      }

      return {
        ...currentFormData,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const handlePhotoInputChange = (event, facilityId) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPhotoPreviewUrls((currentPreviewUrls) => ({
        ...currentPreviewUrls,
        [facilityId]: "",
      }));
      return;
    }

    setPhotoPreviewUrls((currentPreviewUrls) => ({
      ...currentPreviewUrls,
      [facilityId]: URL.createObjectURL(file),
    }));
  };

  const handleStartEdit = (facility) => {
    setEditingFacilityId(facility.id);
    setEditMessage("");
    setIsEditSuccess(false);
    setEditFormData({
      sportTypeId: String(facility.sportTypeId || facility.sportType?.id || ""),
      name: facility.name || "",
      description: facility.description || "",
      stateName: facility.stateName || "",
      areaName: facility.areaName || "",
      location: facility.location || "",
      pricePerSlot: facility.pricePerSlot
        ? String(facility.pricePerSlot)
        : "",
      isActive: Boolean(facility.isActive),
    });
  };

  const handleCancelEdit = () => {
    setEditingFacilityId(null);
    setEditFormData(initialEditFormData);
    setEditMessage("");
    setIsEditSuccess(false);
  };

  const handleCreateFacility = async (event) => {
    event.preventDefault();

    if (isSportTypeSelectDisabled) {
      setIsSubmitSuccess(false);
      setSubmitMessage("Sport types must be loaded before creating a facility.");
      return;
    }

    if (
      !formData.sportTypeId ||
      !formData.name ||
      !formData.location ||
      !formData.pricePerSlot
    ) {
      setIsSubmitSuccess(false);
      setSubmitMessage(
        "Sport type, facility name, location, and price per slot are required."
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
          merchantProfileId,
          sportTypeId: Number(formData.sportTypeId),
          name: formData.name,
          description: formData.description || null,
          stateName: formData.stateName || null,
          areaName: formData.areaName || null,
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

  const handleUpdateFacility = async (event) => {
    event.preventDefault();

    if (isSportTypeSelectDisabled) {
      setIsEditSuccess(false);
      setEditMessage("Sport types must be loaded before updating a facility.");
      return;
    }

    if (
      !editFormData.sportTypeId ||
      !editFormData.name.trim() ||
      !editFormData.location.trim() ||
      !editFormData.pricePerSlot
    ) {
      setIsEditSuccess(false);
      setEditMessage(
        "Sport type, facility name, location, and price per slot are required."
      );
      return;
    }

    const parsedPricePerSlot = Number(editFormData.pricePerSlot);

    if (!Number.isFinite(parsedPricePerSlot) || parsedPricePerSlot <= 0) {
      setIsEditSuccess(false);
      setEditMessage("Price per slot must be a positive number.");
      return;
    }

    try {
      setIsUpdating(true);
      setIsEditSuccess(false);
      setEditMessage("");

      const response = await fetch(
        `http://localhost:5000/facilities/${editingFacilityId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sportTypeId: Number(editFormData.sportTypeId),
            name: editFormData.name.trim(),
            description: editFormData.description.trim() || null,
            stateName: editFormData.stateName || null,
            areaName: editFormData.areaName || null,
            location: editFormData.location.trim(),
            pricePerSlot: parsedPricePerSlot,
            isActive: editFormData.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update facility");
      }

      setIsEditSuccess(true);
      setEditMessage("Facility updated successfully.");
      await fetchFacilities();
    } catch (error) {
      console.error("Update facility error:", error);
      setIsEditSuccess(false);
      setEditMessage(error.message || "Unable to update facility.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFacilityPhotoUpload = async (event, facilityId) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const selectedFile = formElement.facilityPhoto.files?.[0];

    if (!selectedFile) {
      setPhotoUploadStatus({
        facilityId,
        message: "Please choose a facility photo before uploading.",
        isSuccess: false,
      });
      return;
    }

    try {
      setUploadingPhotoFacilityId(facilityId);
      setPhotoUploadStatus({
        facilityId,
        message: "",
        isSuccess: false,
      });

      const uploadFormData = new FormData();
      uploadFormData.append("facilityPhoto", selectedFile);

      const response = await fetch(
        `http://localhost:5000/facilities/${facilityId}/photo`,
        {
          method: "PATCH",
          body: uploadFormData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload facility photo");
      }

      setPhotoUploadStatus({
        facilityId,
        message: "Facility photo uploaded successfully.",
        isSuccess: true,
      });
      setPhotoPreviewUrls((currentPreviewUrls) => ({
        ...currentPreviewUrls,
        [facilityId]: "",
      }));
      formElement.reset();
      await fetchFacilities();
    } catch (error) {
      console.error("Upload facility photo error:", error);
      setPhotoUploadStatus({
        facilityId,
        message: error.message || "Unable to upload facility photo.",
        isSuccess: false,
      });
    } finally {
      setUploadingPhotoFacilityId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Merchant Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Facility Management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Manage listed sports facilities, review their details, and create
              new venues for customer bookings.
            </p>
          </div>

          <Link
            to="/merchant/dashboard"
            className="rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Back to Dashboard
          </Link>
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={handleCreateFacility}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6"
          >
            <h2 className="text-2xl font-black text-emerald-950">
              Add Facility
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create a facility using the backend fields currently supported by
              the API.
            </p>

            {isSportTypesLoading ? (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-slate-500">
                Loading sport types...
              </div>
            ) : null}

            {!isSportTypesLoading && sportTypesError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {sportTypesError}
              </div>
            ) : null}

            {!isSportTypesLoading &&
            !sportTypesError &&
            sportTypes.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                No sport types found. Seed the database before creating a
                facility.
              </div>
            ) : null}

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
                    disabled={isSportTypeSelectDisabled}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <option value="">Select sport type</option>
                    {sportTypes.map((sportType) => (
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    State
                  </label>
                  <select
                    name="stateName"
                    value={formData.stateName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  >
                    <option value="">Select state (optional)</option>
                    {malaysiaStates.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Area
                  </label>
                  <select
                    name="areaName"
                    value={formData.areaName}
                    onChange={handleInputChange}
                    disabled={!formData.stateName}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <option value="">
                      {formData.stateName
                        ? "Select area (optional)"
                        : "Select a state first"}
                    </option>
                    {addAreaOptions.map((areaName) => (
                      <option key={areaName} value={areaName}>
                        {areaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address / Location Details
                </label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  placeholder="e.g. Lot 12, Jalan Stadium"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
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
              disabled={isSubmitting || isSportTypeSelectDisabled}
              className={`mt-5 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition ${
                isSubmitting || isSportTypeSelectDisabled
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isSubmitting ? "Creating Facility..." : "Create Facility"}
            </button>
          </form>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Listed Facilities
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Manage facility details, photos, availability, and slots.
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
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
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
                        {facility.areaName || facility.stateName ? (
                          <p className="mt-1 text-sm font-semibold text-emerald-800">
                            {[facility.areaName, facility.stateName]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        ) : null}
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

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
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

                    <div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-gray-200">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        {photoPreviewUrls[facility.id] ||
                        getFacilityPhotoUrl(facility) ? (
                          <img
                            src={
                              photoPreviewUrls[facility.id] ||
                              getFacilityPhotoUrl(facility)
                            }
                            alt={`${facility.name} preview`}
                            className="h-24 w-full rounded-lg object-cover ring-1 ring-gray-200 md:w-36"
                          />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-100 px-4 text-center text-sm font-medium text-slate-500 ring-1 ring-gray-200 md:w-36">
                            No facility photo uploaded
                          </div>
                        )}

                        <form
                          onSubmit={(event) =>
                            handleFacilityPhotoUpload(event, facility.id)
                          }
                          className="flex-1"
                        >
                          <h4 className="text-sm font-black text-emerald-950">
                            Facility Photo
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Upload one main photo for customer browse and
                            details pages. JPG, PNG, and WEBP are supported.
                          </p>

                          <input
                            name="facilityPhoto"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              handlePhotoInputChange(event, facility.id)
                            }
                            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-lime-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-emerald-950 focus:border-lime-400 focus:bg-white"
                          />

                          {photoUploadStatus.facilityId === facility.id &&
                          photoUploadStatus.message ? (
                            <div
                              className={`mt-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                                photoUploadStatus.isSuccess
                                  ? "border border-lime-200 bg-lime-50 text-emerald-800"
                                  : "border border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {photoUploadStatus.message}
                            </div>
                          ) : null}

                          <button
                            type="submit"
                            disabled={uploadingPhotoFacilityId === facility.id}
                            className={`mt-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                              uploadingPhotoFacilityId === facility.id
                                ? "cursor-not-allowed bg-slate-400"
                                : "bg-emerald-950 hover:bg-emerald-900"
                            }`}
                          >
                            {uploadingPhotoFacilityId === facility.id
                              ? "Uploading..."
                              : "Upload Photo"}
                          </button>
                        </form>
                      </div>
                    </div>

                    {editingFacilityId === facility.id ? (
                      <form
                        onSubmit={handleUpdateFacility}
                        className="mt-4 rounded-lg bg-white p-4 ring-1 ring-gray-200"
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div>
                            <h4 className="text-base font-black text-emerald-950">
                              Edit Facility Details
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Update the facility details shown to customers.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="w-fit rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>

                        {isSportTypesLoading ? (
                          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-slate-500">
                            Loading sport types...
                          </div>
                        ) : null}

                        {!isSportTypesLoading && sportTypesError ? (
                          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {sportTypesError}
                          </div>
                        ) : null}

                        <div className="mt-5 grid gap-4">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Facility Name
                            </label>
                            <input
                              name="name"
                              type="text"
                              value={editFormData.name}
                              onChange={handleEditInputChange}
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
                                value={editFormData.sportTypeId}
                                onChange={handleEditInputChange}
                                disabled={isSportTypeSelectDisabled}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                              >
                                <option value="">Select sport type</option>
                                {sportTypes.map((sportType) => (
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
                                min="0.01"
                                step="0.01"
                                value={editFormData.pricePerSlot}
                                onChange={handleEditInputChange}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                                placeholder="35.00"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                State
                              </label>
                              <select
                                name="stateName"
                                value={editFormData.stateName}
                                onChange={handleEditInputChange}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                              >
                                <option value="">Select state (optional)</option>
                                {malaysiaStates.map((stateName) => (
                                  <option key={stateName} value={stateName}>
                                    {stateName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Area
                              </label>
                              <select
                                name="areaName"
                                value={editFormData.areaName}
                                onChange={handleEditInputChange}
                                disabled={!editFormData.stateName}
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                              >
                                <option value="">
                                  {editFormData.stateName
                                    ? "Select area (optional)"
                                    : "Select a state first"}
                                </option>
                                {editAreaOptions.map((areaName) => (
                                  <option key={areaName} value={areaName}>
                                    {areaName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Address / Location Details
                            </label>
                            <input
                              name="location"
                              type="text"
                              value={editFormData.location}
                              onChange={handleEditInputChange}
                              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                              placeholder="e.g. Lot 12, Jalan Stadium"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Description
                            </label>
                            <textarea
                              name="description"
                              rows="3"
                              value={editFormData.description}
                              onChange={handleEditInputChange}
                              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                              placeholder="Optional facility description"
                            />
                          </div>

                          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-700">
                            <input
                              name="isActive"
                              type="checkbox"
                              checked={editFormData.isActive}
                              onChange={handleEditInputChange}
                              className="h-4 w-4 accent-emerald-950"
                            />
                            Active facility
                          </label>
                        </div>

                        {editMessage ? (
                          <div
                            className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                              isEditSuccess
                                ? "border border-lime-200 bg-lime-50 text-emerald-800"
                                : "border border-red-200 bg-red-50 text-red-700"
                            }`}
                          >
                            {editMessage}
                          </div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={isUpdating || isSportTypeSelectDisabled}
                          className={`mt-5 w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${
                            isUpdating || isSportTypeSelectDisabled
                              ? "cursor-not-allowed bg-slate-400"
                              : "bg-emerald-950 hover:bg-emerald-900"
                          }`}
                        >
                          {isUpdating ? "Saving Changes..." : "Save Changes"}
                        </button>
                      </form>
                    ) : null}

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(facility)}
                          disabled={isUpdating && editingFacilityId === facility.id}
                          className="inline-flex rounded-lg border border-emerald-950 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-slate-400"
                        >
                          Edit
                        </button>

                        <Link
                          to={`/merchant/facilities/${facility.id}/slots`}
                          className="inline-flex rounded-lg bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                        >
                          Manage Slots
                        </Link>
                      </div>
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

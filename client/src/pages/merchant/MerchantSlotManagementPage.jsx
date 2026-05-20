import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const initialSlotForm = {
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  startTime: "",
  endTime: "",
};

const DUPLICATE_SLOT_MESSAGE =
  "This time slot already exists for this facility and date.";

function getTodayDate() {
  const currentDate = new Date();

  return `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
}

function getMaxBulkDate() {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(maxDate.getDate()).padStart(2, "0")}`;
}

function parseDateInput(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  return date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function timeToMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function buildThirtyMinuteSlots(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const generatedSlots = [];

  for (let current = startMinutes; current < endMinutes; current += 30) {
    generatedSlots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + 30),
    });
  }

  return generatedSlots;
}

function buildDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = parseDateInput(startDate);
  const finalDate = parseDateInput(endDate);

  while (currentDate <= finalDate) {
    dates.push(formatDateInput(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function MerchantSlotManagementPage() {
  const { facilityId } = useParams();

  const [facility, setFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [slots, setSlots] = useState([]);
  const [isFacilityLoading, setIsFacilityLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [slotForm, setSlotForm] = useState(initialSlotForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [failureDetails, setFailureDetails] = useState([]);
  const todayDate = getTodayDate();
  const maxBulkDate = getMaxBulkDate();

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setIsFacilityLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `http://localhost:5000/facilities/${facilityId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch facility");
        }

        setFacility(data.facility || null);
      } catch (error) {
        console.error("Fetch facility error:", error);
        setErrorMessage(
          error.message ||
            "Unable to load facility details. Please make sure the backend server is running."
        );
      } finally {
        setIsFacilityLoading(false);
      }
    };

    fetchFacility();
  }, [facilityId]);

  const fetchSlots = useCallback(async () => {
    if (!facilityId || !selectedDate) {
      setSlots([]);
      return;
    }

    try {
      setIsSlotsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `http://localhost:5000/facilities/slots/by-date?facilityId=${facilityId}&date=${selectedDate}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch time slots");
      }

      setSlots(data.slots || []);
    } catch (error) {
      console.error("Fetch slots error:", error);
      setSlots([]);
      setErrorMessage(
        error.message ||
          "Unable to load time slots. Please make sure the backend server is running."
      );
    } finally {
      setIsSlotsLoading(false);
    }
  }, [facilityId, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const slotStats = useMemo(() => {
    return {
      total: slots.length,
      booked: slots.filter((slot) => slot.isBooked).length,
      available: slots.filter((slot) => !slot.isBooked).length,
    };
  }, [slots]);

  const handleSlotFormChange = (event) => {
    const { name, value } = event.target;

    setSlotForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleGenerateSlots = async (event) => {
    event.preventDefault();

    if (
      !slotForm.startDate ||
      !slotForm.endDate ||
      !slotForm.startTime ||
      !slotForm.endTime
    ) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage(
        "Start date, end date, start time, and end time are required."
      );
      return;
    }

    if (parseDateInput(slotForm.startDate) < parseDateInput(todayDate)) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage("Start date cannot be in the past.");
      return;
    }

    if (parseDateInput(slotForm.endDate) > parseDateInput(maxBulkDate)) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage("End date cannot be more than 14 days ahead.");
      return;
    }

    if (parseDateInput(slotForm.endDate) < parseDateInput(slotForm.startDate)) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage("End date cannot be before start date.");
      return;
    }

    if (slotForm.startTime >= slotForm.endTime) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage(
        "After-midnight slot generation will be supported in a future enhancement."
      );
      return;
    }

    const startMinutes = timeToMinutes(slotForm.startTime);
    const endMinutes = timeToMinutes(slotForm.endTime);
    const totalMinutes = endMinutes - startMinutes;

    if (totalMinutes % 30 !== 0) {
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage(
        "Time range must divide evenly into 30-minute slots."
      );
      return;
    }

    const generatedSlots = buildThirtyMinuteSlots(
      slotForm.startTime,
      slotForm.endTime
    );
    const generatedDates = buildDateRange(slotForm.startDate, slotForm.endDate);

    try {
      setIsSubmitting(true);
      setIsSubmitSuccess(false);
      setSubmitMessage("");
      setFailureDetails([]);

      const failures = [];
      let duplicateCount = 0;
      let createdCount = 0;

      for (const generatedDate of generatedDates) {
        for (const generatedSlot of generatedSlots) {
          try {
            const response = await fetch(
              "http://localhost:5000/facilities/slots",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  facilityId: Number(facilityId),
                  date: generatedDate,
                  startTime: generatedSlot.startTime,
                  endTime: generatedSlot.endTime,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to create slot");
            }

            createdCount += Number(data.totalCreated || 0);
          } catch (error) {
            const errorMessage = error.message || "Failed";
            const isDuplicate = errorMessage === DUPLICATE_SLOT_MESSAGE;

            if (isDuplicate) {
              duplicateCount += 1;
            } else {
              failures.push(
                `${generatedDate} ${generatedSlot.startTime} - ${generatedSlot.endTime}: ${errorMessage}`
              );
            }
          }
        }
      }

      setFailureDetails(failures);

      if (createdCount === 0 && duplicateCount > 0 && failures.length === 0) {
        setIsSubmitSuccess(false);
        setSubmitMessage(
          "No new slots were created. All selected slots already exist."
        );
      } else if (createdCount > 0 && duplicateCount > 0 && failures.length === 0) {
        setIsSubmitSuccess(true);
        setSubmitMessage(
          `${createdCount} slots created. ${duplicateCount} selected slots already existed and were skipped.`
        );
      } else if (failures.length > 0) {
        setIsSubmitSuccess(false);
        setSubmitMessage(
          `${createdCount} slot(s) created. ${failures.length} slot request(s) failed.`
        );
      } else {
        setSlotForm(initialSlotForm);
        setIsSubmitSuccess(true);
        setSubmitMessage(
          `${createdCount} 30-minute slot(s) generated successfully.`
        );
      }

      await fetchSlots();
    } catch (error) {
      console.error("Create slots error:", error);
      setIsSubmitSuccess(false);
      setFailureDetails([]);
      setSubmitMessage(error.message || "Unable to create time slots.");
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
              Slot Management
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Create 30-minute booking slots and review daily slot availability
              for a facility.
            </p>
          </div>

          <Link
            to="/merchant/facilities"
            className="rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300"
          >
            Back to Facilities
          </Link>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">Facility</p>
            <p className="mt-3 text-2xl font-black text-emerald-950">
              {isFacilityLoading
                ? "Loading facility..."
                : facility?.name || `Facility #${facilityId}`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {facility?.location || "Location not available"}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Available Slots
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {slotStats.available}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Booked Slots
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {slotStats.booked}
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={handleGenerateSlots}
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8"
          >
            <h2 className="text-2xl font-black text-emerald-950">
              Bulk Generate Slots
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose a date range and daily hours. The system will create
              connected 30-minute slots for each date.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    min={todayDate}
                    max={maxBulkDate}
                    value={slotForm.startDate}
                    onChange={handleSlotFormChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Date
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    min={todayDate}
                    max={maxBulkDate}
                    value={slotForm.endDate}
                    onChange={handleSlotFormChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Time
                  </label>
                  <input
                    name="startTime"
                    type="time"
                    value={slotForm.startTime}
                    onChange={handleSlotFormChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Time
                  </label>
                  <input
                    name="endTime"
                    type="time"
                    value={slotForm.endTime}
                    onChange={handleSlotFormChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
                  />
                </div>
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
                <p>{submitMessage}</p>

                {failureDetails.length > 0 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer font-semibold">
                      View failed slot details
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {failureDetails.map((failure) => (
                        <li key={failure}>{failure}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
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
              {isSubmitting
                ? "Generating Slots..."
                : "Generate Slots for Date Range"}
            </button>
          </form>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Slots for Selected Date
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Viewing slots for {selectedDate || "no date selected"}.
                </p>
              </div>

              <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                {slotStats.total} slots
              </span>
            </div>

            <div className="mb-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                View Slots Date
              </label>
              <input
                type="date"
                min={todayDate}
                max={maxBulkDate}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSubmitMessage("");
                  setFailureDetails([]);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-400"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
                {errorMessage}
              </div>
            ) : null}

            {isSlotsLoading ? (
              <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                Loading time slots...
              </div>
            ) : null}

            {!isSlotsLoading && !errorMessage && slots.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                No slots found for this facility and date.
              </div>
            ) : null}

            {!isSlotsLoading && !errorMessage && slots.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => (
                  <article
                    key={slot.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Slot #{slot.id}
                        </p>
                        <p className="mt-2 text-lg font-black text-emerald-950">
                          {formatTime(slot.startTime)}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          to {formatTime(slot.endTime)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          slot.isBooked
                            ? "bg-amber-100 text-amber-700"
                            : "bg-lime-100 text-emerald-950"
                        }`}
                      >
                        {slot.isBooked ? "Booked" : "Available"}
                      </span>
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

export default MerchantSlotManagementPage;

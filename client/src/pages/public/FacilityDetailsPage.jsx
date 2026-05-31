import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";
import { formatDisplayTimeRange } from "../../utils/timeFormat";

const fallbackImages = {
  Football:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  Futsal:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  Padel: padelImage,
  Badminton: badmintonImage,
  Default:
    "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80",
};

const durationOptions = [
  { label: "1 Hour", value: "1", slotCount: 2 },
  { label: "1.5 Hours", value: "1.5", slotCount: 3 },
  { label: "2 Hours", value: "2", slotCount: 4 },
  { label: "2.5 Hours", value: "2.5", slotCount: 5 },
  { label: "3 Hours", value: "3", slotCount: 6 },
];

function formatSlotValue(dateValue) {
  const date = new Date(dateValue);

  return date.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSlotLabel(slot) {
  return `${formatSlotValue(slot.startTime)} - ${formatSlotValue(
    slot.endTime
  )}`;
}

function buildSlotStartDateTime(selectedDate, slotLabel) {
  if (!selectedDate) return null;

  const [year, month, day] = selectedDate.split("-").map(Number);
  const startTime = slotLabel.split(" - ")[0];
  const [hour, minute] = startTime.split(":").map(Number);

  const date = new Date(year, month - 1, day, hour, minute);

  // after midnight → treat as next day
  if (hour >= 0 && hour < 6) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function buildDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildLocalDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getBookingDateError(dateValue, todayDate, maxBookingDateValue) {
  if (!dateValue) return "";

  if (buildLocalDate(dateValue) < buildLocalDate(todayDate)) {
    return "Past dates are not allowed. Please choose today or a future date.";
  }

  if (buildLocalDate(dateValue) > buildLocalDate(maxBookingDateValue)) {
    return "Bookings are only available up to 14 days in advance. Please choose an earlier date.";
  }

  return "";
}

function FacilityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slotError, setSlotError] = useState("");

  const currentDate = new Date();
  const todayDate = buildDateInputValue(currentDate);
  const maxBookingDate = new Date(currentDate);
  maxBookingDate.setDate(maxBookingDate.getDate() + 14);
  const maxBookingDateValue = buildDateInputValue(maxBookingDate);
  const selectedDateError = getBookingDateError(
    selectedDate,
    todayDate,
    maxBookingDateValue
  );

  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`http://localhost:5000/facilities/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch facility details");
        }

        const data = await response.json();
        setFacility(data.facility || null);
      } catch (error) {
        console.error("Fetch facility details error:", error);
        setErrorMessage(
          "Unable to load facility details. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilityDetails();
  }, [id]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !facility?.id) {
        setAvailableSlots([]);
        setSlotsMessage("");
        return;
      }

      if (selectedDateError) {
        setAvailableSlots([]);
        setSlotsMessage("");
        return;
      }

      if (!facility.isActive) {
        setAvailableSlots([]);
        setSlotsMessage(
          "This facility is currently inactive and cannot be booked."
        );
        return;
      }

      try {
        setIsSlotsLoading(true);
        setSlotsMessage("");
        setSlotError("");

        const response = await fetch(
          `http://localhost:5000/facilities/slots/by-date?facilityId=${facility.id}&date=${selectedDate}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch facility slots");
        }

        const data = await response.json();
        const formattedSlots = (data.slots || []).map((slot) => ({
          ...slot,
          label: formatSlotLabel(slot),
          displayLabel: formatDisplayTimeRange(slot.startTime, slot.endTime),
        }));

        setAvailableSlots(formattedSlots);

        if (formattedSlots.length === 0) {
          setSlotsMessage("No time slots found for this date.");
        }
      } catch (error) {
        console.error("Fetch facility slots error:", error);
        setAvailableSlots([]);
        setSlotsMessage(
          "Unable to load time slots. Please make sure slots are created for this facility and date."
        );
      } finally {
        setIsSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedDateError, facility]);

  const currentTimePlusTwoHours = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }, []);

  const isTodaySelected = selectedDate === todayDate;

  const sportName = facility?.sportType?.name || "Sport";

  const facilityImage = useMemo(() => {
    const firstImage = facility?.images?.[0]?.imageUrl;

    if (firstImage) {
      return firstImage;
    }

    return fallbackImages[sportName] || fallbackImages.Default;
  }, [facility, sportName]);

  const pricePerSlot = Number(facility?.pricePerSlot || 0);
  const pricePerHour = pricePerSlot * 2;
  const isFacilityInactive = facility ? !facility.isActive : false;

  const handleDateChange = (event) => {
    const chosenDate = event.target.value;
    const dateError = getBookingDateError(
      chosenDate,
      todayDate,
      maxBookingDateValue
    );

    setSelectedDate(chosenDate);
    setSelectedSlots([]);

    if (dateError) {
      setSlotError(dateError);
      setAvailableSlots([]);
      setSlotsMessage("");
      return;
    }

    setSlotError("");
  };

  const handleDurationChange = (event) => {
    const chosenDuration = durationOptions.find(
      (option) => option.value === event.target.value
    );

    setSelectedDuration(chosenDuration);
    setSelectedSlots([]);
    setSlotError("");
  };

  const isSlotBooked = (slot) => {
    if (!selectedDate) return false;

    return Boolean(slot.isBooked);
  };

  const isSlotBlocked = (slot) => {
    if (!selectedDate) return false;

    return Boolean(slot.isBlocked);
  };

  const isSlotDisabled = (slot) => {
    if (isSlotBooked(slot)) return true;
    if (isSlotBlocked(slot)) return true;

    if (!isTodaySelected || !selectedDate) return false;

    const slotDateTime = buildSlotStartDateTime(selectedDate, slot.label);

    return slotDateTime < currentTimePlusTwoHours;
  };

  const handleSlotSelection = (clickedSlot) => {
    if (!selectedDate) {
      setSlotError("Please select a booking date before choosing a slot.");
      return;
    }

    if (isSlotDisabled(clickedSlot)) {
      setSlotError(
        "The selected booking duration includes unavailable slot(s). Please choose another starting time."
      );
      setSelectedSlots([]);
      return;
    }

    const startIndex = availableSlots.findIndex(
      (slot) => slot.id === clickedSlot.id
    );
    const endIndex = startIndex + selectedDuration.slotCount;
    const connectedSlots = availableSlots.slice(startIndex, endIndex);

    if (connectedSlots.length < selectedDuration.slotCount) {
      setSlotError(
        `Not enough connected slots available for ${selectedDuration.label}. Please choose an earlier start time.`
      );
      setSelectedSlots([]);
      return;
    }

    const hasDisabledConnectedSlot = connectedSlots.some((slot) =>
      isSlotDisabled(slot)
    );

    if (hasDisabledConnectedSlot) {
      setSlotError(
        "The selected booking duration includes slot(s) that are unavailable or no longer allowed due to the 2-hour advance booking rule."
      );
      setSelectedSlots([]);
      return;
    }

    setSelectedSlots(connectedSlots);
    setSlotError("");
  };

  const sortedSelectedSlots = useMemo(() => {
    return availableSlots.filter((slot) =>
      selectedSlots.some((selectedSlot) => selectedSlot.id === slot.id)
    );
  }, [availableSlots, selectedSlots]);

  const selectedSlotLabels = sortedSelectedSlots.map(
    (slot) => slot.displayLabel || slot.label
  );

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "No date selected yet";

    const date = new Date(selectedDate);
    return date.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const slotCount = selectedSlots.length;
  const durationHours = slotCount * 0.5;
  const totalPrice = pricePerSlot * slotCount;

  const handleContinueToBooking = () => {
    if (isFacilityInactive) {
      setSlotError("This facility is currently inactive and cannot be booked.");
      return;
    }

    if (!selectedDate) {
      setSlotError("Please select a booking date before continuing.");
      return;
    }

    if (selectedSlots.length === 0) {
      setSlotError(
        "Please select available connected time slots before continuing."
      );
      return;
    }

    navigate("/booking/confirm", {
      state: {
        facilityId: facility.id,
        facilityName: facility.name,
        sport: sportName,
        location: facility.location,
        selectedDate,
        formattedDate: formattedSelectedDate,
        durationLabel: selectedDuration.label,
        selectedSlots: selectedSlotLabels,
        selectedSlotIds: selectedSlots.map((slot) => slot.id),
        totalPrice,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-600">
              Loading facility details...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMessage || !facility) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h1 className="text-3xl font-black text-emerald-950">
              Facility not found
            </h1>
            <p className="mt-3 text-slate-600">
              {errorMessage ||
                "The selected facility does not exist in the database."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200">
            <img
              src={facilityImage}
              alt={facility.name}
              className="h-[420px] w-full object-cover"
            />
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {sportName}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950">
              {facility.name}
            </h1>

            <p className="mt-3 text-base text-slate-500">
              {facility.location}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                Rating: 4.8 ★
              </span>
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {sportName} Facility
              </span>
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-slate-700">
                30-Minute Slot Booking
              </span>
            </div>

            {isFacilityInactive ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                This facility is currently unavailable for booking. Please
                choose another active facility.
              </div>
            ) : null}

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-emerald-950">
                Facility Description
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {facility.description ||
                  "This facility is available for slot-based sports booking through the platform."}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-3xl font-black text-emerald-950">
                  RM {pricePerHour.toFixed(2)} / hour
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  RM {pricePerSlot.toFixed(2)} / 30-minute slot
                </p>
              </div>

              <button
                type="button"
                disabled={isFacilityInactive}
                className={`rounded-2xl px-6 py-3 text-sm font-bold text-emerald-950 transition ${
                  isFacilityInactive
                    ? "cursor-not-allowed bg-gray-200 text-slate-500"
                    : "bg-lime-400 hover:bg-lime-300"
                }`}
              >
                {isFacilityInactive ? "Unavailable" : "Book This Facility"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Available Time Slots
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select a date first, then choose the booking duration and starting
              slot.
            </p>

            {isTodaySelected ? (
              <p className="mt-2 text-sm font-medium text-amber-700">
                Same-day bookings must be made at least 2 hours before the slot
                start time.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-white">
                Selected
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-slate-500">
                Unavailable
              </span>
              <span className="rounded-full bg-lime-100 px-3 py-1 text-emerald-950">
                Available
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Date
                </label>
                <input
                  type="date"
                  min={todayDate}
                  max={maxBookingDateValue}
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={isFacilityInactive}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                />
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Bookings are available up to 14 days in advance.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Duration
                </label>
                <select
                  value={selectedDuration.value}
                  onChange={handleDurationChange}
                  disabled={isFacilityInactive}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {slotError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {slotError}
              </div>
            ) : null}

            {!selectedDate ? (
              <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                Please select a booking date to load available time slots.
              </div>
            ) : null}

            {isSlotsLoading ? (
              <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
                Loading time slots...
              </div>
            ) : null}

            {!isSlotsLoading && selectedDate && slotsMessage ? (
              <div className="mt-6 rounded-2xl bg-amber-50 px-5 py-5 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
                {slotsMessage}
              </div>
            ) : null}

            {!isSlotsLoading && availableSlots.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlots.some(
                    (selectedSlot) => selectedSlot.id === slot.id
                  );
                  const isBooked = isSlotBooked(slot);
                  const isBlocked = isSlotBlocked(slot);
                  const disabled = isSlotDisabled(slot);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSlotSelection(slot)}
                      className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                        isSelected
                          ? "border-emerald-950 bg-emerald-950 text-white"
                          : disabled
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400 opacity-60"
                          : "border-gray-200 bg-gray-50 text-slate-800 hover:border-lime-400 hover:bg-white"
                      }`}
                    >
                      <span>{slot.displayLabel || slot.label}</span>
                      {isBooked ? (
                        <span className="mt-1 block text-xs font-semibold">
                          Booked
                        </span>
                      ) : null}
                      {isBlocked ? (
                        <span className="mt-1 block text-xs font-semibold">
                          Blocked
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Booking Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Facility</span>
                <span className="font-semibold text-slate-900">
                  {facility.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Sport</span>
                <span className="font-semibold text-slate-900">
                  {sportName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Selected Date</span>
                <span className="font-semibold text-slate-900">
                  {formattedSelectedDate}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Chosen Duration</span>
                <span className="font-semibold text-slate-900">
                  {selectedDuration.label}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Selected Slots</span>
                <span className="font-semibold text-slate-900">
                  {slotCount}
                </span>
              </div>

              <div className="border-b border-gray-100 pb-3">
                <p className="text-slate-500">Slot Time</p>
                {selectedSlotLabels.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {selectedSlotLabels.map((slotLabel) => (
                      <p
                        key={slotLabel}
                        className="font-semibold text-slate-900"
                      >
                        {slotLabel}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-slate-400">No slot selected yet</p>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Calculated Duration</span>
                <span className="font-semibold text-slate-900">
                  {durationHours > 0 ? `${durationHours} Hour` : "0 Hour"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold text-emerald-950">
                  Total Price
                </span>
                <span className="text-xl font-black text-emerald-950">
                  RM {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueToBooking}
              disabled={isFacilityInactive || Boolean(selectedDateError)}
              className={`mt-8 w-full rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition ${
                isFacilityInactive || selectedDateError
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isFacilityInactive ? "Facility Unavailable" : "Continue to Booking"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default FacilityDetailsPage;

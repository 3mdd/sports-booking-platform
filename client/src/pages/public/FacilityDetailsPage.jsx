import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";

const facilityData = {
  1: {
    id: 1,
    name: "Grand Football Arena",
    sport: "Football",
    location: "Melaka City",
    pricePerHour: 120,
    rating: "4.8",
    type: "Outdoor Field",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    description:
      "This football facility is suitable for friendly matches, training sessions, and weekend games. It provides a spacious playing area and supports slot-based booking for better schedule management.",
  },
  2: {
    id: 2,
    name: "Padel Point Club",
    sport: "Padel",
    location: "Ayer Keroh, Melaka",
    pricePerHour: 90,
    rating: "4.7",
    type: "Indoor Court",
    image: padelImage,
    description:
      "This facility offers a clean and modern padel court environment suitable for casual matches, training sessions, and competitive play. Users can view live slot availability and complete booking through the platform.",
  },
  3: {
    id: 3,
    name: "Smash Indoor Court",
    sport: "Badminton",
    location: "Bukit Beruang, Melaka",
    pricePerHour: 45,
    rating: "4.6",
    type: "Indoor Court",
    image: badmintonImage,
    description:
      "This badminton venue is designed for fast and convenient court booking. It supports connected time-slot selection and gives users a simple way to review pricing, location, and availability before booking.",
  },
  4: {
    id: 4,
    name: "Elite Futsal Hub",
    sport: "Futsal",
    location: "Melaka Tengah",
    pricePerHour: 100,
    rating: "4.5",
    type: "Indoor Arena",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    description:
      "This futsal facility supports group play, training, and scheduled matches. The system helps users check available times quickly and complete reservations with a more organized booking flow.",
  },
};

const availableSlots = [
  "08:00 - 08:30",
  "08:30 - 09:00",
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:30",
  "12:30 - 13:00",
  "13:00 - 13:30",
  "13:30 - 14:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
  "16:00 - 16:30",
  "16:30 - 17:00",
  "17:00 - 17:30",
  "17:30 - 18:00",
  "18:00 - 18:30",
  "18:30 - 19:00",
  "19:00 - 19:30",
  "19:30 - 20:00",
  "20:00 - 20:30",
  "20:30 - 21:00",
  "21:00 - 21:30",
  "21:30 - 22:00",
  "22:00 - 22:30",
  "22:30 - 23:00",
  "23:00 - 23:30",
  "23:30 - 00:00",
  "00:00 - 00:30",
  "00:30 - 01:00",
  "01:00 - 01:30",
  "01:30 - 02:00",
];

const bookedSlots = [
  "18:00 - 18:30",
  "18:30 - 19:00",
  "20:00 - 20:30",
];

const durationOptions = [
  { label: "1 Hour", value: "1", slotCount: 2 },
  { label: "1.5 Hours", value: "1.5", slotCount: 3 },
  { label: "2 Hours", value: "2", slotCount: 4 },
  { label: "2.5 Hours", value: "2.5", slotCount: 5 },
  { label: "3 Hours", value: "3", slotCount: 6 },
];

function buildSlotStartDateTime(selectedDate, slot) {
  if (!selectedDate) return null;

  const [year, month, day] = selectedDate.split("-").map(Number);
  const startTime = slot.split(" - ")[0];
  const [hour, minute] = startTime.split(":").map(Number);

  const date = new Date(year, month - 1, day, hour, minute);

  // 🔥 after midnight → treat as next day
  if (hour >= 0 && hour < 6) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function FacilityDetailsPage() {
  const { id } = useParams();
  const facility = facilityData[id];
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slotError, setSlotError] = useState("");

  const handleDateChange = (event) => {
  const chosenDate = event.target.value;

  if (chosenDate && chosenDate < todayDate) {
    setSlotError("Past dates are not allowed. Please choose today or a future date.");
    setSelectedDate("");
    setSelectedSlots([]);
    return;
  }

  setSelectedDate(chosenDate);
  setSelectedSlots([]);
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

  const startIndex = availableSlots.indexOf(clickedSlot);
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
      "The selected booking duration includes slot(s) that are no longer available today due to the 2-hour advance booking rule."
    );
    setSelectedSlots([]);
    return;
  }

  setSelectedSlots(connectedSlots);
  setSlotError("");
};

  const sortedSelectedSlots = useMemo(() => {
    return availableSlots.filter((slot) => selectedSlots.includes(slot));
  }, [selectedSlots]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "No date selected yet";

    const date = new Date(selectedDate);
    return date.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

const currentDate = new Date();
const todayDate = `${currentDate.getFullYear()}-${String(
  currentDate.getMonth() + 1
).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

const currentTimePlusTwoHours = useMemo(() => {
  const now = new Date();
  return new Date(now.getTime() + 2 * 60 * 60 * 1000);
}, []);

const isTodaySelected = selectedDate === todayDate;

const isSlotBooked = (slot) => {
  if (!selectedDate) return false;

  return bookedSlots.includes(slot);
};

const isSlotDisabled = (slot) => {
  if (isSlotBooked(slot)) return true;

  if (!isTodaySelected || !selectedDate) return false;

  const slotDateTime = buildSlotStartDateTime(selectedDate, slot);

  return slotDateTime < currentTimePlusTwoHours;
};

  if (!facility) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
            <h1 className="text-3xl font-black text-emerald-950">
              Facility not found
            </h1>
            <p className="mt-3 text-slate-600">
              The selected facility does not exist in the current draft data.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const slotCount = selectedSlots.length;
  const durationHours = slotCount * 0.5;
  const totalPrice = facility.pricePerHour * durationHours;

  const handleContinueToBooking = () => {
  if (!selectedDate) {
    setSlotError("Please select a booking date before continuing.");
    return;
  }

  if (selectedSlots.length === 0) {
    setSlotError("Please select available connected time slots before continuing.");
    return;
  }

  navigate("/booking/confirm", {
    state: {
      facilityId: facility.id,
      facilityName: facility.name,
      sport: facility.sport,
      location: facility.location,
      selectedDate,
      formattedDate: formattedSelectedDate,
      durationLabel: selectedDuration.label,
      selectedSlots: sortedSelectedSlots,
      totalPrice,
    },
  });
};

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200">
            <img
              src={facility.image}
              alt={facility.name}
              className="h-[420px] w-full object-cover"
            />
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {facility.sport}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950">
              {facility.name}
            </h1>

            <p className="mt-3 text-base text-slate-500">{facility.location}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                Rating: {facility.rating} ★
              </span>
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {facility.type}
              </span>
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-slate-700">
                30-Minute Slot Booking
              </span>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-emerald-950">
                Facility Description
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {facility.description}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-3xl font-black text-emerald-950">
                  RM {facility.pricePerHour} / hour
                </p>
              </div>

              <button className="rounded-2xl bg-lime-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-lime-300">
                Book This Facility
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
              Select a date first, then choose the booking duration and starting slot.
            </p>

            {isTodaySelected ? (
  <p className="mt-2 text-sm font-medium text-amber-700">
    Same-day bookings must be made at least 2 hours before the slot start time.
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
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
/>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Duration
                </label>
                <select
                  value={selectedDuration.value}
                  onChange={handleDurationChange}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {availableSlots.map((slot) => {
  const isSelected = selectedSlots.includes(slot);
  const isBooked = isSlotBooked(slot);
  const disabled = isSlotDisabled(slot);

  return (
    <button
      key={slot}
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
      <span>{slot}</span>
{isBooked ? (
  <span className="mt-1 block text-xs font-semibold">Booked</span>
) : null}
    </button>
  );
})}
            </div>
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
                  {facility.sport}
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
                {sortedSelectedSlots.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {sortedSelectedSlots.map((slot) => (
                      <p key={slot} className="font-semibold text-slate-900">
                        {slot}
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
  className="mt-8 w-full rounded-2xl bg-emerald-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
>
  Continue to Booking
</button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default FacilityDetailsPage;
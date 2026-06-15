import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";
import { formatDisplayTime, formatDisplayTimeRange } from "../../utils/timeFormat";
import { getUploadFileUrl } from "../../utils/uploadUrl";
import { getMerchantContact } from "../../utils/merchantContact";

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

function formatReviewDate(dateValue) {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRatingDisplay({ rating, sizeClass = "text-lg" }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <span
          key={starValue}
          className={
            starValue <= roundedRating ? "text-lime-500" : "text-gray-300"
          }
        >
          &#9733;
        </span>
      ))}
    </div>
  );
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

function isAfterSelectedDate(dateValue, selectedDate) {
  if (!dateValue || !selectedDate) return false;

  const date = new Date(dateValue);
  const selectedLocalDate = buildLocalDate(selectedDate);
  date.setHours(0, 0, 0, 0);

  return date > selectedLocalDate;
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
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartSlot, setSelectedStartSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [slotError, setSlotError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

        const response = await fetch(
          `http://localhost:5000/facilities/${id}?approvedOnly=true`
        );

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
    const fetchFacilityReviews = async () => {
      try {
        setIsReviewsLoading(true);
        setReviewsError("");

        const response = await fetch(
          `http://localhost:5000/reviews/facility/${id}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch facility reviews");
        }

        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Fetch facility reviews error:", error);
        setReviewsError(
          error.message ||
            "Unable to load facility reviews. Please make sure the backend server is running."
        );
      } finally {
        setIsReviewsLoading(false);
      }
    };

    fetchFacilityReviews();
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
          `http://localhost:5000/facilities/slots/by-date?facilityId=${facility.id}&date=${selectedDate}&includeNextDay=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch facility slots");
        }

        const data = await response.json();
        const formattedSlots = (data.slots || [])
          .map((slot) => ({
            ...slot,
            label: formatSlotLabel(slot),
            displayLabel: formatDisplayTimeRange(slot.startTime, slot.endTime),
          }))
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() -
              new Date(b.startTime).getTime()
          );

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

  const galleryImages = useMemo(() => {
    return [...(facility?.images || [])].sort((firstImage, secondImage) => {
      if (firstImage.isMain !== secondImage.isMain) {
        return firstImage.isMain ? -1 : 1;
      }

      return (
        new Date(firstImage.createdAt).getTime() -
        new Date(secondImage.createdAt).getTime()
      );
    });
  }, [facility]);
  const fallbackImage = fallbackImages[sportName] || fallbackImages.Default;
  const selectedGalleryImage = galleryImages[currentImageIndex];
  const facilityImage = selectedGalleryImage
    ? getUploadFileUrl(selectedGalleryImage.imageUrl)
    : fallbackImage;

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [facility?.id]);

  useEffect(() => {
    if (galleryImages.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentImageIndex(
        (currentIndex) => (currentIndex + 1) % galleryImages.length
      );
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [galleryImages.length]);

  const showPreviousImage = () => {
    setCurrentImageIndex(
      (currentIndex) =>
        (currentIndex - 1 + galleryImages.length) % galleryImages.length
    );
  };

  const showNextImage = () => {
    setCurrentImageIndex(
      (currentIndex) => (currentIndex + 1) % galleryImages.length
    );
  };

  const pricePerSlot = Number(facility?.pricePerSlot || 0);
  const pricePerHour = pricePerSlot * 2;
  const isFacilityInactive = facility ? !facility.isActive : false;
  const merchantContact = getMerchantContact(facility);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
        reviews.length
      : 0;
  const ratingLabel =
    reviews.length > 0
      ? `${averageRating.toFixed(1)}/5 (${reviews.length} review${
          reviews.length === 1 ? "" : "s"
        })`
      : "No reviews yet";

  const handleDateChange = (event) => {
    const chosenDate = event.target.value;
    const dateError = getBookingDateError(
      chosenDate,
      todayDate,
      maxBookingDateValue
    );

    setSelectedDate(chosenDate);
    setSelectedStartSlot(null);
    setSelectedDuration(null);
    setSelectedSlots([]);

    if (dateError) {
      setSlotError(dateError);
      setAvailableSlots([]);
      setSlotsMessage("");
      return;
    }

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

    const slotDateTime = new Date(slot.startTime);

    return slotDateTime < currentTimePlusTwoHours;
  };

  const getConnectedAvailableSlots = (startSlot) => {
    const startIndex = availableSlots.findIndex(
      (slot) => slot.id === startSlot.id
    );

    if (startIndex === -1 || isSlotDisabled(startSlot)) {
      return [];
    }

    const connectedSlots = [];

    for (
      let index = startIndex;
      index < availableSlots.length && connectedSlots.length < 6;
      index++
    ) {
      const slot = availableSlots[index];

      if (isSlotDisabled(slot)) {
        break;
      }

      if (index > startIndex) {
        const previousSlot = availableSlots[index - 1];
        const previousEndTime = new Date(previousSlot.endTime).getTime();
        const currentStartTime = new Date(slot.startTime).getTime();

        if (previousEndTime !== currentStartTime) {
          break;
        }
      }

      connectedSlots.push(slot);
    }

    return connectedSlots;
  };

  const durationAvailability = selectedStartSlot
    ? durationOptions.map((durationOption) => {
        const connectedSlots = getConnectedAvailableSlots(selectedStartSlot);

        return {
          ...durationOption,
          isAvailable: connectedSlots.length >= durationOption.slotCount,
          slots: connectedSlots.slice(0, durationOption.slotCount),
        };
      })
    : [];

  const hasAvailableDuration = durationAvailability.some(
    (durationOption) => durationOption.isAvailable
  );
  const availableStartSlots = availableSlots.filter(
    (slot) => !isAfterSelectedDate(slot.startTime, selectedDate)
  );

  const handleStartTimeSelection = (clickedSlot) => {
    if (!selectedDate) {
      setSlotError("Please select a booking date before choosing a start time.");
      return;
    }

    if (isSlotDisabled(clickedSlot)) {
      setSlotError(
        "This start time is unavailable. Please choose another start time."
      );
      setSelectedStartSlot(null);
      setSelectedDuration(null);
      setSelectedSlots([]);
      return;
    }

    const connectedSlots = getConnectedAvailableSlots(clickedSlot);

    setSelectedStartSlot(clickedSlot);
    setSelectedDuration(null);
    setSelectedSlots([]);

    if (connectedSlots.length < 2) {
      setSlotError(
        "No booking duration is available from this start time. Please choose another start time."
      );
      return;
    }

    setSlotError("");
  };

  const handleDurationSelection = (durationOption) => {
    if (!selectedStartSlot) {
      setSlotError("Please choose a start time before selecting a duration.");
      return;
    }

    const connectedSlots = getConnectedAvailableSlots(selectedStartSlot);
    const selectedConnectedSlots = connectedSlots.slice(
      0,
      durationOption.slotCount
    );

    if (selectedConnectedSlots.length < durationOption.slotCount) {
      setSlotError(
        `Not enough connected slots available for ${durationOption.label}. Please choose another duration or start time.`
      );
      setSelectedDuration(null);
      setSelectedSlots([]);
      return;
    }

    setSelectedDuration(durationOption);
    setSelectedSlots(selectedConnectedSlots);
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
  const durationHours = selectedDuration ? Number(selectedDuration.value) : 0;
  const totalPrice = pricePerSlot * slotCount;
  const selectedEndSlot = sortedSelectedSlots[sortedSelectedSlots.length - 1];
  const selectedStartTime = selectedStartSlot
    ? formatDisplayTime(selectedStartSlot.startTime)
    : "No start time selected";
  const selectedEndTime = selectedEndSlot
    ? formatDisplayTime(selectedEndSlot.endTime)
    : "No end time selected";
  const bookingTimeLabel =
    selectedStartSlot && selectedEndSlot
      ? formatDisplayTimeRange(
          selectedStartSlot.startTime,
          selectedEndSlot.endTime
        )
      : "No time selected";
  const bookingEndsNextDay = selectedEndSlot
    ? isAfterSelectedDate(selectedEndSlot.endTime, selectedDate)
    : false;
  const canContinueToBooking =
    !isFacilityInactive &&
    !selectedDateError &&
    Boolean(selectedDate) &&
    Boolean(selectedStartSlot) &&
    Boolean(selectedDuration) &&
    selectedSlots.length === selectedDuration?.slotCount;

  const handleContinueToBooking = () => {
    if (isFacilityInactive) {
      setSlotError("This facility is currently inactive and cannot be booked.");
      return;
    }

    if (!selectedDate) {
      setSlotError("Please select a booking date before continuing.");
      return;
    }

    if (!selectedStartSlot) {
      setSlotError("Please choose a start time before continuing.");
      return;
    }

    if (!selectedDuration) {
      setSlotError("Please choose a booking duration before continuing.");
      return;
    }

    if (selectedSlots.length === 0) {
      setSlotError(
        "Please choose a valid start time and duration before continuing."
      );
      return;
    }

    navigate("/booking/confirm", {
      state: {
        facilityId: facility.id,
        facilityName: facility.name,
        sport: sportName,
        location: facility.location,
        merchantContact,
        selectedDate,
        formattedDate: formattedSelectedDate,
        durationLabel: selectedDuration.label,
        bookingTimeLabel,
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

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200">
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <img
                src={facilityImage}
                alt={`${facility.name} photo ${
                  galleryImages.length > 0 ? currentImageIndex + 1 : ""
                }`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImage;
                }}
                className="h-72 w-full object-cover lg:h-80"
              />

              {galleryImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Show previous facility photo"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-950/85 text-xl font-bold text-white shadow-lg hover:bg-emerald-950"
                  >
                    &#8249;
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Show next facility photo"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-950/85 text-xl font-bold text-white shadow-lg hover:bg-emerald-950"
                  >
                    &#8250;
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-emerald-950/85 px-3 py-1 text-xs font-bold text-white">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </span>
                </>
              ) : null}
            </div>

            {galleryImages.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image, imageIndex) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setCurrentImageIndex(imageIndex)}
                    aria-label={`Show facility photo ${imageIndex + 1}`}
                    className={`shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                      imageIndex === currentImageIndex
                        ? "ring-lime-400"
                        : "ring-transparent hover:ring-gray-300"
                    }`}
                  >
                    <img
                      src={getUploadFileUrl(image.imageUrl)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                      className="h-16 w-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {sportName}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
              {facility.name}
            </h1>

            {facility.areaName || facility.stateName ? (
              <p className="mt-3 text-sm font-semibold text-emerald-800">
                {[facility.areaName, facility.stateName]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}

            <p className="mt-3 text-base text-slate-500">
              {facility.location}
            </p>

            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm ring-1 ring-gray-200">
              <p className="font-bold text-emerald-950">Merchant Contact</p>
              <p className="mt-2 font-semibold text-slate-800">
                {merchantContact.businessName}
              </p>
              {merchantContact.contactName ? (
                <p className="mt-1 text-slate-600">
                  {merchantContact.contactName}
                  {merchantContact.username
                    ? ` (@${merchantContact.username})`
                    : ""}
                </p>
              ) : null}
              {merchantContact.phoneNumber ? (
                <a
                  href={`tel:${merchantContact.phoneNumber}`}
                  className="mt-1 block font-semibold text-emerald-800 hover:text-lime-600"
                >
                  {merchantContact.phoneNumber}
                </a>
              ) : (
                <p className="mt-1 text-slate-500">
                  Contact number not available
                </p>
              )}
              {merchantContact.businessAddress ? (
                <p className="mt-1 text-slate-600">
                  {merchantContact.businessAddress}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
                <StarRatingDisplay rating={averageRating} sizeClass="text-sm" />
                <span>{ratingLabel}</span>
              </div>
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

            <div className="mt-5 border-t border-gray-200 pt-4">
              <h2 className="text-lg font-bold text-emerald-950">
                Facility Description
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {facility.description ||
                  "This facility is available for slot-based sports booking through the platform."}
              </p>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-2xl font-black text-emerald-950">
                  RM {pricePerHour.toFixed(2)} / hour
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  RM {pricePerSlot.toFixed(2)} / 30-minute slot
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-black text-emerald-950">
              Available Time Slots
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Select a date first, then choose an available start time and
              booking duration.
            </p>

            {isTodaySelected ? (
              <p className="mt-2 text-sm font-medium text-amber-700">
                Same-day bookings must be made at least 2 hours before the slot
                start time.
              </p>
            ) : null}

            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-gray-200">
              Only available start times are selectable. Booked, blocked, or
              same-day times that are too soon are disabled and labelled.
            </div>

            <div className="mt-5">
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
              <div className="mt-6">
                <h3 className="text-lg font-black text-emerald-950">
                  Choose Start Time
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Only available, unblocked start times that satisfy the
                  same-day 2-hour rule can be selected.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {availableStartSlots.map((slot) => {
                    const isSelected = selectedStartSlot?.id === slot.id;
                    const isBooked = isSlotBooked(slot);
                    const isBlocked = isSlotBlocked(slot);
                    const disabled = isSlotDisabled(slot);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleStartTimeSelection(slot)}
                        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                          isSelected
                            ? "border-emerald-950 bg-emerald-950 text-white"
                            : disabled
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400 opacity-60"
                            : "border-gray-200 bg-gray-50 text-slate-800 hover:border-lime-400 hover:bg-white"
                        }`}
                      >
                        <span>{formatDisplayTime(slot.startTime)}</span>
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
                        {!isBooked && !isBlocked && disabled ? (
                          <span className="mt-1 block text-xs font-semibold">
                            Too soon
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {selectedStartSlot ? (
              <div className="mt-8">
                <h3 className="text-lg font-black text-emerald-950">
                  Choose Duration
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Durations are enabled only when the required connected slots
                  are available after{" "}
                  {formatDisplayTime(selectedStartSlot.startTime)}.
                </p>

                {!hasAvailableDuration ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
                    No booking duration is available from this start time.
                    Please choose another start time.
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {durationAvailability.map((durationOption) => {
                    const isSelected =
                      selectedDuration?.value === durationOption.value;

                    return (
                      <button
                        key={durationOption.value}
                        type="button"
                        disabled={!durationOption.isAvailable}
                        onClick={() => handleDurationSelection(durationOption)}
                        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                          isSelected
                            ? "border-emerald-950 bg-emerald-950 text-white"
                            : durationOption.isAvailable
                            ? "border-gray-200 bg-gray-50 text-slate-800 hover:border-lime-400 hover:bg-white"
                            : "cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400 opacity-60"
                        }`}
                      >
                        <span>{durationOption.label}</span>
                        <span className="mt-1 block text-xs font-semibold">
                          {durationOption.slotCount} slots
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:sticky lg:top-20 lg:self-start">
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
                <span className="text-slate-500">Start Time</span>
                <span className="font-semibold text-slate-900">
                  {selectedStartTime}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">End Time</span>
                <span className="font-semibold text-slate-900">
                  {selectedEndTime}
                  {bookingEndsNextDay ? " (next day)" : ""}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Booking Time</span>
                <span className="text-right font-semibold text-slate-900">
                  {bookingTimeLabel}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-slate-500">Chosen Duration</span>
                <span className="font-semibold text-slate-900">
                  {selectedDuration?.label || "No duration selected"}
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
              disabled={!canContinueToBooking}
              className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition ${
                !canContinueToBooking
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-emerald-950 hover:bg-emerald-900"
              }`}
            >
              {isFacilityInactive ? "Facility Unavailable" : "Continue to Booking"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-emerald-950">
                Customer Reviews
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Feedback from customers with confirmed bookings.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
              <StarRatingDisplay rating={averageRating} sizeClass="text-sm" />
              <span>{ratingLabel}</span>
            </div>
          </div>

          {isReviewsLoading ? (
            <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              Loading facility reviews...
            </div>
          ) : null}

          {!isReviewsLoading && reviewsError ? (
            <div className="mt-6 rounded-2xl bg-red-50 px-5 py-5 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {reviewsError}
            </div>
          ) : null}

          {!isReviewsLoading && !reviewsError && reviews.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-gray-50 px-5 py-5 text-sm font-medium text-slate-500 ring-1 ring-gray-200">
              No reviews have been submitted for this facility yet.
            </div>
          ) : null}

          {!isReviewsLoading && !reviewsError && reviews.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {reviews.map((review) => {
                const reviewerName =
                  review.customer?.user?.fullName || "Customer";

                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-emerald-950">
                          {reviewerName}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <StarRatingDisplay
                          rating={review.rating}
                          sizeClass="text-base"
                        />
                        <p className="mt-1 text-xs font-bold text-emerald-950">
                          {review.rating}/5
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-4 py-4 ring-1 ring-gray-100">
                      <p className="text-sm leading-6 text-slate-600">
                        {review.comment || "No comment added."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default FacilityDetailsPage;

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";
import { getUploadFileUrl } from "../../utils/uploadUrl";

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

function BrowseFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedLocation, setSelectedLocation] = useState("Any Location");

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("http://localhost:5000/facilities");

        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        const activeFacilities = (data.facilities || []).filter(
          (facility) => facility.isActive
        );

        setFacilities(activeFacilities);
      } catch (error) {
        console.error("Fetch facilities error:", error);
        setErrorMessage(
          "Unable to load facilities. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const sportOptions = useMemo(() => {
    const sports = facilities
      .map((facility) => facility.sportType?.name)
      .filter(Boolean);

    return ["All Sports", ...new Set(sports)];
  }, [facilities]);

  const locationOptions = useMemo(() => {
    const locations = facilities
      .map((facility) => facility.location)
      .filter(Boolean);

    return ["Any Location", ...new Set(locations)];
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const facilityName = facility.name?.toLowerCase() || "";
      const sportName = facility.sportType?.name || "";
      const locationName = facility.location || "";

      const matchesSearch = facilityName.includes(searchText.toLowerCase());

      const matchesSport =
        selectedSport === "All Sports" || sportName === selectedSport;

      const matchesLocation =
        selectedLocation === "Any Location" || locationName === selectedLocation;

      return matchesSearch && matchesSport && matchesLocation;
    });
  }, [facilities, searchText, selectedSport, selectedLocation]);

  const getFacilityImage = (facility) => {
    const sportName = facility.sportType?.name;
    const firstImage = facility.images?.[0]?.imageUrl;

    if (firstImage) {
      return getUploadFileUrl(firstImage);
    }

    return fallbackImages[sportName] || fallbackImages.Default;
  };

  const getFacilityPrice = (facility) => {
    const pricePerSlot = Number(facility.pricePerSlot || 0);

    if (!pricePerSlot) {
      return "Price not set";
    }

    return `RM ${pricePerSlot.toFixed(2)} / 30 min`;
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Browse Facilities
          </p>
          <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
            Find the right sports venue for your next booking
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Explore available sports facilities, compare prices, view locations,
            and choose the best venue for your preferred game and schedule.
          </p>
        </section>

        <section className="mb-6 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search facility name"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
          />

          <select
            value={selectedSport}
            onChange={(event) => setSelectedSport(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
          >
            {sportOptions.map((sport) => (
              <option key={sport}>{sport}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-lime-400 focus:bg-white"
          >
            {locationOptions.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>

        </section>

        {isLoading && (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-600">
              Loading facilities...
            </p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rounded-[2rem] bg-red-50 p-8 text-center shadow-sm ring-1 ring-red-100">
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredFacilities.length === 0 && (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-600">
              No facilities found.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredFacilities.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFacilities.map((facility) => (
              <article
                key={facility.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
              >
                <img
                  src={getFacilityImage(facility)}
                  alt={facility.name}
                  className="h-48 w-full object-cover"
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {facility.sportType?.name || "Sport"}
                      </p>
                      <h2 className="mt-1 text-xl font-black text-emerald-950">
                        {facility.name}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {facility.location}
                  </p>

                  {facility.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {facility.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-emerald-950">
                      {getFacilityPrice(facility)}
                    </span>

                    <Link
                      to={`/facilities/${facility.id}`}
                      className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-lime-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BrowseFacilitiesPage;

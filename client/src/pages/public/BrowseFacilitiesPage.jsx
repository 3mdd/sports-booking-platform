import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";

const facilities = [
  {
    id: 1,
    name: "Grand Football Arena",
    sport: "Football",
    location: "Melaka City",
    price: "RM 120 / hour",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "Padel Point Club",
    sport: "Padel",
    location: "Ayer Keroh",
    price: "RM 90 / hour",
    rating: "4.7",
    image: padelImage,
  },
  {
    id: 3,
    name: "Smash Indoor Court",
    sport: "Badminton",
    location: "Bukit Beruang",
    price: "RM 45 / hour",
    rating: "4.6",
    image: badmintonImage,
  },
  {
    id: 4,
    name: "Elite Futsal Hub",
    sport: "Futsal",
    location: "Melaka Tengah",
    price: "RM 100 / hour",
    rating: "4.5",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  },
];

function BrowseFacilitiesPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Browse Facilities
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
            Find the right sports venue for your next booking
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Explore available sports facilities, compare prices, view locations,
            and choose the best venue for your preferred game and schedule.
          </p>
        </section>

        <section className="mb-8 grid gap-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search facility name"
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white"
          />

          <select className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white">
            <option>All Sports</option>
            <option>Football</option>
            <option>Futsal</option>
            <option>Padel</option>
            <option>Badminton</option>
          </select>

          <select className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lime-400 focus:bg-white">
            <option>Any Location</option>
            <option>Melaka City</option>
            <option>Ayer Keroh</option>
            <option>Bukit Beruang</option>
            <option>Melaka Tengah</option>
          </select>

          <button className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900">
            Search Facilities
          </button>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {facilities.map((facility) => (
            <article
              key={facility.id}
              className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-200"
            >
              <img
                src={facility.image}
                alt={facility.name}
                className="h-64 w-full object-cover"
              />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      {facility.sport}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-emerald-950">
                      {facility.name}
                    </h2>
                  </div>

                  <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-950">
                    {facility.rating} ★
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500">{facility.location}</p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-950">
                    {facility.price}
                  </span>

                  <Link
  to={`/facilities/${facility.id}`}
  className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-lime-300"
>
  View Details
</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default BrowseFacilitiesPage;
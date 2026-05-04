import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import padelImage from "../../assets/images/padel.jpg";
import badmintonImage from "../../assets/images/badminton.jpg";
const sports = [
  {
    title: "Football",
    subtitle: "Team Booking",
    description:
      "Book football fields for matches, training sessions, and weekend games with clear slot-based scheduling.",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Padel",
    subtitle: "Popular Court",
    description:
      "Reserve premium padel courts with easy time-slot selection and a simple digital booking process.",
    image: padelImage,
  },
  {
    title: "Badminton",
    subtitle: "Indoor Court",
    description:
      "Browse indoor badminton courts and choose connected 30-minute slots based on live availability.",
    image: badmintonImage,
  },
];

const featuredVenues = [
  {
    name: "Grand Sports Arena",
    location: "Downtown Sports Complex",
    price: "$45/hr",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Skyline Padel Club",
    location: "Westside Heights",
    price: "$35/hr",
    image: padelImage,
  },
  {
    name: "CourtLine Indoor Hall",
    location: "City District",
    price: "$28/hr",
    image: badmintonImage,
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-2 lg:items-center lg:px-8 lg:pt-16">
          <div>
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900 shadow-sm ring-1 ring-gray-200">
              Multi-Vendor Sports Booking Platform
            </span>

            <h1 className="mt-6 max-w-xl text-5xl font-black leading-tight tracking-tight text-emerald-950 md:text-6xl">
              Elevate Your
              <span className="block text-lime-500">Athletic Ritual.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Discover sports facilities, compare available courts, choose
              connected time slots, and complete bookings through one organized
              platform for customers and merchants.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
               to="/facilities"
               className="rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-900"
>
               Browse Facilities
             </Link>
              <button className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-gray-50">
                Become a Merchant
              </button>
            </div>

            <div className="mt-10 flex gap-10">
              <div>
                <p className="text-3xl font-black text-emerald-950">500+</p>
                <p className="text-sm text-slate-500">Venues</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-950">12k+</p>
                <p className="text-sm text-slate-500">Bookings</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-950">30 Min</p>
                <p className="text-sm text-slate-500">Slot System</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 bottom-8 hidden h-40 w-40 rotate-[-12deg] rounded-[2rem] bg-lime-400 p-4 shadow-2xl md:block">
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-emerald-900/10 bg-emerald-800 text-center text-sm font-bold text-white">
                Fast
                <br />
                Slot Booking
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl">
              <img
                src={padelImage}
                alt="Padel court"
                className="h-[520px] w-full rounded-[1.5rem] object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight text-emerald-950">
              Browse by Sport
            </h2>
            <p className="mt-2 text-slate-600">
              Find the right venue based on the game you want to play.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sports.map((sport) => (
              <article
                key={sport.title}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-200"
              >
                <img
                  src={sport.image}
                  alt={sport.title}
                  className="h-72 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {sport.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-emerald-950">
                    {sport.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {sport.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-emerald-950">
                How Booking Works
              </h2>
              <p className="mt-3 text-slate-600">
                A simple flow from facility discovery to confirmed reservation.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1. Search",
                  title: "Browse facilities",
                  desc: "View available sports facilities, compare locations, and choose the best option.",
                },
                {
                  step: "2. Choose Slots",
                  title: "Select connected times",
                  desc: "Pick exact connected 30-minute time slots based on live availability.",
                },
                {
                  step: "3. Confirm Booking",
                  title: "Upload payment proof",
                  desc: "Complete the reservation and submit payment proof for merchant verification.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.75rem] bg-[#f7f8fa] p-8 text-center ring-1 ring-gray-200"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-100 text-xl font-black text-emerald-950">
                    {item.step.split(".")[0]}
                  </div>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-emerald-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-emerald-950">
                Featured Facilities
              </h2>
              <p className="mt-2 text-slate-600">
                Sample facilities that show how the platform can organize venue discovery.
              </p>
            </div>

            <button className="text-sm font-semibold text-emerald-900 hover:text-lime-600">
              View All →
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredVenues.map((venue) => (
              <div
                key={venue.name}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-200"
              >
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="h-72 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-black text-emerald-950">
                    {venue.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{venue.location}</p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-950">
                      {venue.price}
                    </span>
                    <button className="rounded-full bg-lime-100 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-lime-200">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <p className="text-5xl font-black leading-none text-lime-400">“</p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              The booking flow is simple and clear. It helps users find a venue,
              choose connected slots, and complete reservations with less confusion.
            </p>

            <div className="mt-8">
              <p className="font-bold text-emerald-950">Sample User Feedback</p>
              <p className="text-sm text-slate-500">Customer Experience Preview</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-transparent p-2">
            <div className="grid grid-cols-2 gap-5 text-center text-sm font-semibold uppercase tracking-[0.15em] text-slate-500 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Football
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Padel
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Badminton
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Customers
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Merchants
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                Booking Flow
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
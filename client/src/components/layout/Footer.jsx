function Footer() {
  return (
    <footer className="mt-24 bg-emerald-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="text-2xl font-black tracking-tight">EliteSport</h3>
          <p className="mt-4 max-w-xs text-sm leading-6 text-emerald-100/80">
            A multi-vendor sports facility booking platform for customers and
            merchants to manage reservations more efficiently.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            Platform
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-emerald-100/80">
            <li>Browse Facilities</li>
            <li>Book Slots</li>
            <li>Upload Payment Proof</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            Merchant
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-emerald-100/80">
            <li>Merchant Dashboard</li>
            <li>Booking Management</li>
            <li>Payment Verification</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
            Get Updates
          </h4>
          <div className="mt-4 flex rounded-full bg-emerald-900 p-1">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-transparent px-4 py-2 text-sm text-white placeholder:text-emerald-200/50 focus:outline-none"
            />
            <button className="rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-lime-300">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-emerald-100/60 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 EliteSport Technologies. All rights reserved.</p>
          <p>Sports Booking Platform • Customer & Merchant Flow</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
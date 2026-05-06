import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const initialPaymentProofs = [
  {
    id: 1,
    bookingId: 1,
    customerName: "Ahmad Hakim",
    facilityName: "Padel Point Club",
    bookingDate: "6 May 2026",
    bookingTime: "20:00 - 21:00",
    amount: "RM 90.00",
    status: "Pending",
    uploadedAt: "Today, 10:15 PM",
  },
  {
    id: 2,
    bookingId: 2,
    customerName: "Sarah Lim",
    facilityName: "Smash Indoor Court",
    bookingDate: "7 May 2026",
    bookingTime: "18:00 - 19:30",
    amount: "RM 67.50",
    status: "Pending",
    uploadedAt: "Today, 9:40 PM",
  },
  {
    id: 3,
    bookingId: 3,
    customerName: "Daniel Wong",
    facilityName: "Grand Football Arena",
    bookingDate: "8 May 2026",
    bookingTime: "21:00 - 23:00",
    amount: "RM 240.00",
    status: "Approved",
    uploadedAt: "Yesterday, 8:10 PM",
  },
];

function PaymentVerificationPage() {
  const [paymentProofs, setPaymentProofs] = useState(initialPaymentProofs);

  const updatePaymentStatus = (proofId, newStatus) => {
    setPaymentProofs((currentProofs) =>
      currentProofs.map((proof) =>
        proof.id === proofId ? { ...proof, status: newStatus } : proof
      )
    );
  };

  const pendingCount = paymentProofs.filter(
    (proof) => proof.status === "Pending"
  ).length;

  const approvedCount = paymentProofs.filter(
    (proof) => proof.status === "Approved"
  ).length;

  const rejectedCount = paymentProofs.filter(
    (proof) => proof.status === "Rejected"
  ).length;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Merchant Portal
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
            Payment Verification
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Review customer payment proof submissions and update booking payment
            status after checking the uploaded receipt.
          </p>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Pending Review
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Approved Proofs
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-semibold text-slate-500">
              Rejected Proofs
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-950">
              {rejectedCount}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-emerald-950">
                Uploaded Payment Proofs
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Merchant can approve or reject each uploaded payment proof.
              </p>
            </div>

            <span className="rounded-full bg-lime-100 px-4 py-2 text-sm font-semibold text-emerald-950">
              Frontend draft
            </span>
          </div>

          <div className="space-y-5">
            {paymentProofs.map((proof) => (
              <article
                key={proof.id}
                className="grid gap-5 rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5 lg:grid-cols-[1fr_220px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black text-emerald-950">
                      Booking #{proof.bookingId}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        proof.status === "Approved"
                          ? "bg-lime-100 text-emerald-950"
                          : proof.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {proof.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Customer</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.customerName}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Facility</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.facilityName}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Booking Date</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.bookingDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Booking Time</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.bookingTime}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Amount</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.amount}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Uploaded At</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {proof.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-white p-4 text-sm ring-1 ring-gray-200">
                    <p className="font-semibold text-emerald-950">
                      Payment Proof Preview
                    </p>
                    <p className="mt-2 text-slate-500">
                      Uploaded receipt preview will appear here after backend
                      file integration.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus(proof.id, "Approved")}
                    className="rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                  >
                    Approve Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePaymentStatus(proof.id, "Rejected")}
                    className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Reject Payment
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PaymentVerificationPage;
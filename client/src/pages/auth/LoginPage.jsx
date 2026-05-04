import { Link } from "react-router-dom";
function LoginPage() {
  return (
    <div className="bg-[#f3f4f6] lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-screen lg:block">
        <img
          src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80"
          alt="Padel court athlete"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-emerald-950/60" />

        <div className="absolute inset-0 flex flex-col justify-between p-8 text-white xl:p-10">
          <div>
<Link to="/" className="text-4xl font-black tracking-tight">
  EliteSport
</Link>
          </div>

          <div className="max-w-lg pb-2">
            <h2 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Elevate your game to
              <span className="block text-lime-400">the elite level.</span>
            </h2>

            <p className="mt-4 text-base leading-7 text-emerald-50/85">
              Access world-class facilities, premium booking experiences, and a
              high-performance sports community built for serious athletes.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User 1"
                />
                <img
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="User 2"
                />
                <img
                  className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  src="https://randomuser.me/api/portraits/men/76.jpg"
                  alt="User 3"
                />
              </div>

              <div>
                <p className="font-semibold">Join 10k+ athletes</p>
                <p className="text-sm text-emerald-50/70">
                  Transforming their training today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-6 lg:h-screen lg:min-h-0 lg:px-8 lg:py-4 xl:px-10">
        <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-7">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Welcome back
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">
              Log in to your account
            </h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
              Continue your booking journey and access your athlete dashboard.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-emerald-800 hover:text-lime-600"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-lime-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-lime-500 focus:ring-lime-400"
              />
              <label htmlFor="remember" className="text-sm text-slate-600">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-lime-400 px-6 py-3.5 text-base font-bold text-emerald-950 transition hover:bg-lime-300"
            >
              Sign In to Dashboard →
            </button>
          </form>

          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-white">
              Google
            </button>
            <button className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-white">
              Facebook
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            New to EliteSport?
            <Link to="/" className="ml-2 font-semibold text-emerald-900 hover:text-lime-600">
             Create an account
           </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-zinc-900">
      {/* Top navigation */}
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">
              EduPulse
            </h1>
            <p className="text-xs text-zinc-500">
              Student Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-600 sm:block">
              Welcome back, Alex
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold text-emerald-700">
            STUDENT SPACE
          </p>

          <h2 className="text-3xl font-bold">
            Your mentoring journey
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Discover mentors, get career guidance and keep track of
            your mentoring activities in one place.
          </p>
        </section>

        {/* Quick actions */}
        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">🔎</div>

            <h3 className="text-lg font-bold">
              Find a mentor
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Explore mentors by field, expertise and career interests.
            </p>

            <button className="mt-5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white">
              Explore mentors
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">👤</div>

            <h3 className="text-lg font-bold">
              Complete your profile
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Add your interests, study area and career goals to help
              build a meaningful mentoring experience.
            </p>

            <button className="mt-5 rounded-full border border-emerald-700 px-5 py-2.5 text-sm font-medium text-emerald-700">
              View profile
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">📅</div>

            <h3 className="text-lg font-bold">
              Upcoming sessions
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Keep track of scheduled mentoring sessions and upcoming
              guidance activities.
            </p>

            <button className="mt-5 rounded-full border border-emerald-700 px-5 py-2.5 text-sm font-medium text-emerald-700">
              View sessions
            </button>
          </div>
        </section>

        {/* Mentoring activity */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Mentoring activity
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                A simple overview of your current mentoring journey.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Mentor connections
              </p>

              <p className="mt-2 text-3xl font-bold">
                2
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                Active connections
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Pending requests
              </p>

              <p className="mt-2 text-3xl font-bold">
                1
              </p>

              <p className="mt-2 text-sm text-amber-700">
                Awaiting response
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Sessions completed
              </p>

              <p className="mt-2 text-3xl font-bold">
                3
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                Keep growing
              </p>
            </div>
          </div>
        </section>

        {/* Current mentor */}
        <section className="mt-10 rounded-3xl bg-emerald-700 p-8 text-white">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
                Current mentor
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Sarah Fernando
              </h2>

              <p className="mt-2 text-emerald-50">
                Software Engineer · Web Development
              </p>

              <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
                Your mentoring connection can help you understand
                industry expectations, career pathways and practical
                skills related to your interests.
              </p>
            </div>

            <button className="rounded-full bg-white px-6 py-3 font-medium text-emerald-700">
              View mentor
            </button>
          </div>
        </section>

        {/* Next step */}
        <section className="mt-10 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-700">
            YOUR NEXT STEP
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Explore mentors in your field
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Start by exploring professionals and experienced students
            who can provide guidance relevant to your academic and
            career interests.
          </p>
        </section>
      </div>
    </main>
  );
}
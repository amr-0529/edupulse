const mentors = [
  {
    name: "Sarah Fernando",
    role: "Software Engineer",
    expertise: "Web Development",
    experience: "5+ years experience",
  },
  {
    name: "Daniel Perera",
    role: "Product Designer",
    expertise: "UI/UX Design",
    experience: "4+ years experience",
  },
  {
    name: "Nadeesha Silva",
    role: "Data Analyst",
    expertise: "Data Science",
    experience: "6+ years experience",
  },
];

export default function MentorsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-zinc-900">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">
              EduPulse
            </h1>
            <p className="text-xs text-zinc-500">
              Mentor Discovery
            </p>
          </div>

          <a
            href="/dashboard"
            className="text-sm font-medium text-emerald-700"
          >
            Back to dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section>
          <p className="text-sm font-semibold text-emerald-700">
            FIND YOUR MENTOR
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Explore mentors who can guide your journey
          </h2>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Discover experienced students and professionals based on
            your interests, study area and career goals.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
            <input
              type="text"
              placeholder="Search by name or expertise"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
            />

            <select className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-emerald-600">
              <option>All categories</option>
              <option>Software Engineering</option>
              <option>UI/UX Design</option>
              <option>Data Science</option>
              <option>Business</option>
            </select>

            <button className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white">
              Search mentors
            </button>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h3 className="text-2xl font-bold">
              Recommended mentors
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Explore mentors whose expertise matches common student
              career interests.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {mentors.map((mentor) => (
              <article
                key={mentor.name}
                className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {mentor.name.charAt(0)}
                </div>

                <h4 className="mt-5 text-xl font-bold">
                  {mentor.name}
                </h4>

                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {mentor.role}
                </p>

                <div className="mt-5 space-y-2 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-800">
                      Expertise:
                    </span>{" "}
                    {mentor.expertise}
                  </p>

                  <p>
                    <span className="font-medium text-zinc-800">
                      Experience:
                    </span>{" "}
                    {mentor.experience}
                  </p>
                </div>

                <button className="mt-6 w-full rounded-full border border-emerald-700 px-5 py-2.5 text-sm font-medium text-emerald-700">
                  View mentor profile
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-700">
            NEXT STEP
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Find a mentor who matches your goals
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            This interface will later connect to mentor profiles,
            categories and search data as the EduPulse platform is
            developed.
          </p>
        </section>
      </div>
    </main>
  );
}
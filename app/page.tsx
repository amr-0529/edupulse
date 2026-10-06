export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-blue-600">EduPulse</h1>

        <div className="flex gap-4">
          <button className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100">
            Login
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Sign Up
          </button>
        </div>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-8 py-24 text-center">
        <h2 className="max-w-3xl text-5xl font-bold tracking-tight text-gray-900">
          Connect Students with the Right Professionals
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          EduPulse helps students discover professional mentors, build
          meaningful connections, communicate, and arrange mentoring sessions.
        </p>

        <div className="mt-8 flex gap-4">
          <button className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
            Find a Mentor
          </button>
          <button className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
            Become a Mentor
          </button>
        </div>
      </section>

      <section className="border-t bg-gray-50 px-8 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Find Mentors
            </h3>
            <p className="mt-3 text-gray-600">
              Discover professionals based on your interests and career goals.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Build Connections
            </h3>
            <p className="mt-3 text-gray-600">
              Connect with professionals and communicate through the platform.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">
              Book Sessions
            </h3>
            <p className="mt-3 text-gray-600">
              Request mentoring sessions based on mentor availability.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
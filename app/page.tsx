import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf5] text-zinc-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-emerald-700">EduPulse</h1>

        <div className="hidden md:flex gap-8 text-sm text-zinc-600">
          <a href="#about">About</a>
          <a href="#how">How it works</a>
          <a href="#mentors">Mentors</a>
          <a href="#students">Students</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full border border-emerald-700 px-5 py-2 text-emerald-700">
            Log in
          </Link>
          <Link href="/register" className="rounded-full bg-emerald-700 px-5 py-2 text-white">
            Join EduPulse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-emerald-700 font-semibold mb-4">
            Student–Professional Mentoring Platform
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Connecting students with the guidance they need to succeed.
          </h2>

          <p className="mt-6 text-lg text-zinc-600 leading-8">
            EduPulse bridges the gap between academic learning and real-world
            industry experience by connecting students with professionals who
            can guide their career journey.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/register?role=student"
              className="rounded-full bg-emerald-700 px-6 py-3 text-white"
            >
              Find a Mentor
            </Link>
            <Link
              href="/register?role=mentor"
              className="rounded-full border border-emerald-700 px-6 py-3 text-emerald-700"
            >
              Become a Mentor
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-10">
          <h3 className="text-xl font-bold mb-6">Why EduPulse?</h3>

          <div className="space-y-5">
            <div>
              <h4 className="font-semibold">🎓 Student Growth</h4>
              <p className="text-zinc-600">
                Receive career guidance, skill advice and industry insights.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">🤝 Professional Mentorship</h4>
              <p className="text-zinc-600">
                Experienced professionals share knowledge and support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">🌱 Future Ready Skills</h4>
              <p className="text-zinc-600">
                Help students prepare for real-world opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="about" className="bg-white py-20 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold">The problem we want to solve</h2>
          <p className="mt-6 text-lg text-zinc-600">
            Many students graduate with academic knowledge but lack industry
            exposure, career direction and professional networks. EduPulse
            helps close this gap through meaningful mentorship.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-8 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center">How EduPulse works</h2>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white rounded-2xl p-8 shadow">
            <h3 className="font-bold text-xl">1. Students Join</h3>
            <p className="mt-3 text-zinc-600">
              Students create profiles and identify their goals.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow">
            <h3 className="font-bold text-xl">2. Match With Mentors</h3>
            <p className="mt-3 text-zinc-600">
              Students connect with professionals who match their interests.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow">
            <h3 className="font-bold text-xl">3. Grow Together</h3>
            <p className="mt-3 text-zinc-600">
              Mentorship helps students develop confidence and career skills.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-700 text-white py-10 text-center">
        <h2 className="text-2xl font-bold">EduPulse</h2>
        <p className="mt-3">
          Building stronger connections between students and professionals.
        </p>
      </footer>
    </main>
  );
}
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <h1 className="text-2xl font-bold text-brand">EduPulse</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-outline btn-sm">
            Log in
          </Link>
          <Link href="/register" className="btn btn-sm">
            Join EduPulse
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="font-semibold text-brand">Student–Professional Mentoring Platform</p>
          <h2 className="mt-4 text-5xl font-bold leading-tight">
            Connecting students with the guidance they need to succeed.
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted">
            EduPulse bridges the gap between academic learning and real-world industry experience by connecting students with professionals who can guide their career journey.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register?role=student" className="btn">
              Find a Mentor
            </Link>
            <Link href="/register?role=mentor" className="btn btn-outline">
              Become a Mentor
            </Link>
          </div>
        </div>

        <div className="card p-10">
          <h3 className="text-xl font-bold">Why EduPulse?</h3>
          <div className="mt-6 space-y-5">
            <div>
              <h4 className="font-semibold">🎓 Student Growth</h4>
              <p className="text-muted">Career guidance, skill advice and industry insights.</p>
            </div>
            <div>
              <h4 className="font-semibold">🤝 Professional Mentorship</h4>
              <p className="text-muted">Experienced professionals share knowledge and support.</p>
            </div>
            <div>
              <h4 className="font-semibold">🌱 Future-Ready Skills</h4>
              <p className="text-muted">Prepare for real-world opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold">The problem we want to solve</h2>
          <p className="mt-6 text-lg text-muted">
            Many students graduate with academic knowledge but lack industry exposure, career direction and professional networks. EduPulse helps close this gap through meaningful mentorship.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">How EduPulse works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="card">
            <h3 className="text-xl font-bold">1. Students Join</h3>
            <p className="mt-3 text-muted">Students create profiles and identify their goals.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold">2. Match With Mentors</h3>
            <p className="mt-3 text-muted">Students connect with professionals who match their interests.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold">3. Grow Together</h3>
            <p className="mt-3 text-muted">Mentorship helps students develop confidence and career skills.</p>
          </div>
        </div>
      </section>

      <footer className="bg-brand py-10 text-center" style={{ color: "var(--brand-fg)" }}>
        <h2 className="text-2xl font-bold">EduPulse</h2>
        <p className="mt-3">Building stronger connections between students and professionals.</p>
      </footer>
    </main>
  );
}
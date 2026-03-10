import { Link } from 'react-router-dom'
import {
  Leaf,
  Shield,
  ArrowRight,
  Brain,
  Camera,
  ClipboardCheck
} from 'lucide-react'

export default function Landing() {
  const heroVideo = '/videos/aloe-background-1.mp4'

  const features = [
    {
      title: 'AI Disease Detection',
      description: 'Detect rust, fungal infections, and plant stress early.',
      icon: Brain,
      image: '/images/aloe-disease-detection.jpg'
    },
    {
      title: 'Fast Aloe Scanning',
      description: 'Capture or upload a photo and receive results instantly.',
      icon: Camera,
      image: '/images/aloe2.jpg'
    },
    {
      title: 'Health Tracking',
      description: 'Monitor health scores and aloe condition over time.',
      icon: Leaf,
      image: '/images/aloe3.jpg'
    },
    {
      title: 'Actionable Guidance',
      description: 'Get AI-driven recommendations to improve plant health.',
      icon: ClipboardCheck,
      image: '/images/aloe1.jpg'
    }
  ]

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-b from-[#e6f4e8] via-[#d7eddc] to-[#edf7ef] text-green-50">
      {/* ================= HERO ================= */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Videos */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            src={heroVideo}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/45" />

        {/* Top Right Auth Buttons */}
        <div className="absolute right-6 top-6 z-20 flex gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-green-100/70 bg-green-950/30 px-6 py-2 text-sm font-semibold text-green-50"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-green-100 px-6 py-2 text-sm font-bold text-green-900"
          >
            Create Account
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-black/25 px-4 py-1.5 text-sm font-bold tracking-widest text-emerald-100">
                <Shield size={14} />
                SMART ALOE VERA CARE
              </span>

              <h1 className="mt-5 text-5xl font-extrabold leading-tight text-green-50 drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)] md:text-7xl">
                Grow Healthier Aloe Vera
                <span className="block text-green-300">
                  with AI-Powered Monitoring
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-2xl font-medium leading-relaxed text-green-50/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] md:text-3xl">
                Scan aloe leaves, detect diseases early, and monitor plant health
                using intelligent AI analysis built for farmers and growers.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-300 px-7 py-3 text-sm font-bold text-green-950"
                >
                  Start Scanning
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border border-green-100/60 bg-green-950/25 px-7 py-3 text-sm font-semibold text-green-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/contributors"
                  className="inline-flex items-center px-2 py-3 text-sm font-extrabold tracking-[0.12em] text-green-100 underline decoration-green-200/70 underline-offset-4 transition-colors hover:text-white"
                >
                  CONTRIBUTORS
                </Link>
                <Link
                  to="/about-us"
                  className="inline-flex items-center px-2 py-3 text-sm font-extrabold tracking-[0.12em] text-green-100 underline decoration-green-200/70 underline-offset-4 transition-colors hover:text-white"
                >
                  ABOUT US
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mx-auto max-w-7xl bg-gradient-to-b from-[#d6ecd9] to-[#c6e3cc] px-6 py-16">
        <h2 className="text-4xl font-extrabold tracking-tight text-green-900 md:text-5xl">
          Complete Aloe Vera Management
        </h2>
        <p className="mt-3 max-w-3xl text-lg font-medium leading-relaxed text-green-800/90">
          Focused AI tools to monitor aloe health and improve harvest quality.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon, image }) => (
            <div
              key={title}
              className="rounded-3xl border border-green-200/20 bg-gradient-to-b from-[#24422f]/95 to-[#173025]/95 p-6 shadow-[0_14px_30px_rgba(7,20,13,0.35)]"
            >
              <div className="mb-5 overflow-hidden rounded-2xl border border-green-200/20">
                <img
                  src={image}
                  alt={title}
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mb-5 inline-flex rounded-2xl border border-green-300/35 bg-green-300/15 p-3 text-green-200">
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-green-50">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-green-100/85">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="border-y border-green-400/20 bg-gradient-to-r from-[#d9eedc] via-[#cbe6d1] to-[#d9eedc] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-green-900 md:text-4xl">How It Works</h2>
          <p className="mt-3 max-w-2xl text-base font-medium text-green-800/90">
            A streamlined workflow built for growers who need speed, visibility, and reliable decisions.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ['Create Account', 'Register and secure your farm workspace.'],
              ['Add Aloe Plants', 'Set up your aloe plant batches.'],
              ['Scan Leaves', 'Upload photos and run AI analysis.'],
              ['Take Action', 'Apply recommendations and track progress.']
            ].map(([title, text], idx) => (
              <div
                key={title}
                className="rounded-3xl border border-green-200/20 bg-[#1d3927]/90 p-6 shadow-[0_10px_26px_rgba(7,16,11,0.3)]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-green-100/60 bg-green-300 text-sm font-extrabold text-green-950">
                  {idx + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-green-50">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-green-100/85">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-green-200/30 bg-gradient-to-r from-[#245236]/95 via-[#2e6644]/95 to-[#3b7a54]/95 p-8 shadow-[0_18px_38px_rgba(9,23,14,0.35)] md:p-10">
          <div className="grid items-end gap-8 md:grid-cols-[1.5fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-100/35 bg-green-900/25 px-4 py-1.5 text-xs font-bold tracking-[0.16em] text-green-100">
                <Leaf size={14} />
                READY TO START
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-green-50 md:text-5xl">
                Ready to transform your aloe vera cultivation?
              </h2>
              <p className="mt-3 max-w-3xl text-lg font-medium leading-relaxed text-green-100/90">
                Start scanning today and let AI help you detect issues earlier.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-xl bg-green-200 px-8 py-3 text-base font-extrabold text-green-950 shadow-[0_6px_18px_rgba(5,20,11,0.25)]"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-green-100/60 bg-green-950/25 px-8 py-3 text-base font-bold text-green-50"
                >
                  Login
                </Link>
                <Link
                  to="/contributors"
                  className="inline-flex items-center gap-2 rounded-xl border border-green-100/55 bg-green-50/10 px-8 py-3 text-base font-bold text-green-50 transition-colors hover:bg-green-50/20"
                >
                  CONTRIBUTORS
                </Link>
                <Link
                  to="/about-us"
                  className="inline-flex items-center gap-2 rounded-xl border border-green-100/55 bg-green-50/10 px-8 py-3 text-base font-bold text-green-50 transition-colors hover:bg-green-50/20"
                >
                  ABOUT US
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100/30 bg-green-950/20 p-6">
              <p className="text-xs font-bold tracking-[0.15em] text-green-100/90">TEAM</p>
              <p className="mt-2 text-2xl font-extrabold text-green-50">4 Members</p>
              <p className="mt-2 text-sm font-medium text-green-100/85">
                Built by a collaborative team focused on AI, agritech, and practical grower workflows.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

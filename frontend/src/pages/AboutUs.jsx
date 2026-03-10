import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Leaf, PlayCircle, ShieldCheck, Sprout, Target } from 'lucide-react'

const aloeFacts = [
  {
    title: 'Ancient Medicinal Heritage',
    text: 'Aloe vera appears in Egyptian, Greek, Indian, and Arab botanical traditions as a practical healing plant used for skin and wellness support.'
  },
  {
    title: 'Built for Harsh Climates',
    text: 'The succulent leaf structure stores moisture-rich gel, helping aloe thrive in dry environments while maintaining valuable biochemical properties.'
  },
  {
    title: 'High-Value Modern Crop',
    text: 'Aloe now supports global cosmetic, food, and health industries, making quality control and early disease detection essential for growers.'
  }
]

const timeline = [
  { year: '2200 BCE', detail: 'Early references to aloe-like healing plants appear in ancient Mesopotamian and Egyptian records.' },
  { year: '1550 BCE', detail: 'The Ebers Papyrus documents plant-based remedies associated with aloe use.' },
  { year: '1st Century', detail: 'Greek and Roman physicians write about aloe applications for skin and herbal treatment practices.' },
  { year: 'Modern Agriculture', detail: 'Aloe becomes a commercial crop, requiring better diagnostics, traceability, and cultivation intelligence.' }
]

const galleryPhotos = [
  {
    title: 'Healthy Mature Aloe Plant',
    src: '/images/aloe1.jpg',
    position: 'center'
  },
  {
    title: 'Bright Green Aloe Rosette',
    src: '/images/aloe2.jpg',
    position: 'center'
  },
  {
    title: 'Clear and Fresh Aloe Leaves',
    src: '/images/aloe3.jpg',
    position: 'center top'
  },
  {
    title: 'Professional Aloe Detection Sample',
    src: '/images/aloe-disease-detection.jpg',
    position: 'center'
  }
]

const localVideos = [
  {
    src: '/videos/aloe-background-1.mp4'
  },
  {
    src: '/videos/aloe-background-2.mp4'
  },
  {
    src: '/videos/aloe-background-3.mp4'
  },
  {
    src: '/videos/aloe-background-4.mp4'
  }
]

const aloeBenefits = [
  {
    title: 'Supports Skin Hydration',
    description: 'Aloe gel helps retain moisture and soothes dry, stressed skin.',
    image: '/images/skin%20hydration.jpg',
    position: 'center'
  },
  {
    title: 'Cooling and Soothing',
    description: 'Traditionally used to calm minor skin irritation and sun-exposed areas.',
    image: '/images/cooling%20and%20soothing.jpg',
    position: 'center'
  },
  {
    title: 'Rich in Plant Compounds',
    description: 'Contains natural antioxidants and bioactive compounds valued in wellness products.',
    image: '/images/rich%20in%20plant%20compounds.jpg',
    position: 'center'
  },
  {
    title: 'Useful in Home Care',
    description: 'Widely used in daily personal care routines for practical plant-based support.',
    image: '/images/healthy%20plants%20.png',
    position: 'center'
  }
]

const hero3DModel = 'https://sketchfab.com/models/0932faed95ef4b77b26c609e05342360/embed'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e8f2ec_0%,#d7e7dd_34%,#edf5f1_100%)] text-[#143627]">
      <section className="relative overflow-hidden border-b border-[#bdd3c5]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(121,171,139,0.36),transparent_40%),radial-gradient(circle_at_84%_10%,rgba(46,103,70,0.3),transparent_36%),linear-gradient(132deg,#0f3123_0%,#1b4b34_42%,#2d6b4a_72%,#3a7f5b_100%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 pb-16 pt-12 md:grid-cols-[1.05fr_0.95fr] md:pt-16 lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.2em] text-[#cfe8db]">ABOUT VERA SYSTEM</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#f0faf4] md:text-6xl">
              Aloe Intelligence
              <span className="block text-[#bfe6cf]">Professional Monitoring for Growers</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#deefe5] md:text-lg">
              Vera combines aloe science, visual diagnostics, and practical AI workflows to help growers
              detect issues early, protect plant quality, and make confident field decisions.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#d6efdf] px-6 py-3 text-sm font-extrabold text-[#123324] transition-colors hover:bg-[#c3e6d2]"
              >
                Start Scanning
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-[#d3e9dc]/70 bg-white/10 px-6 py-3 text-sm font-bold text-[#e8f5ee] transition-colors hover:bg-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#83ad93] bg-[#0e2d20]/50 p-3 shadow-[0_24px_60px_rgba(3,14,9,0.38)] backdrop-blur-sm">
            <div className="rounded-2xl border border-[#739f87] bg-[#092116] p-2">
              <iframe
                title="3D Aloe Vera Model"
                src={hero3DModel}
                className="h-[310px] w-full rounded-xl md:h-[360px]"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-xs font-bold tracking-[0.14em] text-[#c8e6d6]">3D ALOE VERA MODEL</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#d9efe3]">
                <PlayCircle size={13} />
                Interactive View
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
        {aloeFacts.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-[#c6dbcf] bg-[linear-gradient(180deg,#f9fdfa_0%,#eef6f1_100%)] p-6 shadow-[0_12px_30px_rgba(16,49,33,0.11)]"
          >
            <h2 className="text-xl font-extrabold text-[#173b2b]">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3f6050]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-[#c8ddcf] bg-[linear-gradient(90deg,#e1eee6_0%,#d4e6dc_50%,#e8f2ec_100%)] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-extrabold text-[#173a2a]">Aloe Vera Through History</h2>
          <p className="mt-2 text-sm text-[#3f6150]">
            A concise timeline of aloe vera from ancient records to modern agricultural importance.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {timeline.map((item) => (
              <div key={item.year} className="rounded-2xl border border-[#bdd7c8] bg-white/75 p-5 shadow-[0_8px_18px_rgba(18,52,35,0.08)]">
                <p className="text-xs font-extrabold tracking-[0.15em] text-[#2b6a48]">{item.year}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#2f5443]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-extrabold text-[#163a2a]">Aloe Image Gallery</h2>
        <p className="mt-2 text-sm text-[#426252]">
          Curated local aloe visuals with clear, healthy plant presentation.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {galleryPhotos.map((item) => (
            <figure
              key={`${item.title}-${item.src}`}
              className="overflow-hidden rounded-2xl border border-[#bdd5c7] bg-[#f8fbf9] shadow-[0_10px_24px_rgba(17,45,31,0.12)]"
            >
              <img
                src={item.src}
                alt={item.title}
                className="h-52 w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                style={{ objectPosition: item.position || 'center' }}
                loading="lazy"
              />
              <figcaption className="px-3 py-2 text-xs font-semibold text-[#2f5a45]">{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <h2 className="text-3xl font-extrabold text-[#163a2a]">Video Library</h2>
        <p className="mt-2 text-sm text-[#426252]">
          Local aloe video library for consistent playback across the system.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {localVideos.map((video, idx) => (
            <article
              key={`${video.src}-${idx}`}
              className="overflow-hidden rounded-2xl border border-[#bdd5c7] bg-[#eef5f0] p-2 shadow-[0_12px_24px_rgba(17,45,31,0.14)]"
            >
              <video
                src={video.src}
                className="h-[250px] w-full rounded-xl object-cover"
                autoPlay
                muted
                loop
                preload="metadata"
                playsInline
              />
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <h2 className="text-3xl font-extrabold text-[#163a2a]">Benefits of Aloe Vera</h2>
        <p className="mt-2 text-sm text-[#426252]">
          Key wellness benefits supported by aloe vera usage in everyday care.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aloeBenefits.map((benefit) => (
            <article
              key={benefit.title}
              className="overflow-hidden rounded-2xl border border-[#bdd5c7] bg-[#f8fbf9] shadow-[0_10px_24px_rgba(17,45,31,0.12)]"
            >
              <img
                src={benefit.image}
                alt={benefit.title}
                className="h-48 w-full object-cover"
                style={{ objectPosition: benefit.position || 'center' }}
                loading="lazy"
              />
              <div className="p-3">
                <h3 className="text-sm font-extrabold text-[#1c4632]">{benefit.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#426252]">{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#bfd7c9] bg-[linear-gradient(90deg,#153626_0%,#1d4a34_42%,#20533a_62%,#19412f_100%)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 md:grid-cols-2">
          <article className="rounded-3xl border border-[#5a9072] bg-[#102d1f]/78 p-7 shadow-[0_12px_28px_rgba(3,12,8,0.32)]">
            <div className="inline-flex rounded-2xl border border-[#7fb394] bg-[#2d6f4d]/35 p-3 text-[#d2f1e0]">
              <Target size={20} />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-[#eff9f3]">Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#cee7da]">
              Deliver accurate, accessible, and field-ready aloe diagnostics that empower growers to act early,
              reduce disease impact, and sustain high-quality cultivation through intelligent monitoring.
            </p>
          </article>

          <article className="rounded-3xl border border-[#5a9072] bg-[#102d1f]/78 p-7 shadow-[0_12px_28px_rgba(3,12,8,0.32)]">
            <div className="inline-flex rounded-2xl border border-[#7fb394] bg-[#2d6f4d]/35 p-3 text-[#d2f1e0]">
              <Eye size={20} />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-[#eff9f3]">Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#cee7da]">
              Become the trusted benchmark for sustainable aloe cultivation by uniting plant science,
              actionable AI insight, and grower decision-making in one professional ecosystem.
            </p>
          </article>
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 pb-10 text-xs font-semibold tracking-[0.12em] text-[#b8d8c7]">
          <span className="inline-flex items-center gap-2"><Sprout size={13} />VERA SYSTEM</span>
          <span className="inline-flex items-center gap-2"><Leaf size={13} />SMART ALOE CULTIVATION</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck size={13} />PRECISION PLANT HEALTH</span>
        </div>
      </section>
    </div>
  )
}

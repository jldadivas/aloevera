import { Link } from 'react-router-dom'
import { ArrowRight, Github, Facebook, Cpu, Database, LayoutPanelTop, ShieldCheck, Sprout, Wrench, ExternalLink } from 'lucide-react'
import { useState } from 'react'

const contributors = [
  {
    name: 'Melvin Catuera',
    role: 'Team Lead · Backend Developer',
    focus: 'Responsible for overall project direction, backend service architecture, and core API implementation across the Vera platform.',
    image: '/images/melvin.png',
    github: 'https://github.com/',
    facebook: 'https://facebook.com/',
    contributions: [
      'Led project planning and backend architecture decisions',
      'Implemented server-side modules and integration endpoints',
      'Coordinated technical delivery across the development team',
    ],
    icon: Wrench,
    accent: '#166534',
  },
  {
    name: 'John Louis Dadivas',
    role: 'Backend Developer',
    focus: 'Focused on API workflow design, backend reliability, and data operations supporting the ticketing and community modules.',
    image: '/images/lalaya.png',
    github: 'https://github.com/',
    facebook: 'https://facebook.com/',
    contributions: [
      'Developed backend routes and ticketing/community data flows',
      'Supported database integration and model consistency',
      'Improved backend response handling for frontend modules',
    ],
    icon: Database,
    accent: '#15803d',
  },
  {
    name: 'Hazel Anne Elumba',
    role: 'Frontend Developer',
    focus: 'Handled UI implementation, responsive layout behavior, and maintaining visual consistency across all user-facing components.',
    image: '/images/hazel.jpg',
    github: 'https://github.com/',
    facebook: 'https://www.facebook.com/hazel.anne.573818',
    contributions: [
      'Built and refined key user-facing page interfaces',
      'Improved component styling and layout responsiveness',
      'Ensured clean visual hierarchy across all modules',
    ],
    icon: LayoutPanelTop,
    accent: '#16a34a',
  },
  {
    name: 'Maria Alyssha Sacay',
    role: 'Frontend Developer',
    focus: 'Drove user experience polish, page-level styling decisions, and frontend consistency across the entire application.',
    image: '/images/aly.png',
    github: 'https://github.com/',
    facebook: 'https://facebook.com/',
    contributions: [
      'Contributed to frontend feature implementation and visual polish',
      'Improved UI clarity for analytics and content-heavy pages',
      'Supported cohesive visual design system across all screens',
    ],
    icon: Cpu,
    accent: '#22c55e',
  },
]

const statItems = [
  { label: 'Team Members', value: '4' },
  { label: 'Core Modules', value: '12+' },
  { label: 'Academic Year', value: '2025-26' },
  { label: 'Program', value: 'Bachelor of Science in Information Technology' },
]

export default function Contributors() {
  const [hovered, setHovered] = useState(null)

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 76px)',
        background: 'linear-gradient(160deg, #f0fdf4 0%, #dcfce7 30%, #f0fdf4 60%, #ecfdf5 100%)',
        color: '#052e16',
        fontFamily: '"DM Sans", "Outfit", system-ui, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

        .contributor-card {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .contributor-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 32px 64px rgba(5, 46, 22, 0.18);
        }
        .social-btn {
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: #14532d;
          color: #fff;
          border-color: #14532d;
        }
        .contribution-item {
          position: relative;
          padding-left: 1rem;
        }
        .contribution-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(to bottom, #16a34a, #4ade80);
          border-radius: 999px;
        }
        .stat-box {
          transition: background 0.2s ease;
        }
        .stat-box:hover {
          background: rgba(20, 83, 45, 0.07);
        }
        .img-frame {
          transition: transform 0.4s ease;
        }
        .contributor-card:hover .img-frame {
          transform: scale(1.03);
        }
        .hero-badge {
          animation: fadeSlideIn 0.7s ease forwards;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cta-link {
          transition: all 0.2s ease;
        }
        .cta-link:hover {
          background: #14532d;
          box-shadow: 0 8px 24px rgba(5, 46, 22, 0.3);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '380px', height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '10%',
          width: '260px', height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(134,239,172,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 32px 52px' }}>
          <span
            className="hero-badge"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '11px', fontWeight: '700',
              letterSpacing: '0.18em', color: '#86efac',
            }}
          >
            <Sprout size={12} /> VERA DEVELOPMENT TEAM
          </span>

          <h1 style={{
            marginTop: '18px',
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: '400',
            color: '#f0fdf4',
            lineHeight: '1.2',
            maxWidth: '680px',
          }}>
            The People Behind<br />
            <em style={{ color: '#4ade80', fontStyle: 'italic' }}>Vera Aloe Monitoring</em>
          </h1>

          <p style={{
            marginTop: '16px', maxWidth: '580px',
            fontSize: '15px', fontWeight: '400',
            lineHeight: '1.75', color: '#bbf7d0',
          }}>
            A focused team of four from TUP-Taguig, Group 3 of BSIT-NS-3A, who designed and
            engineered this platform from the ground up — combining backend reliability with
            polished frontend experiences.
          </p>

          {/* Stats row */}
          <div style={{
            marginTop: '36px',
            display: 'flex', flexWrap: 'wrap', gap: '12px',
          }}>
            {statItems.map(({ label, value }) => (
              <div
                key={label}
                className="stat-box"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '14px 22px',
                  cursor: 'default',
                }}
              >
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#4ade80', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#86efac', letterSpacing: '0.1em', marginTop: '4px' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Group Feature Card ──────────────────────────── */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 32px 16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid #bbf7d0',
          boxShadow: '0 20px 48px rgba(5,46,22,0.12)',
          background: '#fff',
        }}>
          <div style={{ position: 'relative', minHeight: '320px' }}>
            <img
              src="/images/group%20photo.jpg"
              alt="Vera contributors group photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '280px' }}
              loading="lazy"
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(5,46,22,0.75) 0%, transparent 55%)',
            }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '24px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', color: '#86efac' }}>VERA TEAM · GROUP 3</p>
              <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>Core Contributors</p>
            </div>
          </div>

          <div style={{
            padding: '36px 32px',
            background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', color: '#16a34a' }}>GROUP PROFILE</p>
            <h3 style={{
              marginTop: '10px',
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '26px', fontWeight: '400',
              color: '#052e16', lineHeight: '1.3',
            }}>
              BSIT-NS-3A<br />
              <span style={{ color: '#166534' }}>TUP-Taguig</span>
            </h3>
            <p style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.75', color: '#166534' }}>
              We are a cross-functional team specializing in backend systems and frontend
              engineering. Our collaboration focuses on building production-ready platforms
              that serve real agricultural decision-making needs.
            </p>
            <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.75', color: '#15803d' }}>
              Vera was built with a strong emphasis on system reliability, clean UI design,
              and meaningful AI-assisted insights for aloe growers.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['Backend Engineering', 'Frontend UI', 'AI Integration', 'System Design'].map(tag => (
                <span key={tag} style={{
                  background: '#dcfce7', border: '1px solid #86efac',
                  borderRadius: '999px', padding: '4px 12px',
                  fontSize: '12px', fontWeight: '600', color: '#14532d',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Contributors Grid ──────────────────────────── */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 48px' }}>
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', color: '#16a34a' }}>TEAM MEMBERS</p>
          <h2 style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '28px', fontWeight: '400',
            color: '#052e16', marginTop: '6px',
          }}>Individual Contributions</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {contributors.map(({ name, role, focus, image, contributions, icon: Icon, github, facebook, accent }) => (
            <article
              key={name}
              className="contributor-card"
              style={{
                borderRadius: '20px',
                border: '1px solid #bbf7d0',
                background: '#fff',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(5,46,22,0.08)',
              }}
            >
              {/* Image */}
              <div style={{ overflow: 'hidden', height: '190px', background: '#dcfce7' }}>
                <img
                  src={image}
                  alt={`${name} profile`}
                  className="img-frame"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              </div>

              <div style={{ padding: '18px' }}>
                {/* Icon + Social row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                    color: accent,
                  }}>
                    <Icon size={17} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '11px', fontWeight: '600',
                        color: '#166534', textDecoration: 'none',
                        background: '#f0fdf4',
                      }}
                    >
                      <Github size={12} /> GitHub
                    </a>
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '11px', fontWeight: '600',
                        color: '#166534', textDecoration: 'none',
                        background: '#f0fdf4',
                      }}
                    >
                      <Facebook size={12} /> Facebook
                    </a>
                  </div>
                </div>

                {/* Name & role */}
                <h2 style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: '22px', fontWeight: '400',
                  color: '#052e16', lineHeight: '1.2',
                }}>{name}</h2>
                <p style={{
                  marginTop: '4px',
                  fontSize: '11px', fontWeight: '700',
                  letterSpacing: '0.1em', color: accent,
                  textTransform: 'uppercase',
                }}>{role}</p>

                <p style={{
                  marginTop: '10px',
                  fontSize: '13.5px', lineHeight: '1.7',
                  color: '#166534',
                }}>{focus}</p>

                {/* Contributions */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contributions.map((entry) => (
                    <div
                      key={entry}
                      className="contribution-item"
                      style={{
                        fontSize: '13px',
                        lineHeight: '1.55',
                        color: '#14532d',
                        padding: '6px 0 6px 14px',
                      }}
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ─────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid #bbf7d0',
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '48px 32px',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: '24px',
        }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', color: '#86efac' }}>VERA DEVELOPMENT TEAM · BSIT-NS-3A</p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: '300', color: '#f0fdf4', fontFamily: '"DM Serif Display", Georgia, serif' }}>
              Built with precision.<br /><em style={{ color: '#4ade80' }}>Designed for growers.</em>
            </p>
            <p style={{ marginTop: '8px', fontSize: '13px', color: '#86efac', maxWidth: '420px', lineHeight: '1.65' }}>
              Our platform combines AI-assisted insights with reliable engineering to support
              real decision-making in aloe cultivation.
            </p>
          </div>

          <Link
            to="/register"
            className="cta-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#16a34a',
              border: '1px solid #4ade80',
              borderRadius: '14px',
              padding: '14px 26px',
              fontSize: '14px', fontWeight: '700',
              color: '#fff', textDecoration: 'none',
            }}
          >
            Start Using Vera <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Disclosure ─────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 32px 32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          fontSize: '12px', fontWeight: '500', color: '#15803d',
          background: 'rgba(220,252,231,0.6)',
          border: '1px solid #bbf7d0',
          borderRadius: '10px', padding: '8px 14px',
        }}>
          <ShieldCheck size={13} />
          Contributor details are presented for system transparency and academic recognition.
        </div>
      </div>
    </div>
  )
}
import { Link } from "react-router-dom";

const previewCards = [
  { label: "Student", title: "My Progress", value: "12 courses | 4 in progress" },
  { label: "Instructor", title: "Grading queue", value: "18 submissions" },
  { label: "Admin", title: "Platform health", value: "99.98% uptime this quarter" },
  { label: "Creator", title: "Draft pipeline", value: "12 modules in review" },
];

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <header className="landing-nav">
          <div className="landing-brand">
            <div className="landing-brand-icon">NL</div>
            <div>
              <h1>NovaLearn</h1>
              <p>Learn without limits</p>
            </div>
          </div>

          <div className="landing-actions">
            <Link to="/login" className="landing-link">
              Login
            </Link>
            <Link to="/register" className="landing-primary-button">
              Get Started
            </Link>
          </div>
        </header>

        <div className="landing-copy">
          <span className="landing-pill">Trusted dashboards for students, instructors, and teams</span>
          <h2>
            Learn Without Limits with <span>NovaLearn</span>
          </h2>
          <p>
            A modern learning platform that connects students, instructors, admins, and creators
            in one unified experience.
          </p>
          <div className="landing-cta-row">
            <Link to="/register" className="landing-gradient-button">
              Start Learning Today
            </Link>
            <Link to="/login" className="landing-inline-link">
              Already have an account?
            </Link>
          </div>
        </div>

        <section className="landing-preview">
          <div className="landing-preview-head">
            <div>
              <p>Dashboard preview</p>
              <strong>Student | Instructor | Admin | Creator</strong>
            </div>
            <span className="landing-status">Live analytics</span>
          </div>
          <div className="landing-preview-grid">
            {previewCards.map((card) => (
              <article key={card.label} className="landing-preview-card">
                <span>{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.value}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

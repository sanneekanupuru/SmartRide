// src/pages/RoleSelect.jsx
import { Link } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";

export default function RoleSelect() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brandBlue via-brandGreen to-purple-700">
      {/* Soft decorative overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.03), transparent 6%)," +
            "radial-gradient(circle at 90% 80%, rgba(255,255,255,0.03), transparent 6%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl px-6 py-16">
        {/* HERO - centered on small screens, left-aligned on medium+ */}
        <div className="max-w-6xl mx-auto">
          <header className="text-center md:text-left mb-10 md:mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-sm leading-tight">
              Welcome to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-white">
                SmartRide
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl mx-auto md:mx-0">
              A smarter, safer way to share rides. Choose a role to get started — offer seats or find a comfortable ride.
            </p>
          </header>

          {/* Cards grid: responsive, equal-height cards */}
          <section className="mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              <RoleCard
                to="/driver/login"
                title="Continue as Driver"
                accent="text-brandBlue"
                icon="🚗"
                bullets={["Post rides", "Manage passengers", "Track earnings"]}
              />

              <RoleCard
                to="/passenger/login"
                title="Continue as Passenger"
                accent="text-brandGreen"
                icon="🧑‍🤝‍🧑"
                bullets={["Search rides", "Request seats", "Pay securely"]}
              />

              <RoleCard
                to="/admin/login"
                title="Continue as Admin"
                accent="text-purple-500"
                icon="🛡️"
                bullets={["Platform controls", "(admin only)"]}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Floating Chatbot (visible on landing) */}
      <ChatbotWidget />
    </div>
  );
}

/* ---------- small RoleCard component inside same file for clarity ---------- */
function RoleCard({ to, title, accent = "text-white", icon = "❖", bullets = [] }) {
  return (
    <Link
      to={to}
      aria-label={title}
      className="group block w-full bg-white/95 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition p-6 flex flex-col justify-between min-h-[220px]"
    >
      <div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm mb-4">
          <div className="text-2xl leading-none">{icon}</div>
        </div>

        <h3 className={`font-semibold text-lg ${accent} mb-3`}>{title}</h3>

        <ul className="text-sm text-gray-600 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-xs mt-1 text-gray-400">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <span className="inline-block px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-gray-700 group-hover:bg-gray-200 transition">
          Get started →
        </span>
      </div>
    </Link>
  );
}

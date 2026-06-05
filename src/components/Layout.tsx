import { Link, Outlet, useLocation } from "react-router-dom";
import { useCollectorContext } from "../context/CollectorContext";
import { meta } from "../data";
import { DNA_ASSETS } from "../theme/assets";
import { PageBackdrop } from "./PageBackdrop";

const NAV = [
  { to: "/", label: "Collection" },
  { to: "/board", label: "Expedition" },
  { to: "/guides", label: "Guides" },
  { to: "/import", label: "Import" },
  { to: "/characters", label: "Characters" },
  { to: "/weapons", label: "Weapons" },
  { to: "/wedges", label: "Wedges" },
];

export function Layout() {
  const { pathname } = useLocation();
  const { stats } = useCollectorContext();

  return (
    <div className="app">
      <PageBackdrop />
      <div className="banner">
        <img
          src={DNA_ASSETS.floraAbsolver}
          alt="Flora — Absolver"
          className="banner__img"
        />
        <div className="banner__shade" />
      </div>
      <header className="header">
        <Link to="/" className="header__logo">
          <span className="header__logo-mark">DNA</span>
          <span className="header__logo-text">Collector</span>
        </Link>
        <nav className="nav">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={pathname === to ? "nav__link nav__link--on" : "nav__link"}
            >
              {label}
              {(to === "/" || to === "/board") && stats.total > 0 && (
                <span className="nav__count">
                  {stats.collected}/{stats.total}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        Data v{meta.version} ·{" "}
        <a href="https://boarhat.gg/games/duet-night-abyss/" target="_blank" rel="noreferrer">
          Boarhat.gg
        </a>
      </footer>
    </div>
  );
}

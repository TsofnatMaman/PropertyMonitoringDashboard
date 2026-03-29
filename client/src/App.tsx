import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import CasesPage from "./pages/CasesPage";
import PropertiesPage from "./pages/PropertiesPage";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container">
          <div className="app-header__top">
            <div>
              <h1 className="app-title">Property Monitoring Dashboard</h1>
              <p className="app-subtitle">
                Track properties, sync monitoring data, and review cases.
              </p>
            </div>
          </div>

          <nav className="app-tabs">
            <NavLink
              to="/cases"
              className={({ isActive }) =>
                isActive ? "app-tab app-tab--active" : "app-tab"
              }
            >
              Cases
            </NavLink>

            <NavLink
              to="/properties"
              className={({ isActive }) =>
                isActive ? "app-tab app-tab--active" : "app-tab"
              }
            >
              Properties
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/cases" replace />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
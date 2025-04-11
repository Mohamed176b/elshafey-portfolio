import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardAnimationObserver from "./DashboardAnimationObserver";
import "../../styles/DashboardAnimations.css";

/**
 * Main Dashboard Layout
 * Manages the dashboard's state and layout including:
 * - User authentication status
 * - Sidebar visibility
 * - Route handling
 * - Animation effects
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(location.pathname);

  useEffect(() => {
    document.title = "Elshafey Dashboard";
  }, []);

  useEffect(() => {
    setActiveNav(location.pathname);
  }, [location.pathname]);

  const handleNavigation = useCallback(
    (path) => {
      setActiveNav(path);
      navigate(path);
    },
    [navigate]
  );

  const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
      const mediaQuery = window.matchMedia(query);
      const handleChange = (event) => setMatches(event.matches);

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  const sidebarClassName = useMemo(() => {
    return `sidebar ${isMobile ? "sidebar-mob" : ""}`;
  }, [isMobile]);

  const navItems = useMemo(
    () => [
      { path: "/dashboard", icon: "fa-house", label: "HOME" },
      { path: "/", icon: "fa-address-card", label: "PORTFOLIO" },
      {
        path: "/dashboard/projects",
        icon: "fa-diagram-project",
        label: "PROJECTS",
        checkStartsWith: true,
      },
      {
        path: "/dashboard/analytics",
        icon: "fa-chart-line",
        label: "ANALYTICS",
      },
      { path: "/dashboard/profile", icon: "fa-address-card", label: "PROFILE" },
      {
        path: "/dashboard/contact-requests",
        icon: "fa-envelope",
        label: "CONTACT REQUESTS",
      },
      { path: "/dashboard/settings", icon: "fa-gear", label: "SETTINGS" },
    ],
    []
  );

  return (
    <div className="dashboard-page">
      <DashboardAnimationObserver />
      <div className={sidebarClassName}>
        <div className="header">
          <img
            src={`${process.env.PUBLIC_URL}/front-end.png`}
            alt="logo"
            loading="lazy"
          ></img>
          <h1>Elshafey Dashboard</h1>
        </div>
        <div className="navs">
          {navItems.map(({ path, icon, label, checkStartsWith }) => (
            <div
              key={path}
              className={`nav ${
                checkStartsWith
                  ? activeNav.startsWith(path)
                    ? "active-nav"
                    : ""
                  : activeNav === path
                  ? "active-nav"
                  : ""
              }`}
              onClick={() => handleNavigation(path)}
            >
              <i className={`fa-solid ${icon}`}></i>
              <h2>{label}</h2>
            </div>
          ))}
        </div>
      </div>
      <div className="dash-sel-page" id="dash-sel-page">
        <Outlet />
      </div>
    </div>
  );
};

export default React.memo(Dashboard);

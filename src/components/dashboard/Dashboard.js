import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import DashboardAnimationObserver from "./DashboardAnimationObserver";
import "../../styles/DashboardAnimations.css";



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

  const handleNavigation = (path) => {
    setActiveNav(path);
    navigate(path);
  };

  const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);
    useEffect(() => {
      const mediaQuery = window.matchMedia(query);

      const handleChange = (event) => {
        setMatches(event.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="dashboard-page">
      <DashboardAnimationObserver />
      <div className={`sidebar ${isMobile ? "sidebar-mob" : ""}`}>
        <div className="header">
          <img src={`${process.env.PUBLIC_URL}/front-end.png`} alt="logo"></img>
          <h1>Elshafey Dashboard</h1>
        </div>
        <div className="navs">
          <div
            className={`nav ${activeNav === "/dashboard" ? "active-nav" : ""}`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <i className="fa-solid fa-house"></i>
            <h2>Home</h2>
          </div>
          <div
            className={`nav ${
              activeNav.startsWith("/dashboard/projects") ? "active-nav" : ""
            }`}
            onClick={() => handleNavigation("/dashboard/projects")}
          >
            <i className="fa-solid fa-diagram-project"></i>
            <h2>Projects</h2>
          </div>
          <div
            className={`nav ${
              activeNav === "/dashboard/analytics" ? "active-nav" : ""
            }`}
            onClick={() => handleNavigation("/dashboard/analytics")}
          >
            <i className="fa-solid fa-chart-line"></i>
            <h2>Analytics</h2>
          </div>
          <div
            className={`nav ${
              activeNav === "/dashboard/profile" ? "active-nav" : ""
            }`}
            onClick={() => handleNavigation("/dashboard/profile")}
          >
            <i className="fa-solid fa-address-card"></i>
            <h2>Profile</h2>
          </div>
          <div
            className={`nav ${
              activeNav === "/dashboard/contact-requests" ? "active-nav" : ""
            }`}
            onClick={() => handleNavigation("/dashboard/contact-requests")}
          >
            <i className="fa-solid fa-envelope"></i>
            <h2>Contact Requests</h2>
          </div>
          <div
            className={`nav ${
              activeNav === "/dashboard/settings" ? "active-nav" : ""
            }`}
            onClick={() => handleNavigation("/dashboard/settings")}
          >
            <i className="fa-solid fa-gear"></i>
            <h2>Settings</h2>
          </div>
        </div>
      </div>
      <div className="dash-sel-page" id="dash-sel-page">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;

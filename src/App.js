import "./styles/App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AdminLogin from "./components/dashboard/AdminLogin";
import Dashboard from "./components/dashboard/Dashboard";
import ProtectedRoute from "./components/dashboard/ProtectedRoute";
import Home from "./components/dashboard/Home";
import Projects from "./components/dashboard/Projects";
import Profile from "./components/dashboard/Profile";
import Portfolio from "./components/portfolio/Portfolio";
import AddNewProject from "./components/dashboard/AddNewProject";
import AllProjects from "./components/dashboard/AllProjects";
import Settings from "./components/dashboard/Settings";
import ProjectDetail from "./components/dashboard/ProjectDetail";
import EditProject from "./components/dashboard/EditProject";
import SplashScreen from "./components/portfolio/SplashScreen";
import ProjectPage from "./components/portfolio/ProjectPage";
import ContactRequests from "./components/dashboard/ContactRequests";
import Analytics from "./components/dashboard/Analytics";



function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  
  // If we're not on the home page (portfolio), don't show the splash screen
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== "/" && path !== "") {
      setShowSplash(false);
    }
  }, []);
  
  const handleSplashFinish = (data) => {
    setShowSplash(false);
    setPortfolioData(data);
  };
  
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Routes>
      {/* Portfolio Pages */}
      <Route path="/" element={<Portfolio initialData={portfolioData} />} />
      <Route path="/project/:projectId" element={<ProjectPage />} />
      
      {/* Dashboard Login Page */}
      <Route path="/admin" element={<AdminLogin />} />
      {/* Dashboard Page with Protected Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        {/* Nested Routes inside Dashboard */}
        <Route index element={<Home />} /> {/* Default route for /dashboard */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="projects" element={<Projects />}>
          {/* Default route for /projects */}
          <Route index element={<AllProjects />} />
          <Route path=":projectId" element={<ProjectDetail />} />
          {/* Nested routes under /dashboard/projects */}
          <Route path="add-new-project" element={<AddNewProject />} />
          <Route path="edit-project/:projectId" element={<EditProject />} />
        </Route>
        <Route path="profile" element={<Profile />} />
        <Route path="contact-requests" element={<ContactRequests />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      {/* 404 Page */}
      <Route path="*" element={<div id="error">Error 404: Not Found</div>} />
    </Routes>
  );
}

export default App;

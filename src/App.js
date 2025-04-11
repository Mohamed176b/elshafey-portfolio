import "./styles/App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import SplashScreen from "./components/portfolio/SplashScreen";
import ProtectedRoute from "./components/dashboard/ProtectedRoute";
// Lazy loading components
const Portfolio = React.lazy(() => import("./components/portfolio/Portfolio"));
const ProjectPage = React.lazy(() => import("./components/portfolio/ProjectPage"));
const Dashboard = React.lazy(() => import("./components/dashboard/Dashboard"));
const AdminLogin = React.lazy(() => import("./components/dashboard/AdminLogin"));
const Home = React.lazy(() => import("./components/dashboard/Home"));
const Projects = React.lazy(() => import("./components/dashboard/Projects"));
const Profile = React.lazy(() => import("./components/dashboard/Profile"));
const AddNewProject = React.lazy(() => import("./components/dashboard/AddNewProject"));
const AllProjects = React.lazy(() => import("./components/dashboard/AllProjects"));
const Settings = React.lazy(() => import("./components/dashboard/Settings"));
const ProjectDetail = React.lazy(() => import("./components/dashboard/ProjectDetail"));
const EditProject = React.lazy(() => import("./components/dashboard/EditProject"));
const ContactRequests = React.lazy(() => import("./components/dashboard/ContactRequests"));
const Analytics = React.lazy(() => import("./components/dashboard/Analytics"));
const NotFound = React.lazy(() => import("./components/shared/NotFound"));



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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

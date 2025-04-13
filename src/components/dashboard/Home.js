import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { fetchVisitStats } from "../../utils/analyticsUtils";
import moment from "moment";

const WelcomeSection = React.memo(
  ({ name, userImg, projectsCount, handleNavigation }) => (
    <div className="welcome section">
      <div className="welcome-sub">
        <div>
          <h3 className="section-title home-sec-t">Welcome</h3>
          <p className="sub-para">{name.split(" ")[1]}</p>
        </div>
        <img src="/welcome.png" alt="Welcome" loading="lazy" />
      </div>
      <div className="welcome-desc">
        <div className="profile-img">
          <img src={userImg} alt="avatar" loading="lazy"></img>
        </div>
        <div className="welcome-desc-sub">
          <div className="welcome-desc-subT">
            <h3 className="section3-title">{name}</h3>
            <p className="sub-para">Developer</p>
          </div>
          <div className="welcome-desc-subT">
            <h3 className="section3-title">{projectsCount}</h3>
            <p className="sub-para">Projects</p>
          </div>
        </div>
        <button
          className="home-btn spefBtn view-profile"
          onClick={() => handleNavigation("/dashboard/profile")}
        >
          Profile
        </button>
      </div>
    </div>
  )
);

const ProjectsSection = React.memo(
  ({ projects, maxLength, handleNavigation }) => (
    <div className="latest-projects section">
      <div>
        <h3 className="section-title">Latest Projects</h3>
      </div>
      <div className="card">
        {projects.length > 0 ? (
          projects.map((project, index) => (
            <div
              className="project-sub"
              key={index}
              onClick={() =>
                handleNavigation(`/dashboard/projects/${project.id}`)
              }
            >
              <div>
                <h3 className="section2-title">{project.name}</h3>
                <p className="sub-para">
                  {project.description.length > maxLength
                    ? `${project.description.slice(0, maxLength)}...`
                    : project.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-items-message">
            <p>No projects available</p>
          </div>
        )}
      </div>
      <button
        className="home-btn spefBtn view-all-projects"
        onClick={() => handleNavigation("/dashboard/projects")}
      >
        See All Projects
      </button>
    </div>
  )
);

const MessagesSection = React.memo(
  ({ messages, maxLength, handleNavigation }) => (
    <div className="recent-messages section">
      <div>
        <h3 className="section-title">Recent Messages</h3>
      </div>
      <div className="card">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              className="message-sub"
              key={index}
              onClick={() => handleNavigation("/dashboard/contact-requests")}
            >
              <div className="message-header">
                <div className="message-sender">
                  <h3 className="section2-title">{message.name}</h3>
                  <span className="message-email">{message.email}</span>
                </div>
                <div className="message-date">
                  {moment(message.created_at).format("DD/MM/YYYY")}
                </div>
              </div>
              <div className="message-status">
                <span className={`status-badge status-${message.status}`}>
                  {message.status}
                </span>
              </div>
              <p className="sub-para">
                {message.message.length > maxLength
                  ? `${message.message.slice(0, maxLength)}...`
                  : message.message}
              </p>
            </div>
          ))
        ) : (
          <div className="no-items-message">
            <p>No recent messages</p>
          </div>
        )}
      </div>
      <button
        className="home-btn spefBtn view-all-messages"
        onClick={() => handleNavigation("/dashboard/contact-requests")}
      >
        View All Messages
      </button>
    </div>
  )
);

const AnalyticsSection = React.memo(({ analyticsData, handleNavigation }) => (
  <div className="analytics-summary section grid-span-2">
    <div className="welcome-sub">
      <div>
        <h3 className="section-title home-sec-t">Analytics Summary</h3>
        <p className="sub-para">Portfolio Performance</p>
      </div>
      <img src="/analytics-icon.png" alt="Analytics" loading="lazy" />
    </div>

    <div className="welcome-desc">
      {analyticsData ? (
        <div className="analytics-stats-wrapper">
          <div className="analytics-stats-row">
            <div className="analytics-stats-item">
              <div className="stats-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="stats-content">
                <h3 className="section3-title">{analyticsData.totalVisits}</h3>
                <p className="sub-para">Total Visits</p>
              </div>
            </div>
            <div className="analytics-stats-item">
              <div className="stats-icon">
                <i className="fa-solid fa-calendar-day"></i>
              </div>
              <div className="stats-content">
                <h3 className="section3-title">
                  {analyticsData.todayHomeVisits}
                </h3>
                <p className="sub-para">Today</p>
              </div>
            </div>
          </div>
          <div className="analytics-stats-row">
            <div className="analytics-stats-item">
              <div className="stats-icon">
                <i className="fa-solid fa-calendar-week"></i>
              </div>
              <div className="stats-content">
                <h3 className="section3-title">
                  {analyticsData.weekHomeVisits}
                </h3>
                <p className="sub-para">This Week</p>
              </div>
            </div>
            <div className="analytics-stats-item">
              <div className="stats-icon">
                <i className="fa-solid fa-calendar-minus"></i>
              </div>
              <div className="stats-content">
                <h3 className="section3-title">
                  {analyticsData.monthHomeVisits}
                </h3>
                <p className="sub-para">This Month</p>
              </div>
            </div>
          </div>

          <div className="analytics-stats-row device-browser-stats">
            {analyticsData.userAgentData &&
              analyticsData.userAgentData.length > 0 && (
                <div className="analytics-stats-item device-stats">
                  <div className="stats-icon">
                    <i className="fa-solid fa-mobile-screen-button"></i>
                  </div>
                  <div className="stats-content">
                    <h3 className="section3-title">
                      {analyticsData.userAgentData[0].name}
                    </h3>
                    <p className="sub-para">Top Device</p>
                  </div>
                </div>
              )}
            {analyticsData.browserData &&
              analyticsData.browserData.length > 0 && (
                <div className="analytics-stats-item browser-stats">
                  <div className="stats-icon">
                    <i className="fa-solid fa-globe"></i>
                  </div>
                  <div className="stats-content">
                    <h3 className="section3-title">
                      {analyticsData.browserData[0].name}
                    </h3>
                    <p className="sub-para">Top Browser</p>
                  </div>
                </div>
              )}
          </div>

          {analyticsData.projectVisits &&
            analyticsData.projectVisits.length > 0 && (
              <div className="analytics-stats-row top-project">
                <div className="analytics-stats-item">
                  <div className="stats-icon">
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <div className="stats-content">
                    <h3 className="section3-title">
                      {analyticsData.projectVisits[0].project_name}
                    </h3>
                    <p className="sub-para">Most Visited Project</p>
                  </div>
                </div>
              </div>
            )}

          {analyticsData.referrerData &&
            analyticsData.referrerData.length > 0 && (
              <div className="analytics-stats-row traffic-source">
                <div className="analytics-stats-item">
                  <div className="stats-icon">
                    <i className="fa-solid fa-share-nodes"></i>
                  </div>
                  <div className="stats-content">
                    <h3 className="section3-title">
                      {analyticsData.referrerData[0].name}
                    </h3>
                    <p className="sub-para">Top Traffic Source</p>
                  </div>
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="no-items-message">
          <p>Loading analytics data...</p>
        </div>
      )}
      <button
        className="home-btn spefBtn view-analytics"
        onClick={() => handleNavigation("/dashboard/analytics")}
      >
        View Full Analytics
      </button>
    </div>
  </div>
));

const Home = () => {
  const [name, setName] = useState("");
  const [userImg, setUserImg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState({
    maxLength: null,
    numberOfProjects: null,
    numberOfMessages: null,
  });

  // Memoize the navigation handler
  const handleNavigation = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  // Memoize loadDashboardConfig
  const loadDashboardConfig = useCallback(async () => {
    try {
      console.log("Fetching dashboard config for profile:", profileId);
      const { data, error } = await supabase
        .from("dashboard_config")
        .select("*")
        .eq("profile_id", profileId);

      if (error) {
        console.error("Error fetching dashboard config:", error);
        setDashboardConfig({
          maxLength: 70,
          numberOfProjects: 3,
          numberOfMessages: 3,
        });
        return;
      }

      if (data && data.length > 0) {
        const config = data[0];
        console.log("Config loaded from DB:", config);

        setDashboardConfig({
          maxLength: config.max_length || 70,
          numberOfProjects: config.number_of_projects || 3,
          numberOfMessages: config.number_of_messages || 3,
        });
      } else {
        console.log("No dashboard config found, using defaults");
        setDashboardConfig({
          maxLength: 70,
          numberOfProjects: 3,
          numberOfMessages: 3,
        });
      }
    } catch (error) {
      console.error("Error in loadDashboardConfig:", error);
      setDashboardConfig({
        maxLength: 70,
        numberOfProjects: 3,
        numberOfMessages: 3,
      });
    }
  }, [profileId]);

  // Memoize loadProjects
  const loadProjects = useCallback(async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profileId)
        .order("display_order", { ascending: true });

      if (projectsError) {
        console.error("Failure to fetch projects:", projectsError);
        return;
      }

      setProjects(projectsData || []);
      console.log("Projects loaded:", projectsData?.length || 0);
    } catch (error) {
      console.error("Error in loadProjects:", error);
    }
  }, [profileId]);

  // Memoize loadRecentMessages
  const loadRecentMessages = useCallback(async () => {
    try {
      const messageLimit = dashboardConfig.numberOfMessages || 3;
      console.log("Loading messages with limit:", messageLimit);

      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(messageLimit);

      if (error) {
        console.error("Failed to fetch recent messages:", error);
        return;
      }

      setRecentMessages(data || []);
      console.log("Messages loaded:", data?.length || 0);
    } catch (error) {
      console.error("Error in loadRecentMessages:", error);
    }
  }, [dashboardConfig.numberOfMessages]);

  // Memoize loadAnalyticsData
  const loadAnalyticsData = useCallback(async () => {
    try {
      const stats = await fetchVisitStats();
      setAnalyticsData(stats);
      console.log("Analytics data loaded");
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    }
  }, []);

  // Memoize fetchProfileData
  const fetchProfileData = useCallback(async (user) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (profileError) {
        console.error("Failed to fetch profile! Error:", profileError);
        return;
      }

      const profile =
        profileData && profileData.length > 0 ? profileData[0] : null;

      if (profile) {
        setName(profile.name || "");
        setUserImg(profile.user_img || "");
        setProfileId(profile.id);
      } else {
        console.log(
          "No profile found for user. Initializing with empty values."
        );
        setUserImg("");
      }
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
    }
  }, []);

  // Memoize filtered projects
  const filteredProjects = useMemo(() => {
    return projects.slice(0, dashboardConfig.numberOfProjects || 3);
  }, [projects, dashboardConfig.numberOfProjects]);

  const welcomeData = useMemo(
    () => ({
      name,
      userImg,
      projectsCount: projects.length,
    }),
    [name, userImg, projects.length]
  );

  const projectsData = useMemo(
    () => ({
      projects: filteredProjects,
      maxLength: dashboardConfig.maxLength,
    }),
    [filteredProjects, dashboardConfig.maxLength]
  );

  const messagesData = useMemo(
    () => ({
      messages: recentMessages,
      maxLength: dashboardConfig.maxLength,
    }),
    [recentMessages, dashboardConfig.maxLength]
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const sessionResult = await supabase.auth.getSession();
        if (!sessionResult.data.session) {
          navigate("/admin");
          return;
        }

        const user = sessionResult.data.session.user;
        await fetchProfileData(user);

        if (profileId) {
          await Promise.all([
            loadDashboardConfig(),
            loadProjects(),
            loadRecentMessages(),
            loadAnalyticsData(),
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        navigate("/admin");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId]);

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  return (
    <div className="home-page">
      <div className="dash-header">
        <h1 className="title">Home</h1>
      </div>
      <div className="secs">
        <WelcomeSection {...welcomeData} handleNavigation={handleNavigation} />
        <ProjectsSection
          {...projectsData}
          handleNavigation={handleNavigation}
        />
        <MessagesSection
          {...messagesData}
          handleNavigation={handleNavigation}
        />
        <AnalyticsSection
          analyticsData={analyticsData}
          handleNavigation={handleNavigation}
        />
      </div>
    </div>
  );
};

export default React.memo(Home);

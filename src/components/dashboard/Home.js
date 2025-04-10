import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserSession } from "../../utils/authUtils";
import { fetchVisitStats } from "../../utils/analyticsUtils";
import moment from 'moment';

const Home = () => {
  const [name, setName] = useState(""); // Stores the user's name
  const [userImg, setUserImg] = useState(""); // Stores the profile image URL
  const [isLoading, setIsLoading] = useState(true); // Indicates if initial data is being fetched
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [profileId, setProfileId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState({
    maxLength: null,
    numberOfProjects: null,
    numberOfMessages: null
  });
  // Get user from sessionStorage instead of location state
  const user = getUserSession();

  // Principal useEffect para inicializar y cargar la sesión
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        // Obtener sesión de usuario
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error("Session check failed! Error:", sessionError || "No session found");
          navigate("/admin");
          return;
        }
        
        const user = sessionData.session.user;
        await fetchProfileData(user);
      } catch (error) {
        console.error("Error initializing session:", error);
        navigate("/admin");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Cargar datos del perfil
    const fetchProfileData = async (user) => {
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
        
        const profile = profileData && profileData.length > 0 ? profileData[0] : null;
        
        if (profile) {
          // Actualizar datos básicos del perfil
          setName(profile.name || "");
          setUserImg(profile.user_img || "");
          
          // Establecer profileId (esto desencadenará el segundo useEffect)
          setProfileId(profile.id);
        } else {
          console.log("No profile found for user. Initializing with empty values.");
          setUserImg("");
        }
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
      }
    };
    
    initializeSession();
  }, [navigate]); // Solo navigate como dependencia, profileId se maneja en otro useEffect
  
  // useEffect que se ejecuta cuando cambia profileId para cargar datos dependientes
  useEffect(() => {
    // Solo ejecutar si hay un profileId válido
    if (!profileId) return;
    
    const loadDependentData = async () => {
      console.log("Loading data for profileId:", profileId);
      
      // 1. Primero cargar la configuración - ESTO ES CRUCIAL
      await loadDashboardConfig();
      
      // 2. Luego cargar proyectos, mensajes y análisis
      await Promise.all([
        loadProjects(),
        loadRecentMessages(),
        loadAnalyticsData()
      ]);
    };
    
    // Cargar configuración del dashboard
    const loadDashboardConfig = async () => {
      try {
        console.log('Fetching dashboard config for profile:', profileId);
        const { data, error } = await supabase
          .from('dashboard_config')
          .select('*')
          .eq('profile_id', profileId);
          
        if (error) {
          console.error("Error fetching dashboard config:", error);
          // Establecer valores predeterminados en caso de error
          setDashboardConfig({
            maxLength: 70,
            numberOfProjects: 3,
            numberOfMessages: 3
          });
          return;
        }
        
        if (data && data.length > 0) {
          // Configuración encontrada
          const config = data[0];
          console.log('Config loaded from DB:', config);
          
          setDashboardConfig({
            maxLength: config.max_length || 70,
            numberOfProjects: config.number_of_projects || 3,
            numberOfMessages: config.number_of_messages || 3
          });
          console.log("Dashboard config loaded successfully");
        } else {
          // No hay configuración, usar valores predeterminados
          console.log("No dashboard config found, using defaults");
          setDashboardConfig({
            maxLength: 70,
            numberOfProjects: 3,
            numberOfMessages: 3
          });
        }
      } catch (error) {
        console.error("Error in loadDashboardConfig:", error);
        // Asegurar valores predeterminados en caso de excepción
        setDashboardConfig({
          maxLength: 70,
          numberOfProjects: 3,
          numberOfMessages: 3
        });
      }
    };
    
    // Cargar proyectos
    const loadProjects = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("profile_id", profileId)
          .order('display_order', { ascending: true });
          
        if (projectsError) {
          console.error("Failure to fetch projects:", projectsError);
          return;
        }
        
        setProjects(projectsData || []);
        console.log("Projects loaded:", projectsData?.length || 0);
      } catch (error) {
        console.error("Error in loadProjects:", error);
      }
    };
    
    // Cargar mensajes recientes
    const loadRecentMessages = async () => {
      try {
        // Obtener el límite de mensajes de la configuración (ya cargada anteriormente)
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
    };
    
    // Cargar datos de análisis
    const loadAnalyticsData = async () => {
      try {
        const stats = await fetchVisitStats();
        setAnalyticsData(stats);
        console.log("Analytics data loaded");
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      }
    };
    
    loadDependentData();
  }, [profileId]); // Solo se ejecuta cuando cambia profileId

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  return (
    <div className="home-page">
      <div className="dash-header">
        <h1 className="title">Home</h1>
      </div>
      <div className="secs">
        <div className="welcome section">
          <div className="welcome-sub">
            <div>
              <h3 className="section-title home-sec-t">Welcome</h3>
              <p className="sub-para">{name.split(" ")[1]}</p>
            </div>
            <img src="/welcome.png" alt="Welcome" />
          </div>

          <div className="welcome-desc">
            <div className="profile-img">
              <img src={userImg} alt="avatar"></img>
            </div>
            <div className="welcome-desc-sub">
              <div className="welcome-desc-subT">
                <h3 className="section3-title">{name}</h3>
                <p className="sub-para">Develpoer</p>
              </div>
              <div className="welcome-desc-subT">
                <h3 className="section3-title">{projects.length}</h3>
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
        <div className="latest-projects section">
          <div>
            <h3 className="section-title">Latest Projects</h3>
          </div>
          <div className="card">
            {projects.length > 0 ? (
              projects.slice(0, dashboardConfig.numberOfProjects || 3).map((project, index) => (
                <div
                  className="project-sub"
                  key={index}
                  onClick={() =>
                    navigate(`/dashboard/projects/${project.id}`)
                  }
                >
                  {/* <div className="pro-imgs"><img src={project.thumbnailUrl} alt={project.name}></img></div> */}
                  <div>
                    <h3 className="section2-title">{project.name}</h3>
                    <p className="sub-para">
                      {project.description.length > (dashboardConfig.maxLength || 70)
                        ? `${project.description.slice(0, dashboardConfig.maxLength || 70)}...`
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
        
        <div className="recent-messages section">
          <div>
            <h3 className="section-title">Recent Messages</h3>
          </div>
          <div className="card">
            {recentMessages.length > 0 ? (
              recentMessages.map((message, index) => (
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
                      {moment(message.created_at).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  <div className="message-status">
                    <span className={`status-badge status-${message.status}`}>{message.status}</span>
                  </div>
                  <p className="sub-para">
                    {message.message.length > (dashboardConfig.maxLength || 70)
                      ? `${message.message.slice(0, dashboardConfig.maxLength || 70)}...`
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
        
        <div className="analytics-summary section grid-span-2">
          <div className="welcome-sub">
            <div>
              <h3 className="section-title home-sec-t">Analytics Summary</h3>
              <p className="sub-para">Portfolio Performance</p>
            </div>
            <img src="/analytics-icon.png" alt="Analytics" />
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
                      <h3 className="section3-title">{analyticsData.todayHomeVisits}</h3>
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
                      <h3 className="section3-title">{analyticsData.weekHomeVisits}</h3>
                      <p className="sub-para">This Week</p>
                    </div>
                  </div>
                  <div className="analytics-stats-item">
                    <div className="stats-icon">
                      <i className="fa-solid fa-calendar-minus"></i>
                    </div>
                    <div className="stats-content">
                      <h3 className="section3-title">{analyticsData.monthHomeVisits}</h3>
                      <p className="sub-para">This Month</p>
                    </div>
                  </div>
                </div>
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
      </div>
    </div>
  );
};

export default Home;

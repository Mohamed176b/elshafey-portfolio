import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import PortfolioFooter from "./PortfolioFooter";
import AnimationObserver from "./AnimationObserver";
import { trackProjectPageVisit } from "../../utils/analyticsUtils";

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const visitTrackedRef = useRef(false);

  const fetchProjectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!projectId) {
        setError("Invalid project ID");
        setTimeout(
          () =>
            navigate("/", {
              state: {
                projects: null,
                profile: null,
                technologies: null,
                profileTechnologies: null,
              },
            }),
          2000
        );
        return;
      }

      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError || !projectData) {
        setError("Project not found");

        // Fetch all required data before redirecting
        const [profileData, projectsData, techData, profileTechData] =
          await Promise.all([
            supabase
              .from("profile")
              .select("*")
              .eq("user_id", process.env.REACT_APP_USER_ID)
              .single(),
            supabase
              .from("projects")
              .select("*")
              .order("display_order", { ascending: true }),
            supabase.from("available_techs").select("*"),
            supabase.from("tech_items").select("*"),
          ]);

        setTimeout(
          () =>
            navigate("/", {
              state: {
                profile: profileData.data || null,
                projects: projectsData.data || [],
                technologies: techData.data || [],
                profileTechnologies: profileTechData.data || [],
              },
            }),
          2000
        );
        return;
      }

      setProject(projectData);

      // Track visit only once when project data is first loaded
      if (!visitTrackedRef.current) {
        trackProjectPageVisit(projectData.id, projectData.name);
        visitTrackedRef.current = true;
      }

      document.title = `${projectData.name} | Elshafey Portfolio`;

      // Fetch technologies
      const { data: techData, error: techError } = await supabase
        .from("available_techs")
        .select("*");

      if (!techError) {
        setTechnologies(techData || []);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      setTimeout(
        () =>
          navigate("/", {
            state: {
              projects: null,
              profile: null,
              technologies: null,
              profileTechnologies: null,
            },
          }),
        2000
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, navigate]);

  // Optimize scroll handler with useCallback
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const totalScroll = docHeight - windowHeight;
    const progress = scrollPosition / totalScroll;
    setScrollProgress(progress);
  }, []);

  // Optimize profile data fetching with useCallback
  const fetchProfileData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjectData();
    fetchProfileData();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProjectData, handleScroll, fetchProfileData]);

  

  // Memoize the getProjectTechs function
  const getProjectTechs = useCallback(
    (projectTechs) => {
      if (!projectTechs) return [];

      try {
        return technologies.filter((tech) => projectTechs.includes(tech.id));
      } catch (error) {
        return [];
      }
    },
    [technologies]
  );

  // Memoize the filtered project technologies
  const projectTechnologies = useMemo(() => {
    if (!project?.techs) return [];
    return getProjectTechs(project.techs);
  }, [project?.techs, getProjectTechs]);

  if (isLoading) {
    return (
      <div className="project-page-loading">
        <div className="page-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-not-found">
        <h1>{error}</h1>
        <p>Redirecting to Portfolio page...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-not-found">
        <h1>Project Not Found</h1>
        <p>Redirecting to Portfolio page...</p>
      </div>
    );
  }

  return (
    <div className="project-page">
      {/* Animation Observer for animations */}
      <AnimationObserver />

      {/* Moving dots background */}
      <div className="animated-dots-bg"></div>
      {/* Progress bar */}
      <div
        className="project-scroll-progress"
        style={{ width: `${scrollProgress * 100}%` }}
      ></div>

      {/* Back button */}
      <button className="project-back-btn" onClick={() => navigate("/")}>
        <i className="fa-solid fa-arrow-left"></i> Back to Portfolio
      </button>

      {/* Hero section with parallax effect */}
      <section
        className="project-hero"
        style={{
          backgroundImage: project.thumbnailUrl
            ? `url(${project.thumbnailUrl})`
            : "none",
        }}
      >
        <div className="project-hero-overlay"></div>
        <div className="project-hero-content">
          <h1>{project.name}</h1>
        </div>
      </section>

      {/* Main content */}
      <div className="project-container">
        {/* Project details section */}
        <section className="project-details-section">
          <div className="project-description-box">
            <h2>Project Overview</h2>
            <div className="project-description">{project.description}</div>

            <div className="project-links">
              {project.demoLink && (
                <a
                  href={project.demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link demo-link"
                >
                  <i className="fa-solid fa-globe"></i> Live Demo
                </a>
              )}

              {project.githubLink && (
                <a
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link github-link"
                >
                  <i className="fa-brands fa-github"></i> GitHub Repository
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="project-features-section">
          <div className="features-container">
            <h2>Key Features</h2>
            <div className="features-grid">
              {project.features &&
              Array.isArray(project.features) &&
              project.features.length > 0 ? (
                project.features.map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-icon">
                      <i className="fa-solid fa-star"></i>
                    </div>
                    <div className="feature-text">
                      <h3>Feature {index + 1}</h3>
                      <p>{feature}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-features">
                  No detailed features available for this project.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Technologies section */}
        <section className="project-technologies-section">
          <h2>Technologies Used</h2>
          <div className="technologies-container">
            {project.techs && projectTechnologies.length > 0 ? (
              <div className="tech-cards">
                {projectTechnologies.map((tech) => (
                  <div key={tech.id} className="tech-card">
                    {tech.logo_url && (
                      <img src={tech.logo_url} alt={tech.name} loading="lazy" />
                    )}
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-tech">
                No technology information available for this project.
              </p>
            )}
          </div>
        </section>

        {/* Screenshots section */}
        {project.thumbnailUrl && (
          <section className="project-screenshot-section">
            <h2>Project Screenshot</h2>
            <div className="screenshot-container">
              <img
                src={project.thumbnailUrl}
                alt={project.name}
                className="project-screenshot"
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* Call to action */}
        <section className="project-cta-section">
          <h2>Interested in this project?</h2>
          <div className="cta-buttons">
            {project.demoLink && (
              <a
                href={project.demoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button"
              >
                View Live Demo
              </a>
            )}
            <button
              onClick={() => navigate("/?tab=projects")}
              className="cta-button secondary"
            >
              Explore More Projects
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <PortfolioFooter profile={profile} scrollToSection={null} />
    </div>
  );
};

export default React.memo(ProjectPage);

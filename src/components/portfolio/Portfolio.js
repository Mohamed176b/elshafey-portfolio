import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PortfolioFooter from "./PortfolioFooter";
import AnimationObserver from "./AnimationObserver";
import { trackHomePageVisit } from "../../utils/analyticsUtils";
import { supabase } from "../../supabase/supabaseClient";
import emailjs from "@emailjs/browser";
import {
  checkRateLimit,
  updateRateLimit,
  formatTimeRemaining,
} from "../../utils/rateLimitUtils";

// Initialize EmailJS with public key
const emailjsPublicKey = process.env.REACT_APP_EMAILJS_API_KEY;
const serviceID = process.env.REACT_APP_SERVICE_ID;
const templateID = process.env.REACT_APP_TEMPLATE_ID;

// Initialize EmailJS
emailjs.init(emailjsPublicKey);

const Portfolio = ({ initialData }) => {
  // All state declarations remain the same at the top
  const [profile, setProfile] = useState(initialData?.profile || null);
  const [projects, setProjects] = useState(initialData?.projects || []);
  const [technologies, setTechnologies] = useState(
    initialData?.technologies || []
  );
  const [profileTechnologies, setProfileTechnologies] = useState(
    initialData?.profileTechnologies || []
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState("projects");
  const [tabsVisible, setTabsVisible] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showRateLimit, setShowRateLimit] = useState(false);

  // Refs
  const contactSectionRef = useRef(null);
  const formRef = useRef(null);
  const visitTrackedRef = useRef(false);
  const timerRef = useRef(null);

  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  const sendEmail = useCallback(async () => {
    const templateParams = { name, email, message };
    return emailjs.send(
      serviceID,
      templateID,
      templateParams,
      emailjsPublicKey
    );
  }, [name, email, message]);

  const updateTimer = useCallback(() => {
    const { canSubmit, waitTime } = checkRateLimit();
    if (!canSubmit && showRateLimit) {
      setTimeRemaining(waitTime);
      setFormStatus({
        type: "warning",
        message: `Please wait ${formatTimeRemaining(
          waitTime
        )} before sending another message.`,
      });
    } else if (canSubmit) {
      setTimeRemaining(0);
      setShowRateLimit(false);
      setFormStatus({ type: "", message: "" });
    }
  }, [showRateLimit]);

  useEffect(() => {
    if (timeRemaining > 0 && showRateLimit) {
      timerRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timeRemaining, updateTimer, showRateLimit]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { canSubmit, waitTime } = checkRateLimit();

      if (!canSubmit) {
        setShowRateLimit(true);
        setTimeRemaining(waitTime);
        setFormStatus({
          type: "warning",
          message: `Please wait ${formatTimeRemaining(
            waitTime
          )} before sending another message.`,
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const { error } = await supabase.from("contact_requests").insert({
          name,
          email,
          message,
          status: "new",
        });

        if (error) throw error;
        await sendEmail();

        updateRateLimit(); // Update rate limit after successful submission
        setShowRateLimit(true);
        updateTimer(); // Start the timer

        setName("");
        setEmail("");
        setMessage("");
        setFormStatus({
          type: "success",
          message: "Message sent successfully. We will contact you soon.",
        });
      } catch (error) {
        console.error("Error:", error);
        setFormStatus({
          type: "error",
          message: "Failed to send message. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, message, sendEmail]
  );

  const navigateToProject = useCallback(
    (project) => {
      navigate(`/project/${project.id}`);
    },
    [navigate]
  );

  const getProjectTechs = useCallback(
    (projectTechs) => {
      if (!projectTechs) return [];
      return technologies.filter((tech) => projectTechs.includes(tech.id));
    },
    [technologies]
  );

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url);

    const element = document.getElementById("portfolio-tab-content");
    window.scrollTo({
      top: element.offsetTop,
      behavior: "smooth",
    });
  }, []);

  const scrollToContact = useCallback(() => {
    contactSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    if (contactSectionRef.current) {
      const contactSectionTop =
        contactSectionRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      setTabsVisible(contactSectionTop >= windowHeight * 0.8);
    }

    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const totalScroll = docHeight - windowHeight;
    setScrollProgress(scrollPosition / totalScroll);
  }, []);

  useEffect(() => {
    document.title = "Mohamed Elshafey | Elshafey Portfolio";

    const fetchData = async () => {
      // Only fetch data if no initialData was provided from SplashScreen
      // This acts as a fallback in case SplashScreen failed to load data
      if (!initialData) {
        setIsLoading(true);
        try {
          // Fetch all required data from Supabase
          const [
            profileResponse,
            projectsResponse,
            techResponse,
            profileTechResponse,
          ] = await Promise.all([
            supabase
              .from("profile")
              .select("*")
              .eq("user_id", process.env.REACT_APP_USER_ID)
              .limit(1),
            supabase
              .from("projects")
              .select("*")
              .order("display_order", { ascending: true }),
            supabase.from("available_techs").select("*"),
            supabase.from("tech_items").select("*"),
          ]);

          // Handle profile data
          if (profileResponse.error) throw profileResponse.error;
          if (!profileResponse.data?.length)
            throw new Error("No profile found");
          setProfile(profileResponse.data[0]);

          if (projectsResponse.error) throw projectsResponse.error;
          if (!projectsResponse.data?.length)
            throw new Error("No projects found");
          setProjects(projectsResponse.data || []);


          if (techResponse.error) throw techResponse.error;
          if (!techResponse.data?.length)
            throw new Error("No Technologies found");
          setTechnologies(techResponse.data || []);


          if (profileTechResponse.error) throw profileTechResponse.error;
          if (!profileTechResponse.data?.length)
            throw new Error("No Profile Technologies found");
          setProfileTechnologies(profileTechResponse.data || []);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    if (!visitTrackedRef.current) {
      trackHomePageVisit();
      visitTrackedRef.current = true;
    }

    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");

    if (tabParam) {
      setActiveTab(tabParam);
      if (tabParam === "contact") {
        setTimeout(() => scrollToContact(), 500);
      } else if (tabParam === "contact-form") {
        setTimeout(() => scrollToForm(), 500);
      } else {
        setTimeout(() => {
          const element = document.getElementById("portfolio-tab-content");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 500);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [initialData, location, handleScroll, scrollToContact, scrollToForm]);

  if (isLoading) {
    return (
      <div className="portfolio-loading">
        <div className="loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      {/* Animation Observer for animations */}
      <AnimationObserver />

      {/* Moving dots background */}
      <div className="animated-dots-bg"></div>
      {/* Header Section with Profile Info */}
      <div
        className="project-scroll-progress"
        style={{ width: `${scrollProgress * 100}%` }}
      ></div>
      <header className="portfolio-header">
        <div className="profile-container">
          {profile?.user_img && (
            <div className="profile-image">
              <img src={profile.user_img} alt={profile.name} loading="lazy" />
            </div>
          )}
          <div className="profile-info">
            <h1>{profile?.name || "Mohamed Elshafey"}</h1>
            <p className="profile-bio">
              {profile?.about ||
                "Frontend Developer specializing in creating modern web applications"}
            </p>
            {/* Admin login button */}
          </div>
        </div>
      </header>

      {/* Tab Navigation - Only for Projects and Technologies */}
      <div
        className={`portfolio-tabs-container ${
          tabsVisible ? "" : "tabs-hidden"
        }`}
      >
        <div className="tabs-wrapper">
          <div className="portfolio-tabs">
            <button
              className={`portfolio-tab ${
                activeTab === "projects" ? "active" : ""
              }`}
              onClick={() => handleTabChange("projects")}
            >
              <i className="fa-solid fa-code"></i> Projects
            </button>
            <button
              className={`portfolio-tab ${
                activeTab === "technologies" ? "active" : ""
              }`}
              onClick={() => handleTabChange("technologies")}
            >
              <i className="fa-solid fa-laptop-code"></i> Skills & Technologies
            </button>
            <button
              className="portfolio-tab contact-tab"
              onClick={scrollToContact}
            >
              <i className="fa-solid fa-envelope"></i> Contact Me
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content - Only for Projects and Technologies */}
      <div className="portfolio-tab-content" id="portfolio-tab-content">
        {/* Projects Tab */}
        {activeTab === "projects" && (
          <section className="portfolio-projects">
            <h2 className="section-title">Projects</h2>

            {projects.length === 0 ? (
              <p className="no-projects">See All Projects.</p>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => navigateToProject(project)}
                  >
                    {project.thumbnailUrl ? (
                      <div className="project-thumbnail">
                        <img
                          src={project.thumbnailUrl}
                          alt={project.name}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="project-thumbnail project-thumbnail-placeholder">
                        <i className="fa-solid fa-code"></i>
                      </div>
                    )}

                    <div className="project-info">
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-summary">
                        {project.description.length > 100
                          ? `${project.description.substring(0, 100)}...`
                          : project.description}
                      </p>

                      {project.techs && (
                        <div className="project-techs">
                          {getProjectTechs(project.techs)
                            .slice(0, 3)
                            .map((tech) => (
                              <div key={tech.id} className="tech-tag">
                                {tech.logo_url && (
                                  <img
                                    src={tech.logo_url}
                                    alt={tech.name}
                                    loading="lazy"
                                  />
                                )}
                                <span>{tech.name}</span>
                              </div>
                            ))}
                          {getProjectTechs(project.techs).length > 3 && (
                            <div className="tech-tag more-tech">
                              +{getProjectTechs(project.techs).length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Technologies Tab */}
        {activeTab === "technologies" && (
          <section className="portfolio-technologies">
            <h2 className="section-title">Skills & Technologies</h2>

            {profileTechnologies.length === 0 ? (
              <p className="no-technologies">No technologies available yet.</p>
            ) : (
              <div className="technologies-grid">
                {profileTechnologies.map((tech) => (
                  <div key={tech.id} className="technology-item">
                    {tech.tech_logo_url && (
                      <img
                        src={tech.tech_logo_url}
                        alt={tech.tech_name}
                        loading="lazy"
                      />
                    )}
                    <span>{tech.tech_name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Contact Section - Always visible, outside of tab system */}
      <section className="portfolio-contact" ref={contactSectionRef}>
        <div className="contact-section-divider">
          <div className="divider-line"></div>
          <h2 className="section-title">Get In Touch</h2>
          <div className="divider-line"></div>
        </div>

        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-greeting">
              <h3>Let's Connect!</h3>
              <p>
                Feel free to reach out for collaboration, questions, or just to
                say hello. I'm always interested in new projects and
                opportunities.
              </p>
            </div>

            {profile?.email && (
              <div className="contact-email">
                <h4>Email</h4>
                <a
                  href={`mailto:${profile.email}`}
                  className="contact-link email-link"
                >
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <span>{profile.email}</span>
                </a>
              </div>
            )}

            <div className="contact-social">
              <h4>Social Media</h4>
              <div className="social-links">
                {profile?.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link github"
                  >
                    <div className="social-icon">
                      <i className="fa-brands fa-github"></i>
                    </div>
                    <span>GitHub</span>
                  </a>
                )}

                {profile?.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link linkedin"
                  >
                    <div className="social-icon">
                      <i className="fa-brands fa-linkedin-in"></i>
                    </div>
                    <span>LinkedIn</span>
                  </a>
                )}

                {profile?.facebook && (
                  <a
                    href={profile.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link facebook"
                  >
                    <div className="social-icon">
                      <i className="fa-brands fa-facebook-f"></i>
                    </div>
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>

            {profile?.cv_url && (
              <div className="contact-cv">
                <h4>Download CV</h4>
                <a
                  href={profile.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv-download-link"
                >
                  <i className="fa-solid fa-file-arrow-down"></i>
                  <span>Download Resume</span>
                </a>
              </div>
            )}

            <div className="contact-direct-form">
              <button className="send-message-btn" onClick={scrollToForm}>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Send me a message</span>
              </button>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-card-inner">
              <div className="contact-card-front">
                <div className="contact-avatar">
                  {profile?.user_img ? (
                    <img
                      src={profile.user_img}
                      alt={profile?.name || "Developer"}
                      loading="lazy"
                    />
                  ) : (
                    <div className="contact-avatar-placeholder">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                </div>
                <h3 className="contact-name">{profile?.name || "Developer"}</h3>
                <p className="contact-title">Web Developer</p>
                <div className="contact-card-links">
                  {profile?.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-github"></i>
                    </a>
                  )}
                  {profile?.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-linkedin-in"></i>
                    </a>
                  )}
                  {profile?.facebook && (
                    <a
                      href={profile.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-brands fa-facebook-f"></i>
                    </a>
                  )}
                  {profile?.email && (
                    <a href={`mailto:${profile.email}`}>
                      <i className="fa-solid fa-envelope"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section" ref={formRef}>
        <div className="contact-form-wrapper">
          <div className="form-header">
            <h2>Send a Message</h2>
            <p>
              Have a specific request or question? Fill out the form below and
              I'll get back to you as soon as possible.
            </p>
          </div>

          {formStatus.message && (
            <div className={`form-status ${formStatus.type}`}>
              <p>{formStatus.message}</p>
              {timeRemaining > 0 && showRateLimit && (
                <div className="countdown-timer">
                  Time remaining: {formatTimeRemaining(timeRemaining)}
                </div>
              )}
            </div>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message or request"
                rows="5"
                disabled={isSubmitting}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || (timeRemaining > 0 && showRateLimit)}
            >
              {isSubmitting ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Sending...
                </span>
              ) : timeRemaining > 0 && showRateLimit ? (
                <span>
                  <i className="fa-solid fa-clock"></i> Please wait...
                </span>
              ) : (
                <span>
                  <i className="fa-solid fa-paper-plane"></i> Send Message
                </span>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Footer Section */}
      <PortfolioFooter
        profile={profile}
        scrollToSection={{
          projects: () => handleTabChange("projects"),
          technologies: () => handleTabChange("technologies"),
          contactRef: contactSectionRef,
          formRef: formRef,
        }}
      />
    </div>
  );
};

export default Portfolio;

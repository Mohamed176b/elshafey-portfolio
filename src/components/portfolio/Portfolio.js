import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PortfolioFooter from './PortfolioFooter';
import AnimationObserver from '../AnimationObserver';
import { trackHomePageVisit } from '../../utils/analyticsUtils';

const Portfolio = ({ initialData }) => {
  const [profile, setProfile] = useState(initialData?.profile || null);
  const [projects, setProjects] = useState(initialData?.projects || []);
  const [technologies, setTechnologies] = useState(initialData?.technologies || []);
  const [profileTechnologies, setProfileTechnologies] = useState(initialData?.profileTechnologies || []);
  const [activeTab, setActiveTab] = useState('projects'); // State for active tab
  const [tabsVisible, setTabsVisible] = useState(true); // State to track tabs visibility
  const location = useLocation();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  
  const contactSectionRef = useRef(null); // Reference for the contact section
  const formRef = useRef(null); // Reference for the contact form
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Elshafey Portfolio";
    
    // تتبع زيارة الصفحة الرئيسية
    trackHomePageVisit();
    
    // Check URL parameters for tab selection
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const scrollToParam = params.get('scrollTo');
    
    if (tabParam) {
      setActiveTab(tabParam);
      
      // Handle contact section or form scrolling if needed
      if (tabParam === 'contact') {
        setTimeout(() => scrollToContact(), 500);
      } else if (tabParam === 'contact-form') {
        setTimeout(() => scrollToForm(), 500);
      } else if (scrollToParam === 'portfolio-tab-content') {
        // If we have the specific scroll parameter, scroll to portfolio-tab-content
        setTimeout(() => {
          const element = document.getElementById('portfolio-tab-content');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    }
    
    // Add scroll event listener for tabs visibility control
    const handleScroll = () => {
      if (contactSectionRef.current) {
        const contactSectionTop = contactSectionRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        // If contact section is entering the viewport (about 80% from the top)
        if (contactSectionTop < windowHeight * 0.8) {
          setTabsVisible(false); // Hide tabs
        } else {
          setTabsVisible(true); // Show tabs
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location]);

  // Handle contact form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // تعطيل الزر أثناء الإرسال
    const { error } = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,          // استخدام الحالة name
        email: email,        // استخدام الحالة email
        message: message,    // استخدام الحالة message
      }),
    });
  
    if (error) {
      setFormStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    } else {
      setName('');        // إعادة تعيين الحالة name
      setEmail('');       // إعادة تعيين الحالة email
      setMessage('');     // إعادة تعيين الحالة message
      setFormStatus({ type: 'success', message: 'Message sent successfully, We will contact you soon.' });
    }
    setIsSubmitting(false); // إعادة تفعيل الزر بعد الإرسال
  };

  // Navigate to project detail page instead of opening overlay
  const navigateToProject = (project) => {
    navigate(`/project/${project.id}`);
  };

  // Filter technologies for a specific project
  const getProjectTechs = (projectTechs) => {
    if (!projectTechs) return [];
    
    try {
      let techArray;
      
      // Handle different formats that might come from the database
      if (typeof projectTechs === 'string') {
        try {
          techArray = JSON.parse(projectTechs);
        } catch (e) {
          // If it's a comma-separated list
          techArray = projectTechs.split(',').map(id => id.trim());
        }
      } else if (Array.isArray(projectTechs)) {
        techArray = projectTechs;
      } else {
        return [];
      }
      
      // Check if we have IDs or full objects
      if (techArray.length > 0 && typeof techArray[0] === 'object' && techArray[0].id) {
        return techArray; // Already have full tech objects
      }
      
      // Filter to get matching tech objects
      const matchedTechs = technologies.filter(tech => {
        return techArray.includes(tech.id) || 
               techArray.includes(tech.id.toString()) || 
               techArray.includes(parseInt(tech.id));
      });
      
      return matchedTechs;
    } catch (error) {
      return [];
    }
  };

  // Toggle between tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Add tab to URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
    
    // Scroll to top of content area when changing tabs
    const element = document.getElementById("portfolio-tab-content");
    window.scrollTo({
      top: element.offsetTop,
      behavior: "smooth"
    });
    
  };

  // Function to scroll to contact section
  const scrollToContact = () => {
    contactSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to scroll to contact form
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="portfolio-page">
      {/* مكون لتفعيل الأنيميشن على العناصر عند التمرير */}
      <AnimationObserver />
      
      {/* خلفية النقاط المتحركة */}
      <div className="animated-dots-bg"></div>
      {/* Header Section with Profile Info */}
      <header className="portfolio-header">
        <div className="profile-container">
          {profile?.user_img && (
            <div className="profile-image">
              <img src={profile.user_img} alt={profile.name} />
            </div>
          )}
          <div className="profile-info">
            <h1>{profile?.name || 'Developer'}</h1>
            <p className="profile-bio">{profile?.about || 'Frontend Developer specializing in creating modern web applications'}</p>
            {/* Admin login button removed from public view for better security */}
          </div>
        </div>
      </header>

      {/* Tab Navigation - Only for Projects and Technologies */}
      <div className={`portfolio-tabs-container ${tabsVisible ? '' : 'tabs-hidden'}`}>
        <div className="tabs-wrapper">
          <div className="portfolio-tabs">
            <button 
              className={`portfolio-tab ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleTabChange('projects')}
            >
              <i className="fa-solid fa-code"></i> Projects
            </button>
            <button 
              className={`portfolio-tab ${activeTab === 'technologies' ? 'active' : ''}`}
              onClick={() => handleTabChange('technologies')}
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
        {activeTab === 'projects' && (
          <section className="portfolio-projects">
            <h2 className="section-title">Projects</h2>
            
            {projects.length === 0 ? (
              <p className="no-projects">No projects available yet.</p>
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
                        <img src={project.thumbnailUrl} alt={project.name} />
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
                          {getProjectTechs(project.techs).slice(0, 3).map(tech => (
                            <div key={tech.id} className="tech-tag">
                              {tech.logo_url && <img src={tech.logo_url} alt={tech.name} />}
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
        {activeTab === 'technologies' && (
          <section className="portfolio-technologies">
            <h2 className="section-title">Skills & Technologies</h2>
            
            {profileTechnologies.length === 0 ? (
              <p className="no-technologies">No technologies available yet.</p>
            ) : (
              <div className="technologies-grid">
                {profileTechnologies.map((tech) => (
                  <div key={tech.id} className="technology-item">
                    {tech.tech_logo_url && <img src={tech.tech_logo_url} alt={tech.tech_name} />}
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
              <p>Feel free to reach out for collaboration, questions, or just to say hello. I'm always interested in new projects and opportunities.</p>
            </div>
            
            {profile?.email && (
              <div className="contact-email">
                <h4>Email</h4>
                <a href={`mailto:${profile.email}`} className="contact-link email-link">
                  <i className="fa-solid fa-envelope-open-text"></i>
                  <span>{profile.email}</span>
                </a>
              </div>
            )}
            
            <div className="contact-social">
              <h4>Social Media</h4>
              <div className="social-links">
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="social-link github">
                    <div className="social-icon">
                      <i className="fa-brands fa-github"></i>
                    </div>
                    <span>GitHub</span>
                  </a>
                )}
                
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    <div className="social-icon">
                      <i className="fa-brands fa-linkedin-in"></i>
                    </div>
                    <span>LinkedIn</span>
                  </a>
                )}
                
                {profile?.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">
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
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="cv-download-link">
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
                    <img src={profile.user_img} alt={profile?.name || 'Developer'} />
                  ) : (
                    <div className="contact-avatar-placeholder">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                </div>
                <h3 className="contact-name">{profile?.name || 'Developer'}</h3>
                <p className="contact-title">Web Developer</p>
                <div className="contact-card-links">
                  {profile?.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-github"></i>
                    </a>
                  )}
                  {profile?.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-linkedin-in"></i>
                    </a>
                  )}
                  {profile?.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer">
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
            <p>Have a specific request or question? Fill out the form below and I'll get back to you as soon as possible.</p>
          </div>
          
          {formStatus.message && (
            <div className={`form-status ${formStatus.type}`}>
              <p>{formStatus.message}</p>
            </div>
          )}
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>
                  <i className="fa-solid fa-spinner fa-spin"></i> Sending...
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
          projects: () => handleTabChange('projects'),
          technologies: () => handleTabChange('technologies'),
          contactRef: contactSectionRef,
          formRef: formRef
        }} 
      />
    </div>
  );
};

export default Portfolio;
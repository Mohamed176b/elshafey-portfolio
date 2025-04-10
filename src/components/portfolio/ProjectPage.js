import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import PortfolioFooter from './PortfolioFooter';
import AnimationObserver from '../AnimationObserver';
import { trackProjectPageVisit } from '../../utils/analyticsUtils';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    fetchProjectData();
    fetchProfileData();
    
    // Add scroll listener for parallax and progress effects
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const totalScroll = docHeight - windowHeight;
      const progress = scrollPosition / totalScroll;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [projectId]);
  
  const fetchProjectData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
        
      if (projectError) {
        console.error("Error fetching project:", projectError);
        navigate('/'); // Redirect to home if project not found
        return;
      }
      
      setProject(projectData);
      
      // تتبع زيارة صفحة المشروع بعد الحصول على البيانات
      trackProjectPageVisit(projectData.id, projectData.name);
      document.title = `${projectData.name} | Portfolio`;
      
      // Fetch technologies
      const { data: techData, error: techError } = await supabase
        .from("available_techs")
        .select("*");
      
      if (!techError) {
        setTechnologies(techData || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch profile data for footer
  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .single();
        
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  // Filter technologies for the project
  const getProjectTechs = (projectTechs) => {
    if (!projectTechs) return [];
    
    try {
      let techArray;
      
      if (typeof projectTechs === 'string') {
        try {
          techArray = JSON.parse(projectTechs);
        } catch (e) {
          techArray = projectTechs.split(',').map(id => id.trim());
        }
      } else if (Array.isArray(projectTechs)) {
        techArray = projectTechs;
      } else {
        return [];
      }
      
      if (techArray.length > 0 && typeof techArray[0] === 'object' && techArray[0].id) {
        return techArray;
      }
      
      return technologies.filter(tech => {
        return techArray.includes(tech.id) || 
               techArray.includes(tech.id.toString()) || 
               techArray.includes(parseInt(tech.id));
      });
    } catch (error) {
      return [];
    }
  };
  
  if (isLoading) {
    return (
      <div className="project-page-loading">
        <div className="page-spin"></div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="project-not-found">
        <h1>Project Not Found</h1>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }
  
  return (
    <div className="project-page">
      {/* مكون لتفعيل الأنيميشن على العناصر عند التمرير */}
      <AnimationObserver />
      
      {/* خلفية النقاط المتحركة */}
      <div className="animated-dots-bg"></div>
      {/* Progress bar */}
      <div className="project-scroll-progress" style={{ width: `${scrollProgress * 100}%` }}></div>
      
      {/* Back button */}
      <button className="project-back-btn" onClick={() => navigate('/')}>
        <i className="fa-solid fa-arrow-left"></i> Back to Portfolio
      </button>
      
      {/* Hero section with parallax effect */}
      <section className="project-hero" style={{ backgroundImage: project.thumbnailUrl ? `url(${project.thumbnailUrl})` : 'none' }}>
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
                <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className="project-link demo-link">
                  <i className="fa-solid fa-globe"></i> Live Demo
                </a>
              )}
              
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="project-link github-link">
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
              {project.features && Array.isArray(project.features) && project.features.length > 0 ? (
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
              ) : project.features && typeof project.features === 'string' ? (
                project.features.split('\n').filter(feature => feature.trim()).map((feature, index) => (
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
                <p className="no-features">No detailed features available for this project.</p>
              )}
            </div>
          </div>
        </section>
        
        {/* Technologies section */}
        <section className="project-technologies-section">
          <h2>Technologies Used</h2>
          <div className="technologies-container">
            {(project.techs && getProjectTechs(project.techs).length > 0) ? (
              <div className="tech-cards">
                {getProjectTechs(project.techs).map(tech => (
                  <div key={tech.id} className="tech-card">
                    {tech.logo_url && <img src={tech.logo_url} alt={tech.name} />}
                    <span>{tech.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-tech">No technology information available for this project.</p>
            )}
          </div>
        </section>
        
        {/* Screenshots section - if we had them */}
        {project.thumbnailUrl && (
          <section className="project-screenshot-section">
            <h2>Project Screenshot</h2>
            <div className="screenshot-container">
              <img src={project.thumbnailUrl} alt={project.name} className="project-screenshot" />
            </div>
          </section>
        )}
        
        {/* Call to action */}
        <section className="project-cta-section">
          <h2>Interested in this project?</h2>
          <div className="cta-buttons">
            {project.demoLink && (
              <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className="cta-button">
                View Live Demo
              </a>
            )}
            <button onClick={() => navigate('/')} className="cta-button secondary">
              Explore More Projects
            </button>
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <PortfolioFooter 
        profile={profile} 
        scrollToSection={null} 
      />
    </div>
  );
};

export default ProjectPage;

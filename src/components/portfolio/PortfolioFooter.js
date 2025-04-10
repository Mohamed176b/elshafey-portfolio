import React from 'react';
import { useNavigate } from 'react-router-dom';

const PortfolioFooter = ({ profile, scrollToSection }) => {
  const navigate = useNavigate();

  // Handle navigation to project list on main page
  const navigateToProjects = (e) => {
    e.preventDefault();
    // If on home page, scroll to projects
    if (window.location.pathname === '/') {
      if (scrollToSection && typeof scrollToSection.projects === 'function') {
        scrollToSection.projects();
      } else {
        // Fallback: update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', 'projects');
        window.history.pushState({}, '', url);
        
        // Try to scroll to the portfolio-tab-content element
        setTimeout(() => {
          const element = document.getElementById('portfolio-tab-content');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // If on another page, navigate to home with projects hash and scroll to portfolio-tab-content
      // We'll add a special parameter to indicate we should scroll to that element after navigation
      navigate('/?tab=projects&scrollTo=portfolio-tab-content');
    }
  };

  // Handle navigation to technologies on main page
  const navigateToTechnologies = (e) => {
    e.preventDefault();
    // If on home page, scroll to technologies
    if (window.location.pathname === '/') {
      if (scrollToSection && typeof scrollToSection.technologies === 'function') {
        scrollToSection.technologies();
      } else {
        // Fallback: update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', 'technologies');
        window.history.pushState({}, '', url);
        
        // Try to scroll to the portfolio-tab-content element
        setTimeout(() => {
          const element = document.getElementById('portfolio-tab-content');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // If on another page, navigate to home with technologies hash and scroll to portfolio-tab-content
      // We'll add a special parameter to indicate we should scroll to that element after navigation
      navigate('/?tab=technologies&scrollTo=portfolio-tab-content');
    }
  };

  // Handle navigation to contact section on main page
  const navigateToContact = (e) => {
    e.preventDefault();
    // If on home page, scroll to contact
    if (window.location.pathname === '/') {
      if (scrollToSection && scrollToSection.contactRef) {
        scrollToSection.contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', 'contact');
        window.history.pushState({}, '', url);
      }
    } else {
      // If on another page, navigate to home with contact hash
      navigate('/?tab=contact');
    }
  };

  // Handle navigation to contact form on main page
  const navigateToForm = (e) => {
    if (e) e.preventDefault();
    // If on home page, scroll to form
    if (window.location.pathname === '/') {
      if (scrollToSection && scrollToSection.formRef) {
        scrollToSection.formRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', 'contact-form');
        window.history.pushState({}, '', url);
      }
    } else {
      // If on another page, navigate to home with form hash
      navigate('/?tab=contact-form');
    }
  };

  return (
    <footer className="portfolio-footer">
      <div className="footer-content">
        {/* Brand & About */}
        <div className="footer-brand">
          <div className="footer-logo">{profile?.name || 'Developer'}</div>
          <p>{profile?.about ? (profile.about.length > 150 ? `${profile.about.substring(0, 150)}...` : profile.about) : 'Web developer specializing in creating modern, responsive applications with clean code and user-friendly interfaces.'}</p>
          <div className="footer-social">
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <i className="fa-brands fa-github"></i>
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            )}
            {profile?.facebook && (
              <a href={profile.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} aria-label="Email">
                <i className="fa-solid fa-envelope"></i>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-nav">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#" onClick={navigateToProjects}>
                <i className="fa-solid fa-code"></i> Projects
              </a>
            </li>
            <li>
              <a href="#" onClick={navigateToTechnologies}>
                <i className="fa-solid fa-laptop-code"></i> Skills & Technologies
              </a>
            </li>
            <li>
              <a href="#" onClick={navigateToContact}>
                <i className="fa-solid fa-address-card"></i> Contact Info
              </a>
            </li>
            <li>
              <a href="#" onClick={navigateToForm}>
                <i className="fa-solid fa-paper-plane"></i> Contact Form
              </a>
            </li>
            {profile?.cv_url && (
              <li>
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-file-arrow-down"></i> Download CV
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Connect */}
        <div className="footer-connect">
          <h3>Let's Connect</h3>
          <p>Feel free to reach out for collaboration, questions, or just to say hello.</p>
          {profile?.email && (
            <div className="footer-email" style={{ marginTop: '15px' }}>
              <a href={`mailto:${profile.email}`} style={{ opacity: 0.7, color: 'var(--forground-color)', textDecoration: 'none', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-envelope"></i> {profile.email}
              </a>
            </div>
          )}
          {profile?.phone && (
            <div className="footer-phone" style={{ marginTop: '15px' }}>
              <a href={`tel:${profile.phone}`} style={{ opacity: 0.7, color: 'var(--forground-color)', textDecoration: 'none', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-phone"></i> {profile.phone}
              </a>
            </div>
          )}
          <button 
            onClick={navigateToForm} 
            className="send-message-btn" 
            style={{ marginTop: '20px', backgroundColor: 'rgba(77, 25, 77, 0.7)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '10px 15px', color: 'var(--forground-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s ease' }}
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Send me a message</span>
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {profile?.name || 'Developer'} - All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default PortfolioFooter;

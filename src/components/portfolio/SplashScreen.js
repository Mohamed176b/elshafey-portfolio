import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

const SplashScreen = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [profileTechnologies, setProfileTechnologies] = useState([]);
  const [technologies, setTechnologies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", process.env.REACT_APP_USER_ID)
          .limit(1);
        
        if (profileError) throw profileError;
        if (!profileData || profileData.length === 0) throw new Error("No profile found");

        const profile = profileData[0];
        setProfile(profile);

        // Fetch projects with proper ordering
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .order('display_order', { ascending: true });
          
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);


        // Fetch technologies
        const { data: techData, error: techError } = await supabase
          .from("available_techs")
          .select("*");
          
        if (techError) throw techError;
        setTechnologies(techData || []);

        // Fetch profile technologies
        const { data: profileTechData, error: profileTechError } = await supabase
          .from("tech_items")
          .select("*");
          
        if (profileTechError) throw profileTechError;
        setProfileTechnologies(profileTechData || []);


        // Start fade out after data is loaded
        setFadeOut(true);
        
        // Wait for fade out animation to complete before finishing
        setTimeout(() => {
          if (onFinish) {
            // تمرير البيانات المستلمة من الخادم مباشرة بدلاً من الـ state
            onFinish({
              profile: profile,
              projects: projectsData || [],
              technologies: techData || [],
              profileTechnologies: profileTechData || []
            });
          }
        }, 1000);

      } catch (error) {
        console.error("Error in SplashScreen:", error);
        setFadeOut(true);
        setTimeout(() => {
          if (onFinish) {
            onFinish({
              profile: null,
              projects: [],
              technologies: [],
              profileTechnologies: []
            });
          }
        }, 1000);
      }
    };

    // Start data fetching
    fetchData();
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-letter">E</span>
            <span className="logo-letter">L</span>
            <span className="logo-letter">S</span>
            <span className="logo-letter">H</span>
            <span className="logo-letter">A</span>
            <span className="logo-letter">F</span>
            <span className="logo-letter">E</span>
            <span className="logo-letter">Y</span>
          </div>
          <div className="tagline">
            <span>Portfolio</span>
          </div>
        </div>
        <div className="loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

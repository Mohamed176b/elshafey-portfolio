import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { supabase } from "../../supabase/supabaseClient";

const Logo = memo(() => (
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
));

const Loader = memo(() => (
  <div className="loader">
    <div className="loader-bar"></div>
  </div>
));

const SplashScreen = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [, setProfile] = useState(null);
  const [, setProjects] = useState([]);
  const [, setProfileTechnologies] = useState([]);
  const [, setTechnologies] = useState([]);


  const fetchData = useCallback(async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", process.env.REACT_APP_USER_ID)
        .limit(1);

      if (profileError) throw profileError;
      if (!profileData || profileData.length === 0)
        throw new Error("No profile found");

      const profile = profileData[0];
      setProfile(profile);

      // Fetch projects with proper ordering
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });

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

      setFadeOut(true);

      setTimeout(() => {
        if (onFinish) {
          onFinish({
            profile,
            projects: projectsData || [],
            technologies: techData || [],
            profileTechnologies: profileTechData || [],
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error in SplashScreen:", error);
      setFadeOut(true);
      setTimeout(() => {
        if (onFinish) {
          onFinish({
            profile: null,
            projects: [],
            technologies: [],
            profileTechnologies: [],
          });
        }
      }, 1000);
    }
  }, [onFinish]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const splashScreenClasses = useMemo(() => {
    return `splash-screen ${fadeOut ? "fade-out" : ""}`;
  }, [fadeOut]);

  return (
    <div className={splashScreenClasses}>
      <div className="splash-content">
        <div className="logo-container">
          <Logo />
          <div className="tagline">
            <span>Portfolio</span>
          </div>
        </div>
        <Loader />
      </div>
    </div>
  );
};

export default memo(SplashScreen);

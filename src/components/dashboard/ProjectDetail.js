import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { Link, useNavigate, useParams } from "react-router-dom";

// Lazy load components
const TechList = lazy(() => import("./project-detail/TechList"));
const FeaturesList = lazy(() => import("./project-detail/FeaturesList"));
const ProjectLinks = lazy(() => import("./project-detail/ProjectLinks"));

const ProjectDetail = () => {
  const [, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [techs, setTechs] = useState([]);
  const { projectId } = useParams();

  const fetchProfile = useCallback(
    async (user) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (profileError) throw profileError;

        setProfileId(profileData.id);
        await fetchProject(profileData.id, projectId);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile data");
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const fetchProject = useCallback(async (profileId, projectId) => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profileId)
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      setProject(projectData);

      if (projectData.techs?.length > 0) {
        const { data: techsData, error: techsError } = await supabase
          .from("available_techs")
          .select("*")
          .eq("profile_id", profileId)
          .in("id", projectData.techs);

        if (techsError) throw techsError;
        setTechs(techsData);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setError("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error("No session found");

      await fetchProfile(sessionData.session.user);
    } catch (error) {
      console.error("Session check failed:", error);
      navigate("/admin");
    }
  }, [navigate, fetchProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!project) {
    return <div>The project does not exist</div>;
  }

  return (
    <div className="project-detail-page">
      <div>
        <p className="pro-det-sec">{project.description}</p>
        <Suspense
          fallback={<div className="loading-section">Loading features...</div>}
        >
          <div>
            <p className="pro-det-title">Key Features</p>
            <div className="pro-det-sec">
              <FeaturesList features={project.features} />
            </div>
          </div>
        </Suspense>

        <Suspense
          fallback={
            <div className="loading-section">Loading technologies...</div>
          }
        >
          <div>
            <p className="pro-det-title">Technologies Used</p>
            <TechList techs={techs} />
          </div>
        </Suspense>
      </div>

      <div>
        <div className="pro-thumb">
          <img src={project.thumbnailUrl} alt={project.name} loading="lazy" />
        </div>
        <Suspense
          fallback={<div className="loading-section">Loading links...</div>}
        >
          <ProjectLinks
            demoLink={project.demoLink}
            githubLink={project.githubLink}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default React.memo(ProjectDetail);

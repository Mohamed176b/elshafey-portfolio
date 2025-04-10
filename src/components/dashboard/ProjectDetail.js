import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { Link, useNavigate, useParams } from "react-router-dom";

const ProjectDetail = () => {
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [techs, setTechs] = useState([]);
  const { projectId } = useParams();

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error(
          "Session check failed! Error:",
          sessionError || "No session found"
        );
        navigate("/admin");
        return;
      }
      const user = sessionData.session.user;
      await fetchProfile(user);
      setIsLoading(false);
    };

    const fetchProfile = async (user) => {
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);
      if (profileError) {
        console.error("Failed to fetch profile! Error:", profileError);
      } else {
        const profile =
          profileData && profileData.length > 0 ? profileData[0] : null;
        if (profile) {
          setProfileId(profile.id);
          await fetchProject(profile.id, projectId);
        }
      }
    };

    const fetchProject = async (profileId, projectId) => {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profileId)
        .eq("id", projectId)
        .single();
      if (projectError) {
        console.error("Failure to fetch project:", projectError);
      } else {
        setProject(projectData);
        if (projectData.techs && projectData.techs.length > 0) {
          const { data: techsData, error: techsError } = await supabase
            .from("available_techs")
            .select("*")
            .eq("profile_id", profileId)
            .in("id", projectData.techs);
          if (techsError) {
            console.error("Failure to fetch techs:", techsError);
            setTechs([]);
          } else {
            setTechs(techsData);
          }
        } else {
          setTechs([]);
        }
      }
    };

    checkSession();
  }, [navigate, projectId]);

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  if (!project) {
    return <div>The project does not exist</div>;
  }

  return (
    <div className="project-detail-page">
      <div>
        <p className="pro-det-sec">{project.description}</p>
        <div>
          <p className="pro-det-title">Key Features</p>
          <div className="pro-det-sec">
            {project.features.map((text, index) => (
              <div className="pro-det-fea" key={index}>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="pro-det-title">Technologies Used</p>
          {techs.length > 0 ? (
            <div className="tech-list pro-det-sec">
              {techs.map((tech) => (
                <div key={tech.id} className="tech-item">
                  <img src={tech.logo_url} alt={tech.name} width="50" />
                  <h4>{tech.name}</h4>
                </div>
              ))}
            </div>
          ) : (
            <p>No technologies specified.</p>
          )}
        </div>
      </div>
      <div>
        <div className="pro-thumb">
          <img src={project.thumbnailUrl} alt={project.name}></img>
        </div>
        <div className="links pro-det-sec">
          <Link to={project.demoLink} target="_blank">
            <i className="fa-solid fa-display"></i>
            <span>Live Demo</span>
          </Link>
          {project.githubLink && (
            <Link to={project.githubLink} target="_blank">
              <i className="fa-brands fa-square-github"></i>
              <span>GitHub</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

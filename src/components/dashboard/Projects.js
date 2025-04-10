import React, { useState, useEffect, useRef } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
  useMatch,
  useParams,
} from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import { getUserSession } from "../../utils/authUtils";

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get user from sessionStorage instead of location state
  const user = getUserSession();
  const isAddNewProject = !!useMatch("/dashboard/projects/add-new-project");
  const isAProject = !!useMatch("/dashboard/projects/:projectId");
  const isEditProject = !!useMatch(
    "/dashboard/projects/edit-project/:projectId"
  );
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isAProject && projectId) {
      const fetchProjectName = async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("name")
          .eq("id", projectId)
          .single();
        if (error) {
          console.error("Error fetching project:", error);
        } else {
          setProjectName(data.name);
        }
      };
      fetchProjectName();
    }
  }, [isAProject, projectId]);

  const handleEdit = () => {
    navigate(`/dashboard/projects/edit-project/${projectId}`);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!projectId) {
      console.error("No project ID found");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );
    if (!confirmDelete) {
      setShowMenu(false);
      return;
    }

    try {
      console.log("Starting deletion process for project ID:", projectId);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error(
          "Session check failed! Error:",
          sessionError || "No session found"
        );
        return;
      }
      const user = sessionData.session.user;

      const { data: projectData, error: fetchError } = await supabase
        .from("projects")
        .select("thumbnailUrl, profile_id")
        .eq("id", projectId)
        .single();

      if (fetchError) {
        console.error("Error fetching project:", fetchError);
        return;
      }
      console.log("Project data fetched:", projectData);

      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", projectData.profile_id)
        .single();

      if (profileError || !profileData) {
        console.error(
          "Error verifying user ownership:",
          profileError || "Profile not found"
        );
        return;
      }

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (deleteError) {
        console.error("Error deleting project:", deleteError);
        return;
      }
      console.log("Project deleted successfully from database");

      const { error: deleteVisitError } = await supabase
      .from("page_visits")
      .delete()
      .eq("project_id", projectId);

      if (deleteVisitError) {
        console.error("Error deleting project visits:", deleteVisitError);
        return;
      }
      console.log("Project visites deleted successfully from database");

      if (projectData.thumbnailUrl) {
        const urlParts = projectData.thumbnailUrl.split("/");
        const bucketIndex = urlParts.indexOf("projects-thumbnails");
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const filePath = urlParts.slice(bucketIndex + 1).join("/");
          const { error: storageError } = await supabase.storage
            .from("projects-thumbnails")
            .remove([filePath]);

          if (storageError) {
            console.error("Error deleting thumbnail:", storageError);
          } else {
            console.log("Thumbnail deleted successfully");
          }
        } else {
          console.error("Invalid thumbnail URL:", projectData.thumbnailUrl);
        }
      }

      navigate("/dashboard/projects");
    } catch (error) {
      console.error("Unexpected error during project deletion:", error);
    }

    setShowMenu(false);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="projects-page">
      <div
        className={`dash-header${
          isAddNewProject || isAProject || isEditProject ? " sec-head" : ""
        }`}
      >
        {(isAddNewProject || isAProject || isEditProject) && (
          <button
            title="Back"
            className="back-btn"
            onClick={() => navigate("/dashboard/projects")}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        )}
        <h1 className="title">
          Projects {isAddNewProject && " > "}{" "}
          {isAddNewProject && <span>Add New Project</span>}
          {isAProject && !isAddNewProject && " > "}{" "}
          {isAProject && !isAddNewProject && (
            <span>{projectName || "Loading..."}</span>
          )}
          {isEditProject && " > "} {isEditProject && <span>Edit Project</span>}
        </h1>
        {!isAddNewProject && !isAProject && !isEditProject && (
          <button
            className="prof-btn project-add-btn"
            onClick={() =>
              navigate("/dashboard/projects/add-new-project")
            }
          >
            <i className="fa-solid fa-square-plus"></i>
            <span>Add New Project</span>
          </button>
        )}
        {isAProject && !isAddNewProject && (
          <div className="project-actions">
            <button
              className="dots-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            {showMenu && (
              <div className="action-menu" ref={menuRef}>
                <button onClick={handleEdit}>Edit</button>
                <button onClick={handleDelete}>Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="prog-f">
        <Outlet />
      </div>
    </div>
  );
};

export default Projects;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Outlet, useNavigate, useMatch, useParams } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";

/**
 * Main Projects Component
 * Features:
 * - Project listing with filters
 * - Add/Edit/Delete project actions
 * - Search functionality
 * - Technology-based filtering
 * - Pagination support
 */
const Projects = () => {
  const navigate = useNavigate();

  const matchAddNewProject = useMatch("/dashboard/projects/add-new-project");
  const matchAProject = useMatch("/dashboard/projects/:projectId");
  const matchEditProject = useMatch(
    "/dashboard/projects/edit-project/:projectId"
  );

  const routeMatches = useMemo(
    () => ({
      isAddNewProject: !!matchAddNewProject,
      isAProject: !!matchAProject,
      isEditProject: !!matchEditProject,
    }),
    [matchAddNewProject, matchAProject, matchEditProject]
  );

  const { isAddNewProject, isAProject, isEditProject } = routeMatches;
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // تحسين fetchProjectName باستخدام useCallback
  const fetchProjectName = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    if (isAProject && projectId) {
      fetchProjectName();
    }
  }, [isAProject, projectId, fetchProjectName]);

  const handleEdit = useCallback(() => {
    navigate(`/dashboard/projects/edit-project/${projectId}`);
    setShowMenu(false);
  }, [navigate, projectId]);

  const handleDelete = useCallback(async () => {
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
  }, [projectId, navigate]);

  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, handleClickOutside]);

  const navigateToAddProject = useCallback(() => {
    navigate("/dashboard/projects/add-new-project");
  }, [navigate]);

  const navigateToProjects = useCallback(() => {
    navigate("/dashboard/projects");
  }, [navigate]);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  const backButton = useMemo(() => {
    if (isAddNewProject || isAProject || isEditProject) {
      return (
        <button title="Back" className="back-btn" onClick={navigateToProjects}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      );
    }
    return null;
  }, [isAddNewProject, isAProject, isEditProject, navigateToProjects]);

  const titleContent = useMemo(() => {
    let content = "Projects";
    if (isAddNewProject) {
      content += " > Add New Project";
    } else if (isAProject && !isAddNewProject) {
      content += ` > ${projectName || "Loading..."}`;
    } else if (isEditProject) {
      content += " > Edit Project";
    }
    return content;
  }, [isAddNewProject, isAProject, isEditProject, projectName]);

  const addProjectButton = useMemo(() => {
    if (!isAddNewProject && !isAProject && !isEditProject) {
      return (
        <button
          className="prof-btn project-add-btn"
          onClick={navigateToAddProject}
        >
          <i className="fa-solid fa-square-plus"></i>
          <span>Add New Project</span>
        </button>
      );
    }
    return null;
  }, [isAddNewProject, isAProject, isEditProject, navigateToAddProject]);

  const actionMenu = useMemo(() => {
    if (!showMenu) return null;
    return (
      <div className="action-menu" ref={menuRef}>
        <button onClick={handleEdit}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    );
  }, [showMenu, handleEdit, handleDelete]);

  return (
    <div className="projects-page">
      <div
        className={`dash-header${
          isAddNewProject || isAProject || isEditProject ? " sec-head" : ""
        }`}
      >
        {backButton}
        <h1 className="title">{titleContent}</h1>
        {addProjectButton}
        {isAProject && !isAddNewProject && (
          <div className="project-actions">
            <button className="dots-btn" onClick={toggleMenu}>
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            {actionMenu}
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

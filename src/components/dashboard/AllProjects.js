import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

// Lazy load project components
const ProjectCard = lazy(() => import("./ProjectCard"));

const AllProjects = () => {
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const location = useLocation();
  const user = location.state?.user;
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Memoize user data
  const userData = useMemo(
    () => ({
      user,
      profileId,
    }),
    [user, profileId]
  );

  // Memoize fetchProjects function
  const fetchProjects = useCallback(async (profileId) => {
    try {
      let { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profileId)
        .order("display_order", { ascending: true });

      if (projectsError) {
        console.error("Failure to fetch projects:", projectsError);
      } else {
        const projectsWithOrders = projectsData.map((project, index) => ({
          ...project,
          display_order: project.display_order || index + 1,
        }));

        setProjects(projectsWithOrders);

        try {
          await Promise.all(
            projectsWithOrders.map((project, index) =>
              supabase
                .from("projects")
                .update({ display_order: index + 1 })
                .eq("id", project.id)
            )
          );
        } catch (updateError) {
          console.error("Error updating project orders:", updateError);
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }, []);

  // Memoize fetchProfile function
  const fetchProfile = useCallback(
    async (user) => {
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
          await fetchProjects(profile.id);
        }
      }
    },
    [fetchProjects]
  );

  // Memoize session check function
  const checkSession = useCallback(async () => {
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
    await fetchProfile(sessionData.session.user);
    setIsLoading(false);
  }, [navigate, fetchProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleViewProject = useCallback(
    (projectId) => {
      navigate(`/dashboard/projects/${projectId}`, {
        state: { user },
      });
    },
    [navigate, user]
  );

  const handleDragStart = useCallback((e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove("dragging");
  }, []);

  // Memoize updateProjectOrder function
  const updateProjectOrder = useCallback(async (projectsCopy) => {
    try {
      await Promise.all(
        projectsCopy.map((project, index) =>
          supabase
            .from("projects")
            .update({ display_order: index + 1 })
            .eq("id", project.id)
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating project order:", error);
      return false;
    }
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();

      const dragIndex = dragItem.current;
      const dropIndex = dragOverItem.current;

      if (dragIndex === dropIndex) return;

      const projectsCopy = [...projects];
      const draggedItem = projectsCopy[dragIndex];
      projectsCopy.splice(dragIndex, 1);
      projectsCopy.splice(dropIndex, 0, draggedItem);

      setProjects(projectsCopy);

      try {
        setIsSaving(true);
        setInfoMessage("Saving new order...");

        const success = await updateProjectOrder(projectsCopy);

        setInfoMessage(
          success ? "Order saved successfully" : "Error saving the order"
        );
        setTimeout(() => setInfoMessage(""), 3000);
      } finally {
        setIsSaving(false);
        dragItem.current = null;
        dragOverItem.current = null;
      }
    },
    [projects, updateProjectOrder]
  );

  // Memoize project list rendering with virtualization for large lists
  const projectList = useMemo(() => {
    return (
      <Suspense fallback={<div className="page-spin"></div>}>
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onView={handleViewProject}
            userData={userData}
          />
        ))}
      </Suspense>
    );
  }, [
    projects,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleViewProject,
    userData,
  ]);

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  return (
    <div className="all-projects-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="order-instructions">
        <p>
          <i className="fa-solid fa-circle-info"></i> Drag and drop projects to
          reorder them. The new order will be saved automatically.
        </p>
      </div>
      {isSaving && (
        <div className="save-overlay">
          <div className="loader"></div>
        </div>
      )}
      <div className="projects-container">{projectList}</div>
    </div>
  );
};

export default AllProjects;

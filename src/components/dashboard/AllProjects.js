import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

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
          await fetchProjects(profile.id);
        }
      }
    };

    const fetchProjects = async (profileId) => {
      try {
        // Fetch projects with explicit ordering by display_order
        let { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("profile_id", profileId)
          .order('display_order', { ascending: true });
        
        if (projectsError) {
          console.error("Failure to fetch projects:", projectsError);
        } else {
          // Log the projects data for debugging
          console.log("Fetched projects:", projectsData);
          
          // Make sure all projects have an order assigned
          const projectsWithOrders = projectsData.map((project, index) => ({
            ...project,
            display_order: project.display_order || index + 1
          }));
          
          setProjects([...projectsWithOrders]);
          
          // Update all projects with sequential display_order
          try {
            // Since the SQL might not have been run yet, update all projects with sequential order
            await Promise.all(
              projectsWithOrders.map((project, index) => 
                supabase
                  .from("projects")
                  .update({ display_order: index + 1 })
                  .eq("id", project.id)
              )
            );
            console.log("Updated display_order for all projects");
          } catch (updateError) {
            console.error("Error updating project orders:", updateError);
          }
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const handleViewProject = (projectId) => {
    navigate(`/dashboard/projects/${projectId}`, {
      state: { user },
    });
  };
  
  // Function to handle the start of dragging
  const handleDragStart = (e, index) => {
    // Save the index of the element being dragged
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");
  };
  
  // Function to handle when an element is dragged over another
  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
    e.dataTransfer.dropEffect = "move";
  };
  
  // Function to handle when dragging ends
  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
  };
  
  // Function to handle when an element is dropped
  const handleDrop = async (e) => {
    e.preventDefault();
    
    // Get the source and destination indices
    const dragIndex = dragItem.current;
    const dropIndex = dragOverItem.current;
    
    // If the index hasn't changed, do nothing
    if (dragIndex === dropIndex) return;
    
    // Create a copy of the projects array
    const projectsCopy = [...projects];
    
    // Move the dragged element to the new position
    const draggedItem = projectsCopy[dragIndex];
    projectsCopy.splice(dragIndex, 1);
    projectsCopy.splice(dropIndex, 0, draggedItem);
    
    // Update the state with the new order
    setProjects(projectsCopy);
    
    // Update display_order for all projects
    try {
      setIsSaving(true);
      setInfoMessage("Saving new order...");
      
      // Update the order in the database
      await Promise.all(
        projectsCopy.map((project, index) => {
          return supabase
            .from("projects")
            .update({ display_order: index + 1 })
            .eq("id", project.id);
        })
      );
      
      setInfoMessage("Order saved successfully");
      setTimeout(() => setInfoMessage(""), 3000);
    } catch (error) {
      console.error("Error updating project order:", error);
      setInfoMessage("Error saving the order");
      setTimeout(() => setInfoMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
    
    // Reset the drag refs
    dragItem.current = null;
    dragOverItem.current = null;
  };

  

  if (isLoading) {
    return <div className="page-spin"></div>;
  }
  return (
    <div className="all-projects-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="order-instructions">
        <p>
          <i className="fa-solid fa-circle-info"></i> Drag and drop projects to reorder them. The new order will be saved automatically.
        </p>
      </div>
      {isSaving && <div className="save-overlay"><div className="loader"></div></div>}
      <div className="projects-container">
      {projects.map((project, index) => (
        <div 
          className="project" 
          key={project.id}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        >
          <div className="drag-handle">
            <i className="fa-solid fa-grip-vertical"></i>
          </div>
          <div className="pro-img">
            <img alt={project.name} src={project.thumbnailUrl} />
          </div>
          <div className="pro-con">
            <div>
              <h5>{project.name}</h5>
              <p>{project.description}</p>
              <span className="order-badge">Order: {index + 1}</span>
            </div>
            <div className="pro-btns">
              <button
                onClick={() =>
                  navigate(`/dashboard/projects/edit-project/${project.id}`, {
                    state: { user },
                  })
                }
              >
                Edit
              </button>
              <button onClick={() => handleViewProject(project.id)}>
                View
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default AllProjects;

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { clearUserSession } from "../../utils/authUtils";

const Settings = () => {
  const [newTech, setNewTech] = useState("");
  const [newTechLogo, setNewTechLogo] = useState(null); // Stores the file of a new tech logo
  const [profileId, setProfileId] = useState(null); // Stores the profile ID from the database
  const [isTechLogoUploading, setIsTechLogoUploading] = useState(false); // Indicates if a tech logo is uploading
  const [techItems, setTechItems] = useState([]); // Stores the list of technologies
  const fileTechLogoRef = useRef(null); // Ref for the technology logo file input
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [isLoading, setIsLoading] = useState(true); // Indicates if initial data is being fetched
   const [infoMessage, setInfoMessage] = useState(""); 

  // Dashboard configuration state
  const [dashboardConfig, setDashboardConfig] = useState({
    maxLength: 70,       // Maximum description length
    numberOfProjects: 3,  // Number of projects to display
    numberOfMessages: 3   // Number of messages to display
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Effect to check user session and fetch profile data when the component mounts
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true); // Show loading state while fetching data
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error(
          "Session check failed! Error:",
          sessionError || "No session found"
        ); // Log detailed session error
        navigate("/admin"); // Redirect to admin page if session is invalid
        return;
      }
      const user = sessionData.session.user; // Extract user from session
      await fetchProfile(user); // Fetch user's profile data
      setIsLoading(false); // Hide loading state after fetch
    };

    // Function to fetch profile data from Supabase
    const fetchProfile = async (user) => {
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .limit(1); // Limit to one profile per user

      if (profileError) {
        console.error("Failed to fetch profile! Error:", profileError); // Log profile fetch error
      } else {
        const profile =
          profileData && profileData.length > 0 ? profileData[0] : null; // Get first profile or null
        if (profile) {
          setProfileId(profile.id); // Set profile ID
          await fetchTechItems(profile.id); // Fetch associated technologies
        } else {
          console.log(
            "No profile found for user. Initializing with empty values."
          ); // Log if no profile exists
        }
      }
    };

    // Function to fetch technology items linked to the profile
    const fetchTechItems = async (profileId) => {
      const { data: techData, error: techError } = await supabase
        .from("available_techs")
        .select("*")
        .eq("profile_id", profileId);

      if (techError) {
        console.error("Failed to fetch technologies! Error:", techError); // Log tech fetch error
      } else {
        setTechItems(techData || []); // Set tech items, default to empty array if null
        console.log("Technologies fetched successfully:", techData); // Log successful fetch
      }
    };
    
    // Obtener la configuración del dashboard
    const fetchDashboardConfig = async (profileId) => {
      try {
        const { data, error } = await supabase
          .from('dashboard_config')
          .select('*')
          .eq('profile_id', profileId);
          
        if (error) {
          console.error("Error fetching dashboard config:", error);
        } else if (data && data.length > 0) {
          // Datos encontrados, usar la primera configuración (debería ser la única para este perfil)
          const config = data[0];
          setDashboardConfig({
            maxLength: config.max_length || 70,
            numberOfProjects: config.number_of_projects || 3,
            numberOfMessages: config.number_of_messages || 3
          });
          console.log("Dashboard config loaded successfully");
        } else {
          // No se encontró configuración, usar valores predeterminados
          console.log("No dashboard config found, using defaults");
        }
      } catch (error) {
        console.error("Failed to fetch dashboard config:", error);
      }
    };

    checkSession(); // Initiate session check and profile fetch
    
    if (profileId) {
      fetchDashboardConfig(profileId);
    }
  }, [navigate, profileId]); // Dependency array includes navigate to re-run if it changes

  // Function to add a new technology with a logo
  const handleAddTech = async () => {
    if (!newTech.trim() || !newTechLogo || !profileId) {
      console.log("Cannot add technology: Missing name, logo, or profile ID."); // Log if prerequisites are missing
      return;
    }

    setIsTechLogoUploading(true); // Show tech logo uploading state

    const fileExt = newTechLogo.name.split(".").pop(); // Extract file extension
    const filePath = `ava-techs-${profileId}-${Date.now()}.${fileExt}`; // Create unique file path

    const { error: uploadError } = await supabase.storage
      .from("projects-tech-logos")
      .upload(filePath, newTechLogo, { upsert: true }); // Upload tech logo

    if (uploadError) {
      console.error("Failed to upload tech logo! Error:", uploadError); // Log upload error
      setIsTechLogoUploading(false); // Reset uploading state
      return;
    }

    const { data: urlData } = supabase.storage
      .from("projects-tech-logos")
      .getPublicUrl(filePath); // Get public URL for the uploaded logo

    const techLogoUrl = urlData.publicUrl; // Store logo URL

    const newTechData = {
      profile_id: profileId, // Link to profile
      name: newTech.trim(), // Trimmed technology name
      logo_url: techLogoUrl, // Logo URL
    };

    const { data, error } = await supabase
      .from("available_techs")
      .insert(newTechData)
      .select(); // Insert new tech and return inserted data

    if (error) {
      console.error("Failed to add technology! Error:", error); // Log insert error
    } else {
      setTechItems([...techItems, data[0]]); // Add new tech to the list
      setNewTech(""); // Clear tech name input
      setNewTechLogo(null); // Clear tech logo input
      console.log("Technology added successfully:", data[0]); // Log successful addition
    }

    setIsTechLogoUploading(false); // Hide uploading state
  };

  // Function to delete a technology and its logo
  const handleDeleteTech = async (techId) => {
    const techToDelete = techItems.find((tech) => tech.id === techId); // Find tech to delete
    if (techToDelete && techToDelete.logo_url) {
      const urlParts = techToDelete.logo_url.split(
        "/storage/v1/object/public/projects-tech-logos/"
      );
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        const { error: removeError } = await supabase.storage
          .from("projects-tech-logos")
          .remove([filePath]); // Delete tech logo from storage
        if (removeError) {
          console.error("Failed to delete tech logo! Error:", removeError); // Log delete error
        } else {
          console.log("Tech logo deleted successfully:", filePath); // Log successful delete
        }
      }
    }

    const { error } = await supabase
      .from("available_techs")
      .delete()
      .eq("id", techId); // Delete tech from database

    if (error) {
      console.error("Failed to delete technology! Error:", error); // Log delete error
    } else {
      setTechItems(techItems.filter((tech) => tech.id !== techId)); // Remove tech from state
      console.log("Technology deleted successfully. ID:", techId); // Log successful delete
    }
  };

  // Function to add a technology when Enter key is pressed
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddTech(); // Trigger tech addition
      console.log("Enter key pressed to add technology."); // Log key press
    }
  };

  useEffect(() => {
    const dashSelPage = document.getElementById("dash-sel-page"); // Get dashboard element
    if (dashSelPage) {
      if (isLoading) {
        dashSelPage.classList.add("dash-sel-page-loading"); // Add loading class
      } else {
        dashSelPage.classList.remove("dash-sel-page-loading"); // Remove loading class
      }
    }
  }, [isLoading]); // Re-run when isLoading changes

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUserSession();
      navigate("/"); // Navigate to home page
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Function to save dashboard configuration
  const saveDashboardConfig = async () => {
    if (!profileId) return;
    
    setIsSavingConfig(true);
    
    try {
      // Check if configuration already exists for this profile
      const { data: existingConfig, error: checkError } = await supabase
        .from('dashboard_config')
        .select('id')
        .eq('profile_id', profileId)
        .single();
      
      const configData = {
        profile_id: profileId,
        max_length: dashboardConfig.maxLength,
        number_of_projects: dashboardConfig.numberOfProjects,
        number_of_messages: dashboardConfig.numberOfMessages,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (existingConfig && !checkError) {
        // Update existing configuration
        result = await supabase
          .from('dashboard_config')
          .update(configData)
          .eq('id', existingConfig.id);
      } else {
        // Create new configuration
        result = await supabase
          .from('dashboard_config')
          .insert(configData);
      }
      
      if (result.error) {
        console.error('Error saving dashboard config:', result.error);
        setInfoMessage("Failed to save configuration. Please try again.");
        setTimeout(() => setInfoMessage(""), 3000);
      } else {
        console.log('Dashboard config saved successfully');
        setInfoMessage("Configuration saved successfully.");
        setTimeout(() => setInfoMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error in saveDashboardConfig:', error);
      setInfoMessage("Failed to save configuration. Please try again.");
      setTimeout(() => setInfoMessage(""), 3000);
    } finally {
      setIsSavingConfig(false);
    }
  };
  
  // Function to handle configuration value changes
  const handleConfigChange = (field, value) => {
    // Ensure value is a positive number
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;
    
    setDashboardConfig(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Render a loading spinner while data is being fetched
  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  return (
    <div className="settings-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="dash-header">
        <h1 className="title">Settings</h1>
      </div>
      <div className="set-f">
        <div className="input-field tech-input">
          <label htmlFor="tech">Projects Technologies</label>
          <div className="tech-add">
            <input
              type="text"
              id="tech"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={handleKeyDown} // Add tech on Enter key
              placeholder="Add a technology"
            />
            <div
              className="tech-logo"
              onClick={() => fileTechLogoRef.current.click()} // Trigger logo file input
            >
              {isTechLogoUploading ? (
                <div className="spin-loading-tech-logo"></div> // Show spinner during upload
              ) : newTechLogo ? (
                <img src={URL.createObjectURL(newTechLogo)} alt="Tech Logo" /> // Preview selected logo
              ) : (
                <span>Logo</span> // Placeholder text
              )}
            </div>
            <input
              type="file"
              ref={fileTechLogoRef}
              style={{ display: "none" }} // Hidden input for logo upload
              accept="image/*"
              onChange={(e) => {
                setNewTechLogo(e.target.files[0]); // Set selected logo
                setIsTechLogoUploading(false); // Reset uploading state
              }}
            />
            <button
              className="add-tech-btn"
              onClick={handleAddTech}
              disabled={!newTech.trim() || !newTechLogo} // Disable if inputs are incomplete
            >
              Add
            </button>
          </div>
          <div className="tech-items">
            {techItems.length > 0 ? (
              techItems.map((tech) => (
                <div key={tech.id} className="tech-item">
                  {tech.logo_url && (
                    <img src={tech.logo_url} alt={tech.name} width="50" /> // Display tech logo
                  )}
                  <h4>{tech.name}</h4> {/* Display tech name */}
                  <i
                    className="fa-solid fa-xmark"
                    onClick={() => handleDeleteTech(tech.id)} // Delete tech on click
                  ></i>
                </div>
              ))
            ) : (
              <p>No technologies added yet.</p> // Message if no techs
            )}
          </div>
        </div>
        
        {/* Dashboard Configuration */}
        <div className="input-field dashboard-config">
          <label>Dashboard Configuration</label>
          
          <div className="config-section">
            <div className="config-item">
              <label htmlFor="maxLength">Maximum text length (characters):</label>
              <div className="number-input-container">
                <button 
                  type="button" 
                  className="number-btn decrement" 
                  onClick={() => handleConfigChange('maxLength', Math.max(10, dashboardConfig.maxLength - 10))}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input 
                  type="number" 
                  className="custom-number-input"
                  id="maxLength" 
                  min="10" 
                  max="500" 
                  value={dashboardConfig.maxLength}
                  onChange={(e) => handleConfigChange('maxLength', e.target.value)}
                />
                <button 
                  type="button" 
                  className="number-btn increment" 
                  onClick={() => handleConfigChange('maxLength', Math.min(500, dashboardConfig.maxLength + 10))}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            
            <div className="config-item">
              <label htmlFor="numberOfProjects">Projects to display on home:</label>
              <div className="number-input-container">
                <button 
                  type="button" 
                  className="number-btn decrement" 
                  onClick={() => handleConfigChange('numberOfProjects', Math.max(1, dashboardConfig.numberOfProjects - 1))}
                  disabled={dashboardConfig.numberOfProjects <= 1}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input 
                  type="number" 
                  className="custom-number-input"
                  id="numberOfProjects" 
                  min="1" 
                  max="10" 
                  value={dashboardConfig.numberOfProjects}
                  onChange={(e) => handleConfigChange('numberOfProjects', e.target.value)}
                />
                <button 
                  type="button" 
                  className="number-btn increment" 
                  onClick={() => handleConfigChange('numberOfProjects', Math.min(10, dashboardConfig.numberOfProjects + 1))}
                  disabled={dashboardConfig.numberOfProjects >= 10}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            
            <div className="config-item">
              <label htmlFor="numberOfMessages">Messages to display on home:</label>
              <div className="number-input-container">
                <button 
                  type="button" 
                  className="number-btn decrement" 
                  onClick={() => handleConfigChange('numberOfMessages', Math.max(1, dashboardConfig.numberOfMessages - 1))}
                  disabled={dashboardConfig.numberOfMessages <= 1}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input 
                  type="number" 
                  className="custom-number-input"
                  id="numberOfMessages" 
                  min="1" 
                  max="10" 
                  value={dashboardConfig.numberOfMessages}
                  onChange={(e) => handleConfigChange('numberOfMessages', e.target.value)}
                />
                <button 
                  type="button" 
                  className="number-btn increment" 
                  onClick={() => handleConfigChange('numberOfMessages', Math.min(10, dashboardConfig.numberOfMessages + 1))}
                  disabled={dashboardConfig.numberOfMessages >= 10}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            
            <button 
              className="save-config-btn theme-button" 
              onClick={saveDashboardConfig}
              disabled={isSavingConfig}
            >
              {isSavingConfig ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
        
        {/* Logout Button */}
        <div className="logout-section">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
          >
            <i className="fa-solid fa-sign-out-alt"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

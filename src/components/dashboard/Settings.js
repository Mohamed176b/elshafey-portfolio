import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { clearUserSession } from "../../utils/authUtils";

// TechItem Component - Extracted to improve performance
const TechItem = React.memo(({ tech, onDelete }) => (
  <div className="tech-item">
    {tech.logo_url && <img src={tech.logo_url} alt={tech.name} width="50" />}
    <h4>{tech.name}</h4>
    <i className="fa-solid fa-xmark" onClick={() => onDelete(tech.id)}></i>
  </div>
));

// ConfigurationInput Component - Extracted to improve performance
const ConfigurationInput = React.memo(
  ({
    label,
    id,
    value,
    min,
    max,
    onChange,
    onIncrement,
    onDecrement,
    isDecrementDisabled,
    isIncrementDisabled,
  }) => (
    <div className="config-item">
      <label htmlFor={id}>{label}</label>
      <div className="number-input-container">
        <button
          type="button"
          className="number-btn decrement"
          onClick={onDecrement}
          disabled={isDecrementDisabled}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        <input
          type="number"
          className="custom-number-input"
          id={id}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="number-btn increment"
          onClick={onIncrement}
          disabled={isIncrementDisabled}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  )
);

const Settings = () => {
  /**
   * Settings state management
   * Handles configuration values and UI states
   */
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
    maxLength: 70, // Maximum description length
    numberOfProjects: 3, // Number of projects to display
    numberOfMessages: 3, // Number of messages to display
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Memoize fetchTechItems function
  const fetchTechItems = useCallback(async (profileId) => {
    const { data: techData, error: techError } = await supabase
      .from("available_techs")
      .select("*")
      .eq("profile_id", profileId);

    if (techError) {
      console.error("Failed to fetch technologies! Error:", techError);
    } else {
      setTechItems(techData || []);
      console.log("Technologies fetched successfully:", techData);
    }
  }, []);

  // Memoize fetchDashboardConfig function
  const fetchDashboardConfig = useCallback(async (profileId) => {
    try {
      const { data, error } = await supabase
        .from("dashboard_config")
        .select("*")
        .eq("profile_id", profileId);

      if (error) {
        console.error("Error fetching dashboard config:", error);
      } else if (data && data.length > 0) {
        const config = data[0];
        setDashboardConfig({
          maxLength: config.max_length || 70,
          numberOfProjects: config.number_of_projects || 3,
          numberOfMessages: config.number_of_messages || 3,
        });
        console.log("Dashboard config loaded successfully");
      } else {
        console.log("No dashboard config found, using defaults");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard config:", error);
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
          await fetchTechItems(profile.id);
        } else {
          console.log(
            "No profile found for user. Initializing with empty values."
          );
        }
      }
    },
    [fetchTechItems]
  );

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

    checkSession(); // Initiate session check and profile fetch

    if (profileId) {
      fetchDashboardConfig(profileId);
    }
  }, [navigate, profileId, fetchProfile, fetchDashboardConfig]); // Added missing dependencies

  // Function to add a new technology with a logo
  const handleAddTech = useCallback(async () => {
    if (!newTech.trim() || !newTechLogo || !profileId) {
      console.log("Cannot add technology: Missing name, logo, or profile ID.");
      return;
    }

    setIsTechLogoUploading(true);

    const fileExt = newTechLogo.name.split(".").pop();
    const filePath = `ava-techs-${profileId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("projects-tech-logos")
      .upload(filePath, newTechLogo, { upsert: true });

    if (uploadError) {
      console.error("Failed to upload tech logo! Error:", uploadError);
      setIsTechLogoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("projects-tech-logos")
      .getPublicUrl(filePath);

    const techLogoUrl = urlData.publicUrl;

    const newTechData = {
      profile_id: profileId,
      name: newTech.trim(),
      logo_url: techLogoUrl,
    };

    const { data, error } = await supabase
      .from("available_techs")
      .insert(newTechData)
      .select();

    if (error) {
      console.error("Failed to add technology! Error:", error);
    } else {
      setTechItems((prevItems) => [...prevItems, data[0]]);
      setNewTech("");
      setNewTechLogo(null);
      console.log("Technology added successfully:", data[0]);
    }

    setIsTechLogoUploading(false);
  }, [newTech, newTechLogo, profileId]);

  // Function to delete a technology and its logo
  const handleDeleteTech = useCallback(
    async (techId) => {
      const techToDelete = techItems.find((tech) => tech.id === techId);
      if (techToDelete && techToDelete.logo_url) {
        const urlParts = techToDelete.logo_url.split(
          "/storage/v1/object/public/projects-tech-logos/"
        );
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          const { error: removeError } = await supabase.storage
            .from("projects-tech-logos")
            .remove([filePath]);
          if (removeError) {
            console.error("Failed to delete tech logo! Error:", removeError);
          } else {
            console.log("Tech logo deleted successfully:", filePath);
          }
        }
      }

      const { error } = await supabase
        .from("available_techs")
        .delete()
        .eq("id", techId);

      if (error) {
        console.error("Failed to delete technology! Error:", error);
      } else {
        setTechItems((prevItems) =>
          prevItems.filter((tech) => tech.id !== techId)
        );
        console.log("Technology deleted successfully. ID:", techId);
      }
    },
    [techItems]
  );

  // Function to add a technology when Enter key is pressed
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleAddTech();
        console.log("Enter key pressed to add technology.");
      }
    },
    [handleAddTech]
  );

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
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearUserSession();
      navigate("/"); // Navigate to home page
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [navigate]);

  // Function to save dashboard configuration
  const saveDashboardConfig = useCallback(async () => {
    if (!profileId) return;

    setIsSavingConfig(true);

    try {
      // Check if configuration already exists for this profile
      const { data: existingConfig, error: checkError } = await supabase
        .from("dashboard_config")
        .select("id")
        .eq("profile_id", profileId)
        .single();

      const configData = {
        profile_id: profileId,
        max_length: dashboardConfig.maxLength,
        number_of_projects: dashboardConfig.numberOfProjects,
        number_of_messages: dashboardConfig.numberOfMessages,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (existingConfig && !checkError) {
        // Update existing configuration
        result = await supabase
          .from("dashboard_config")
          .update(configData)
          .eq("id", existingConfig.id);
      } else {
        // Create new configuration
        result = await supabase.from("dashboard_config").insert(configData);
      }

      if (result.error) {
        console.error("Error saving dashboard config:", result.error);
        setInfoMessage("Failed to save configuration. Please try again.");
        setTimeout(() => setInfoMessage(""), 3000);
      } else {
        console.log("Dashboard config saved successfully");
        setInfoMessage("Configuration saved successfully.");
        setTimeout(() => setInfoMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error in saveDashboardConfig:", error);
      setInfoMessage("Failed to save configuration. Please try again.");
      setTimeout(() => setInfoMessage(""), 3000);
    } finally {
      setIsSavingConfig(false);
    }
  }, [profileId, dashboardConfig]);

  // Function to handle configuration value changes
  const handleConfigChange = useCallback((field, value) => {
    // Ensure value is a positive number
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) return;

    setDashboardConfig((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  }, []);

  // Memoize tech items rendering
  const renderedTechItems = useMemo(() => {
    return techItems.length > 0 ? (
      techItems.map((tech) => (
        <TechItem key={tech.id} tech={tech} onDelete={handleDeleteTech} />
      ))
    ) : (
      <p>No technologies added yet.</p>
    );
  }, [techItems, handleDeleteTech]);

  // Memoize configuration validation
  const isConfigValid = useMemo(() => {
    return (
      dashboardConfig.maxLength >= 10 &&
      dashboardConfig.maxLength <= 500 &&
      dashboardConfig.numberOfProjects >= 1 &&
      dashboardConfig.numberOfProjects <= 10 &&
      dashboardConfig.numberOfMessages >= 1 &&
      dashboardConfig.numberOfMessages <= 10
    );
  }, [dashboardConfig]);

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
          <div className="tech-items">{renderedTechItems}</div>
        </div>

        {/* Dashboard Configuration */}
        <div className="input-field dashboard-config">
          <label>Dashboard Configuration</label>

          <div className="config-section">
            <ConfigurationInput
              label="Maximum text length (characters):"
              id="maxLength"
              value={dashboardConfig.maxLength}
              min={10}
              max={500}
              onChange={(value) => handleConfigChange("maxLength", value)}
              onIncrement={() =>
                handleConfigChange(
                  "maxLength",
                  Math.min(500, dashboardConfig.maxLength + 10)
                )
              }
              onDecrement={() =>
                handleConfigChange(
                  "maxLength",
                  Math.max(10, dashboardConfig.maxLength - 10)
                )
              }
              isDecrementDisabled={dashboardConfig.maxLength <= 10}
              isIncrementDisabled={dashboardConfig.maxLength >= 500}
            />

            <ConfigurationInput
              label="Projects to display on home:"
              id="numberOfProjects"
              value={dashboardConfig.numberOfProjects}
              min={1}
              max={10}
              onChange={(value) =>
                handleConfigChange("numberOfProjects", value)
              }
              onIncrement={() =>
                handleConfigChange(
                  "numberOfProjects",
                  Math.min(10, dashboardConfig.numberOfProjects + 1)
                )
              }
              onDecrement={() =>
                handleConfigChange(
                  "numberOfProjects",
                  Math.max(1, dashboardConfig.numberOfProjects - 1)
                )
              }
              isDecrementDisabled={dashboardConfig.numberOfProjects <= 1}
              isIncrementDisabled={dashboardConfig.numberOfProjects >= 10}
            />

            <ConfigurationInput
              label="Messages to display on home:"
              id="numberOfMessages"
              value={dashboardConfig.numberOfMessages}
              min={1}
              max={10}
              onChange={(value) =>
                handleConfigChange("numberOfMessages", value)
              }
              onIncrement={() =>
                handleConfigChange(
                  "numberOfMessages",
                  Math.min(10, dashboardConfig.numberOfMessages + 1)
                )
              }
              onDecrement={() =>
                handleConfigChange(
                  "numberOfMessages",
                  Math.max(1, dashboardConfig.numberOfMessages - 1)
                )
              }
              isDecrementDisabled={dashboardConfig.numberOfMessages <= 1}
              isIncrementDisabled={dashboardConfig.numberOfMessages >= 10}
            />

            <button
              className="save-config-btn theme-button"
              onClick={saveDashboardConfig}
              disabled={isSavingConfig || !isConfigValid}
            >
              {isSavingConfig ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-sign-out-alt"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Settings);

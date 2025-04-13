import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import FeaturesForm from "./features/FeaturesForm";

/**
 * AddNewProject Component
 * Handles the creation of new portfolio projects with:
 * - Form validation
 * - Image upload
 * - Technology stack selection
 * - Project details input
 */
const AddNewProject = () => {
  /**
   * Project form state management
   * Handles form data, validation, and submission
   */
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [availableTechs, setAvailableTechs] = useState([]);
  const [originalAvailableTechs, setOriginalAvailableTechs] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectThumbPreview, setProjectThumbPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const thumbInputRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [infoMessage, setInfoMessage] = useState("");

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
          await fetchTechItems(profile.id);
        }
      }
    };

    const fetchTechItems = async (profileId) => {
      const { data: techData, error: techError } = await supabase
        .from("available_techs")
        .select("*")
        .eq("profile_id", profileId);
      if (techError) {
        console.error("Failure to fetch technologies:", techError);
      } else {
        setAvailableTechs(techData || []);
        setOriginalAvailableTechs(techData || []);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSelectTech = useCallback(
    (techId) => {
      const tech = availableTechs.find((t) => t.id === techId);
      if (tech) {
        setAvailableTechs(availableTechs.filter((t) => t.id !== techId));
        setSelectedTechs([...selectedTechs, tech]);
      }
    },
    [availableTechs, selectedTechs]
  );

  const handleDeselectTech = useCallback(
    (techId) => {
      const tech = selectedTechs.find((t) => t.id === techId);
      if (tech) {
        setSelectedTechs(selectedTechs.filter((t) => t.id !== techId));
        setAvailableTechs([...availableTechs, tech]);
      }
    },
    [availableTechs, selectedTechs]
  );

  const handleAddFeature = useCallback(() => {
    if (newFeature.trim() !== "") {
      setFeatures((prev) => [...prev, newFeature]);
      setNewFeature("");
    }
  }, [newFeature]);

  const handleDeleteFeature = useCallback((index) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEditFeature = useCallback(
    (index) => {
      setEditingIndex(index);
      setEditingValue(features[index]);
    },
    [features]
  );

  const handleSaveFeature = useCallback(() => {
    if (editingValue.trim() !== "") {
      setFeatures((prev) => {
        const updated = [...prev];
        updated[editingIndex] = editingValue;
        return updated;
      });
      setEditingIndex(null);
      setEditingValue("");
    }
  }, [editingValue, editingIndex]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleAddFeature();
      }
    },
    [handleAddFeature]
  );

  const handleNewFeatureChange = useCallback((value) => {
    setNewFeature(value);
  }, []);

  const handleEditValueChange = useCallback((value) => {
    setEditingValue(value);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
  }, []);

  /**
   * Image upload handler
   * @param {Event} e - Upload input change event
   * Processes and validates image files before upload
   */
  const cleanupImage = useCallback(() => {
    if (projectThumbPreview) {
      URL.revokeObjectURL(projectThumbPreview);
    }
  }, [projectThumbPreview]);

  useEffect(() => {
    return () => {
      cleanupImage();
    };
  }, [cleanupImage]);

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (file) {
        cleanupImage();
        setSelectedFile(file);
        setProjectThumbPreview(URL.createObjectURL(file));
      }
    },
    [cleanupImage]
  );

  /**
   * Form submission handler
   * Validates form data and creates new project entry
   * @param {Event} e - Form submission event
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (
        !projectName ||
        !description ||
        !selectedFile ||
        selectedTechs.length === 0 ||
        features.length === 0
      ) {
        setInfoMessage("Please fill in all required fields.");
        setTimeout(() => setInfoMessage(""), 3000);
        return;
      }

      setIsSaving(true);

      try {
        const file = selectedFile;
        const fileExt = file.name.split(".").pop();
        const filePath = `project-thumbs/${profileId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("projects-thumbnails")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("projects-thumbnails")
          .getPublicUrl(filePath);

        const thumbnailUrl = urlData.publicUrl;

        const { data: existingProjects, error: fetchError } = await supabase
          .from("projects")
          .select("display_order")
          .eq("profile_id", profileId)
          .order("display_order", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        const nextDisplayOrder =
          existingProjects && existingProjects.length > 0
            ? (existingProjects[0].display_order || 0) + 1
            : 1;

        const techIds = selectedTechs.map((tech) => tech.id);
        const projectData = {
          name: projectName,
          description,
          demoLink,
          githubLink,
          thumbnailUrl,
          profile_id: profileId,
          techs: techIds,
          features,
          display_order: nextDisplayOrder,
        };

        const { data, error } = await supabase
          .from("projects")
          .insert(projectData)
          .select();

        if (error) throw error;

        console.log("Project saved successfully:", data);
        setInfoMessage("Project saved successfully");

        // Reset form
        setProjectName("");
        setDescription("");
        setDemoLink("");
        setGithubLink("");
        setSelectedTechs([]);
        setSelectedFile(null);
        setProjectThumbPreview("");
        setFeatures([]);
        setAvailableTechs(originalAvailableTechs);
      } catch (error) {
        console.error("Failed to save the project! Error:", error);
        setInfoMessage("Failed to save the project. Please try again.");
      } finally {
        setTimeout(() => setInfoMessage(""), 3000);
        setIsSaving(false);
      }
    },
    [
      projectName,
      description,
      demoLink,
      githubLink,
      selectedFile,
      selectedTechs,
      features,
      profileId,
      originalAvailableTechs,
    ]
  );

  const TechSelectorComponent = useMemo(() => {
    return function TechSelector() {
      return (
        <div className="select-technologies">
          <div className="tech-selection">
            <div className="available-techs">
              <h2>Available Technologies</h2>
              <div className="tech-list">
                {availableTechs.map((tech) => (
                  <div
                    key={tech.id}
                    className="tech-item"
                    onClick={() => handleSelectTech(tech.id)}
                  >
                    <img src={tech.logo_url} alt={tech.name} width="50" />
                    <h4>{tech.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <div className="selected-techs">
              <h2>Selected Technologies</h2>
              <div className="tech-list">
                {selectedTechs.map((tech) => (
                  <div
                    key={tech.id}
                    className="tech-item"
                    onClick={() => handleDeselectTech(tech.id)}
                  >
                    <img src={tech.logo_url} alt={tech.name} width="50" />
                    <h4>{tech.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };
  }, [availableTechs, selectedTechs, handleSelectTech, handleDeselectTech]);

  const formData = useMemo(
    () => ({
      features,
      newFeature,
      editingIndex,
      editingValue,
      onFeatureAdd: handleAddFeature,
      onFeatureDelete: handleDeleteFeature,
      onFeatureEdit: handleEditFeature,
      onFeatureSave: handleSaveFeature,
      onNewFeatureChange: handleNewFeatureChange,
      onEditValueChange: handleEditValueChange,
      onKeyDown: handleKeyDown,
      onCancelEdit: handleCancelEdit,
    }),
    [
      features,
      newFeature,
      editingIndex,
      editingValue,
      handleAddFeature,
      handleDeleteFeature,
      handleEditFeature,
      handleSaveFeature,
      handleNewFeatureChange,
      handleEditValueChange,
      handleKeyDown,
      handleCancelEdit,
    ]
  );

  const renderLoading = useCallback(() => {
    return <div className="page-spin"></div>;
  }, []);

  if (isLoading) {
    return renderLoading();
  }

  return (
    <div className="add-project-page">
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="add-pro-inputs">
        <div>
          <div className="input-field">
            <label htmlFor="name">Project Name</label>
            <input
              className="add-pro-input"
              placeholder="Project Name"
              required
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              id="name"
            />
          </div>
          <div className="input-field">
            <label htmlFor="description">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id="description"
            />
          </div>
          <div className="input-field pro-links">
            <label htmlFor="demo-link">Demo Link</label>
            <input
              className="add-pro-input"
              placeholder="Demo Link"
              type="text"
              value={demoLink}
              onChange={(e) => setDemoLink(e.target.value)}
              id="demo-link"
            />
            <label htmlFor="github-link">GitHub Link</label>
            <input
              className="add-pro-input"
              placeholder="GitHub Link"
              type="text"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              id="github-link"
            />
          </div>
          <TechSelectorComponent />
        </div>
        <div className="sec-pro">
          <div className="thumb">
            {projectThumbPreview ? (
              <>
                <img src={projectThumbPreview} alt="Thumbnail Preview" />
                <div
                  title="Change Thumbnail"
                  className="chng-img"
                  onClick={() => thumbInputRef.current.click()}
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
              </>
            ) : (
              <div
                title="Upload Thumbnail"
                className="upload-img"
                onClick={() => thumbInputRef.current.click()}
              >
                <i className="fa-solid fa-image"></i>
              </div>
            )}
            <input
              type="file"
              ref={thumbInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <FeaturesForm {...formData} />
        </div>
      </div>
      <button className="prof-btn" onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default AddNewProject;

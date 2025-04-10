import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

const AddNewProject = () => {
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("Session check failed! Error:", sessionError || "No session found");
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
        const profile = profileData && profileData.length > 0 ? profileData[0] : null;
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

  const handleSelectTech = (techId) => {
    const tech = availableTechs.find((t) => t.id === techId);
    if (tech) {
      setAvailableTechs(availableTechs.filter((t) => t.id !== techId));
      setSelectedTechs([...selectedTechs, tech]);
    }
  };

  const handleDeselectTech = (techId) => {
    const tech = selectedTechs.find((t) => t.id === techId);
    if (tech) {
      setSelectedTechs(selectedTechs.filter((t) => t.id !== techId));
      setAvailableTechs([...availableTechs, tech]);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() !== "") {
      setFeatures([...features, newFeature]);
      setNewFeature("");
    }
  };

  const handleDeleteFeature = (index) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setFeatures(updatedFeatures);
  };

  const handleEditFeature = (index) => {
    setEditingIndex(index);
    setEditingValue(features[index]);
  };

  const handleSaveFeature = () => {
    if (editingValue.trim() !== "") {
      const updatedFeatures = [...features];
      updatedFeatures[editingIndex] = editingValue;
      setFeatures(updatedFeatures);
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddFeature();
    }
  };

  const handleSaveProject = async () => {
    if (
      !projectName ||
      !description ||
      !demoLink ||
      !selectedFile ||
      selectedTechs.length === 0 ||
      features.length === 0
    ) {
      setInfoMessage("Please fill in all required fields.");
      setTimeout(() => setInfoMessage(""), 3000);
      return;
    }

    setIsSaving(true);

    const file = selectedFile;
    const fileExt = file.name.split(".").pop();
    const filePath = `project-thumbs/${profileId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("projects-thumbnails")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Failed to upload the thumbnail! Error:", uploadError);
      setIsSaving(false);
      setInfoMessage("Failed to upload the thumbnail. Please try again.");
      setTimeout(() => setInfoMessage(""), 3000);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("projects-thumbnails")
      .getPublicUrl(filePath);

    const thumbnailUrl = urlData.publicUrl;

    // Get current max display_order
    const { data: existingProjects, error: fetchError } = await supabase
      .from("projects")
      .select("display_order")
      .eq("profile_id", profileId)
      .order('display_order', { ascending: false })
      .limit(1);
      
    // Calculate next display order (max + 1 or 1 if no projects exist)
    const nextDisplayOrder = (existingProjects && existingProjects.length > 0) 
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
      display_order: nextDisplayOrder, // Assign the next display order
    };

    if (fetchError) {
      console.error("Error getting current project order:", fetchError);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select();

    if (error) {
      console.error("Failed to save the project! Error:", error);
      setInfoMessage("Failed to save the project. Please try again.");
      setTimeout(() => setInfoMessage(""), 3000);
    } else {
      console.log("Project saved successfully:", data);
      setInfoMessage("Project saved successfully");
      setTimeout(() => setInfoMessage(""), 3000);
      setProjectName("");
      setDescription("");
      setDemoLink("");
      setGithubLink("");
      setSelectedTechs([]);
      setSelectedFile(null);
      setProjectThumbPreview("");
      setFeatures([]);
      setAvailableTechs(originalAvailableTechs);
    }

    setIsSaving(false);
  };
  

  if (isLoading) {
    return <div className="page-spin"></div>;
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
              required
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
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                  setProjectThumbPreview(URL.createObjectURL(file)); 
                }
              }}
            />
          </div>
          <div className="features">
            <h2>Features</h2>
            <div className="input-field">
              <input
                className="add-pro-input"
                placeholder="Add New Feature"
                type="text"
                value={editingIndex !== null ? editingValue : newFeature}
                onChange={(e) =>
                  editingIndex !== null
                    ? setEditingValue(e.target.value)
                    : setNewFeature(e.target.value)
                }
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={
                  editingIndex !== null ? handleSaveFeature : handleAddFeature
                }
              >
                {editingIndex !== null ? "Save" : "Add"}
              </button>
              {editingIndex !== null && (
                <button onClick={() => setEditingIndex(null)}>Cancel</button>
              )}
            </div>
            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span>{feature}</span>
                  <div>
                    <button
                      className="edit-fea"
                      title="Edit"
                      onClick={() => handleEditFeature(index)}
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      className="delete-fea"
                      title="Delete"
                      onClick={() => handleDeleteFeature(index)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button
        className="prof-btn"
        onClick={handleSaveProject}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default AddNewProject;
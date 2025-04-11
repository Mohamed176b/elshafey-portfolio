import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

// المكونات المحسنة
const Toast = React.memo(({ message }) => (
  <div className="toast">{message}</div>
));

const LoadingSpinner = React.memo(() => <div className="page-spin"></div>);

// مكون TechItem المحسن للقائمة
const TechItem = React.memo(({ tech, onClick, children }) => (
  <div key={tech.id} className="tech-item" onClick={() => onClick(tech.id)}>
    <img src={tech.logo_url} alt={tech.name} width="50" loading="lazy" />
    <h4>{tech.name}</h4>
    {children}
  </div>
));

// مكون TechList المحسن مع التقسيم المنطقي
const TechList = React.memo(({ techs, onTechClick, title }) => {
  const [showMore, setShowMore] = useState(false);

  const visibleTechs = useMemo(
    () => (showMore ? techs : techs.slice(0, 20)),
    [techs, showMore]
  );

  return (
    <div>
      <h2>{title}</h2>
      <div className="tech-list">
        {visibleTechs.map((tech) => (
          <TechItem key={tech.id} tech={tech} onClick={onTechClick} />
        ))}
        {!showMore && techs.length > 20 && (
          <div className="load-more">
            <button onClick={() => setShowMore(true)}>
              Show More ({techs.length - 20})
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// مكون FeatureItem المحسن
const FeatureItem = React.memo(({ feature, index, onEdit, onDelete }) => (
  <div className="feature-item">
    <span>{feature}</span>
    <div>
      <button className="edit-fea" title="Edit" onClick={() => onEdit(index)}>
        <i className="fa-solid fa-pen"></i>
      </button>
      <button
        className="delete-fea"
        title="Delete"
        onClick={() => onDelete(index)}
      >
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>
  </div>
));

const EditProject = () => {
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
  const { projectId } = useParams();
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState("");

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
        }
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (profileId) {
      const fetchTechItems = async () => {
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
      fetchTechItems();
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId && originalAvailableTechs.length > 0) {
      const fetchProjectData = async () => {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("profile_id", profileId)
          .single();
        if (projectError) {
          console.error("Failure to fetch project:", projectError);
        } else {
          setProjectName(projectData.name);
          setDescription(projectData.description);
          setDemoLink(projectData.demoLink || "");
          setGithubLink(projectData.githubLink || "");
          setOriginalThumbnailUrl(projectData.thumbnailUrl || "");
          setProjectThumbPreview(projectData.thumbnailUrl || "");
          setFeatures(projectData.features || []);

          const selectedTechIds = projectData.techs || [];
          const selectedTechsData = originalAvailableTechs.filter((tech) =>
            selectedTechIds.includes(tech.id)
          );
          setSelectedTechs(selectedTechsData);
          setAvailableTechs(
            originalAvailableTechs.filter(
              (tech) => !selectedTechIds.includes(tech.id)
            )
          );
        }
      };
      fetchProjectData();
    }
  }, [profileId, originalAvailableTechs, projectId]);

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
  }, [editingIndex, editingValue]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleAddFeature();
      }
    },
    [handleAddFeature]
  );

  const handleSaveProject = useCallback(async () => {
    if (
      !projectName ||
      !description ||
      !demoLink ||
      selectedTechs.length === 0 ||
      features.length === 0
    ) {
      setInfoMessage("Please fill in all required fields.");
      setTimeout(() => setInfoMessage(""), 3000);
      return;
    }

    setIsSaving(true);

    let thumbnailUrl = originalThumbnailUrl;
    if (selectedFile) {
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
      thumbnailUrl = urlData.publicUrl;
    }

    const techIds = selectedTechs.map((tech) => tech.id);
    const { data: currentProject, error: currentProjectError } = await supabase
      .from("projects")
      .select("display_order")
      .eq("id", projectId)
      .single();

    if (currentProjectError) {
      console.error(
        "Failed to get current project order:",
        currentProjectError
      );
    }

    const projectData = {
      name: projectName,
      description,
      demoLink,
      githubLink,
      thumbnailUrl,
      profile_id: profileId,
      techs: techIds,
      features,
      display_order: currentProject?.display_order,
    };

    const { data, error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", projectId)
      .select();

    if (error) {
      console.error("Failed to update the project! Error:", error);
      setInfoMessage("Failed to update the project. Please try again.");
      setTimeout(() => setInfoMessage(""), 3000);
      setIsSaving(false);
      return;
    }

    if (selectedFile && originalThumbnailUrl) {
      const urlParts = originalThumbnailUrl.split("/");
      const bucketIndex = urlParts.indexOf("projects-thumbnails");
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const oldFilePath = urlParts.slice(bucketIndex + 1).join("/");
        const { error: deleteError } = await supabase.storage
          .from("projects-thumbnails")
          .remove([oldFilePath]);
        if (deleteError) {
          console.error("Failed to delete old thumbnail:", deleteError);
        }
      } else {
        console.error("Invalid original thumbnail URL:", originalThumbnailUrl);
      }
    }

    console.log("Project updated successfully:", data);
    setInfoMessage("Project updated successfully");
    setTimeout(() => setInfoMessage(""), 3000);
    setIsSaving(false);
  }, [
    projectName,
    description,
    demoLink,
    selectedTechs,
    features,
    selectedFile,
    originalThumbnailUrl,
    profileId,
    projectId,
    githubLink,
  ]);

  // تحسين معالجة تحديث الصورة المصغرة
  const handleThumbnailChange = useCallback((file) => {
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setProjectThumbPreview(objectUrl);

      // تنظيف objectUrl عند تغيير الصورة
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, []);

  // تحسين معالجة معاينة الصور
  const cleanupImagePreview = useCallback(() => {
    if (projectThumbPreview && projectThumbPreview !== originalThumbnailUrl) {
      URL.revokeObjectURL(projectThumbPreview);
    }
  }, [projectThumbPreview, originalThumbnailUrl]);

  useEffect(() => {
    return () => cleanupImagePreview();
  }, [cleanupImagePreview]);

  // تحسين التحقق من صحة النموذج باستخدام useMemo
  const formValidation = useMemo(
    () => ({
      isNameValid: projectName.length > 0,
      isDescriptionValid: description.length > 0,
      isDemoLinkValid: demoLink.length > 0,
      isTechsValid: selectedTechs.length > 0,
      isFeaturesValid: features.length > 0,
      isValid: Boolean(
        projectName &&
          description &&
          demoLink &&
          selectedTechs.length > 0 &&
          features.length > 0
      ),
    }),
    [projectName, description, demoLink, selectedTechs, features]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // تحسين عرض القوائم باستخدام المكونات المحسنة
  return (
    <div className="add-project-page">
      {infoMessage && <Toast message={infoMessage} />}
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
                <TechList
                  techs={availableTechs}
                  onTechClick={handleSelectTech}
                  title="Available Technologies"
                />
              </div>
              <div className="selected-techs">
                <TechList
                  techs={selectedTechs}
                  onTechClick={handleDeselectTech}
                  title="Selected Technologies"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="sec-pro">
          <div className="thumb">
            {projectThumbPreview ? (
              <>
                <img src={projectThumbPreview} alt="Thumbnail Preview" loading="lazy"/>
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
                handleThumbnailChange(file);
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
                <FeatureItem
                  key={index}
                  feature={feature}
                  index={index}
                  onEdit={handleEditFeature}
                  onDelete={handleDeleteFeature}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <button
        className="prof-btn"
        onClick={handleSaveProject}
        disabled={isSaving || !formValidation.isValid}
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default React.memo(EditProject);

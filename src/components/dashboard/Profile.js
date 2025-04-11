import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

// مكون TechItem المحسن
const TechItem = React.memo(({ tech, onDelete }) => (
  <div className="tech-item">
    {tech.tech_logo_url && (
      <img src={tech.tech_logo_url} alt={tech.tech_name} width="50" loading="lazy"/>
    )}
    <h4>{tech.tech_name}</h4>
    <i className="fa-solid fa-xmark" onClick={() => onDelete(tech.id)}></i>
  </div>
));

// مكون ContactFields المحسن
const ContactFields = React.memo(
  ({ email, github, linkedin, facebook, onChange }) => (
    <div className="contacts">
      <h3>Contacts</h3>
      <div>
        <div className="input-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            id="email"
          />
        </div>
        <div className="input-field">
          <label htmlFor="github">GitHub</label>
          <input
            type="text"
            value={github}
            onChange={(e) => onChange("github", e.target.value)}
            id="github"
          />
        </div>
        <div className="input-field">
          <label htmlFor="linkedin">LinkedIn</label>
          <input
            type="text"
            value={linkedin}
            onChange={(e) => onChange("linkedin", e.target.value)}
            id="linkedin"
          />
        </div>
        <div className="input-field">
          <label htmlFor="facebook">Facebook</label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => onChange("facebook", e.target.value)}
            id="facebook"
          />
        </div>
      </div>
    </div>
  )
);

// مكون ProfileImage المحسن
const ProfileImage = React.memo(
  ({ userImg, isUploading, onImageClick, fileInputRef, onFileChange }) => (
    <div className="user-img">
      {isUploading ? (
        <div className="spin-loading"></div>
      ) : userImg ? (
        <img alt="UserImage" src={userImg} loading="lazy"/>
      ) : (
        <div>
          <i className="fa-solid fa-user alt-img" alt="User Image"></i>
        </div>
      )}
      <div title="Change Picture" className="chng-img" onClick={onImageClick}>
        <i className="fa-solid fa-pen-to-square"></i>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={onFileChange}
      />
    </div>
  )
);

// مكون CvUpload المحسن
const CvUpload = React.memo(
  ({ cvUrl, isCvUploading, onButtonClick, cvFileInputRef, onFileChange }) => (
    <div className="input-field">
      <label>CV</label>
      {cvUrl ? (
        <div className="cv-div">
          <a href={cvUrl} target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-file"></i>
            <span>View CV</span>
          </a>
          <button onClick={onButtonClick} disabled={isCvUploading}>
            {isCvUploading ? "Uploading..." : "Change CV"}
          </button>
        </div>
      ) : (
        <div className="cv-div">
          <button onClick={onButtonClick} disabled={isCvUploading}>
            {isCvUploading ? "Uploading..." : "Upload CV"}
          </button>
        </div>
      )}
      <input
        type="file"
        ref={cvFileInputRef}
        style={{ display: "none" }}
        accept="application/pdf"
        onChange={onFileChange}
      />
    </div>
  )
);

const Profile = () => {
  /**
   * Profile state management
   * Handles user data, form state, and validation
   */
  // State variables to manage profile data and UI states
  const [name, setName] = useState(""); // Stores the user's name
  const [about, setAbout] = useState(""); // Stores the "About" section text
  const [email, setEmail] = useState(""); // Stores the user's email
  const [github, setGithub] = useState(""); // Stores the GitHub profile URL
  const [linkedin, setLinkedin] = useState(""); // Stores the LinkedIn profile URL
  const [facebook, setFacebook] = useState(""); // Stores the Facebook profile URL
  const [userImg, setUserImg] = useState(""); // Stores the profile image URL
  const [cvUrl, setCvUrl] = useState(""); // Stores the CV file URL
  const [profileId, setProfileId] = useState(null); // Stores the profile ID from the database
  const [techItems, setTechItems] = useState([]); // Stores the list of technologies
  const [newTech, setNewTech] = useState(""); // Stores the name of a new technology to add
  const [isLoading, setIsLoading] = useState(true); // Indicates if initial data is being fetched
  const [isUploading, setIsUploading] = useState(false); // Indicates if a profile image is uploading
  const [isCvUploading, setIsCvUploading] = useState(false); // Indicates if a CV is uploading
  const [infoMessage, setInfoMessage] = useState(""); // Displays temporary info messages to the user
  const navigate = useNavigate(); // Hook for programmatic navigation
  const fileInputRef = useRef(null); // Ref for the profile image file input
  const cvFileInputRef = useRef(null); // Ref for the CV file input
  const fileTechLogoRef = useRef(null); // Ref for the technology logo file input
  const [newTechLogo, setNewTechLogo] = useState(null); // Stores the file of a new tech logo
  const [isTechLogoUploading, setIsTechLogoUploading] = useState(false); // Indicates if a tech logo is uploading

  // Memoize the profile update data structure
  const updatedProfileData = useMemo(() => {
    return {
      name,
      about,
      email,
      github,
      linkedin,
      facebook,
    };
  }, [name, about, email, github, linkedin, facebook]);

  // Memoize tech items filtering
  const sortedTechItems = useMemo(() => {
    return [...techItems].sort((a, b) =>
      a.tech_name.localeCompare(b.tech_name)
    );
  }, [techItems]);

  // Optimize fetchProfile with useCallback
  const fetchProfile = useCallback(async (user) => {
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
        setName(profile.name || "");
        setAbout(profile.about || "");
        setEmail(profile.email || "");
        setGithub(profile.github || "");
        setLinkedin(profile.linkedin || "");
        setFacebook(profile.facebook || "");
        setUserImg(profile.user_img || "");
        setCvUrl(profile.cv_url || "");
        await fetchTechItems(profile.id);
      } else {
        console.log(
          "No profile found for user. Initializing with empty values."
        );
        setUserImg("");
        setCvUrl("");
      }
    }
  }, []);

  // Optimize fetchTechItems with useCallback
  const fetchTechItems = useCallback(async (profileId) => {
    const { data: techData, error: techError } = await supabase
      .from("tech_items")
      .select("*")
      .eq("profile_id", profileId);

    if (techError) {
      console.error("Failed to fetch technologies! Error:", techError);
    } else {
      setTechItems(techData || []);
      console.log("Technologies fetched successfully:", techData);
    }
  }, []);

  // Optimize checkSession with useCallback
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
    const user = sessionData.session.user;
    await fetchProfile(user);
    setIsLoading(false);
  }, [navigate, fetchProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Profile update handler
   * Validates and saves profile changes
   * @param {Event} e - Form submission event
   */
  const handleUpdate = useCallback(async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        "Session unavailable for update! Error:",
        sessionError || "No session"
      );
      navigate("/admin");
      return;
    }
    const user = sessionData.session.user;

    const updatedData = {
      user_id: user.id,
      ...updatedProfileData,
    };

    let result;
    if (profileId) {
      result = await supabase
        .from("profile")
        .update(updatedData)
        .eq("id", profileId);
    } else {
      result = await supabase.from("profile").insert(updatedData);
      if (!result.error && result.data) {
        setProfileId(result.data[0].id);
        console.log("New profile created with ID:", result.data[0].id);
      }
    }

    const { data, error } = result;
    if (error) {
      console.error("Failed to update profile! Error:", error);
    } else {
      console.log("Profile updated successfully:", data);
      setInfoMessage("Information updated");
      setTimeout(() => setInfoMessage(""), 3000);
    }
  }, [navigate, profileId, updatedProfileData]);

  /**
   * Image upload handler
   * Processes profile image uploads with validation
   * @param {Event} e - File input change event
   */
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) {
        console.log("No file selected for profile image upload.");
        return;
      }

      setIsUploading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error(
          "Session unavailable for image upload! Error:",
          sessionError || "No session"
        );
        setIsUploading(false);
        return;
      }
      const user = sessionData.session.user;

      if (userImg) {
        const parts = userImg.split("/storage/v1/object/public/userimg/");
        if (parts.length > 1) {
          const oldFilePath = parts[1].split("?")[0];
          await supabase.storage.from("userimg").remove([oldFilePath]);
        }
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `user-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("userimg")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Failed to upload profile image! Error:", uploadError);
        setIsUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("userimg")
        .getPublicUrl(filePath);

      await handleUpdateImageUrl(urlData.publicUrl);
      setUserImg(urlData.publicUrl);
      setIsUploading(false);
    },
    [userImg]
  );

  // Function to update profile image URL in the database
  const handleUpdateImageUrl = useCallback(
    async (imageUrl) => {
      if (!profileId) {
        console.error("Cannot update image URL: Profile ID is missing!");
        return;
      }

      const { error } = await supabase
        .from("profile")
        .update({ user_img: imageUrl })
        .eq("id", profileId);

      if (error) {
        console.error("Failed to update profile image URL! Error:", error);
      }
    },
    [profileId]
  );

  // Function to handle CV file upload
  const handleCvFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No CV file selected for upload."); // Log if no file is chosen
      return;
    }

    if (!profileId) {
      setInfoMessage("Please save the profile first before uploading a CV."); // Notify user
      setTimeout(() => setInfoMessage(""), 3000); // Clear message after 3 seconds
      console.error("Cannot upload CV: Profile ID is missing!"); // Log error
      return;
    }

    setIsCvUploading(true); // Show CV uploading state

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        "Session unavailable for CV upload! Error:",
        sessionError || "No session"
      ); // Log session error
      setIsCvUploading(false); // Reset uploading state
      return;
    }
    const user = sessionData.session.user; // Get current user

    // Delete old CV if it exists
    if (cvUrl) {
      const parts = cvUrl.split("/storage/v1/object/public/cv/");
      if (parts.length > 1) {
        const oldFilePath = parts[1].split("?")[0];
        const { error: removeError } = await supabase.storage
          .from("cv")
          .remove([oldFilePath]);
        if (removeError) {
          console.error("Failed to delete old CV! Error:", removeError); // Log delete error
        } else {
          console.log("Old CV deleted successfully:", oldFilePath); // Log successful delete
        }
      }
    }

    const fileExt = file.name.split(".").pop(); // Extract file extension
    const filePath = `cv-${user.id}-${Date.now()}.${fileExt}`; // Create unique file path

    const { error: uploadError } = await supabase.storage
      .from("cv")
      .upload(filePath, file, { upsert: true }); // Upload new CV

    if (uploadError) {
      console.error("Failed to upload CV! Error:", uploadError); // Log upload error
      setIsCvUploading(false); // Reset uploading state
      return;
    }

    const { data: urlData } = supabase.storage
      .from("cv")
      .getPublicUrl(filePath); // Get public URL for the uploaded CV

    await handleUpdateCvUrl(urlData.publicUrl); // Update CV URL in database
    setCvUrl(urlData.publicUrl); // Update state with new URL
    setIsCvUploading(false); // Hide uploading state
    setInfoMessage("CV updated"); // Show success message
    setTimeout(() => setInfoMessage(""), 3000); // Clear message after 3 seconds
    console.log("CV uploaded successfully:", urlData.publicUrl); // Log successful upload
  };

  // Function to update CV URL in the database
  const handleUpdateCvUrl = async (cvUrl) => {
    if (!profileId) {
      console.error("Cannot update CV URL: Profile ID is missing!"); // Log error if no profile ID
      return;
    }

    const { error } = await supabase
      .from("profile")
      .update({ cv_url: cvUrl })
      .eq("id", profileId);

    if (error) {
      console.error("Failed to update CV URL! Error:", error); // Log update error
    } else {
      console.log("CV URL updated successfully:", cvUrl); // Log successful update
    }
  };

  // Function to add a new technology with a logo
  const handleAddTech = useCallback(async () => {
    if (!newTech.trim() || !newTechLogo || !profileId) {
      console.log("Cannot add technology: Missing name, logo, or profile ID.");
      return;
    }

    setIsTechLogoUploading(true);

    const fileExt = newTechLogo.name.split(".").pop();
    const filePath = `tech-${profileId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tech-logos")
      .upload(filePath, newTechLogo, { upsert: true });

    if (uploadError) {
      console.error("Failed to upload tech logo! Error:", uploadError);
      setIsTechLogoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("tech-logos")
      .getPublicUrl(filePath);

    const techLogoUrl = urlData.publicUrl;

    const newTechData = {
      profile_id: profileId,
      tech_name: newTech.trim(),
      tech_logo_url: techLogoUrl,
    };

    const { data, error } = await supabase
      .from("tech_items")
      .insert(newTechData)
      .select();

    if (error) {
      console.error("Failed to add technology! Error:", error);
    } else {
      setTechItems((prev) => [...prev, data[0]]);
      setNewTech("");
      setNewTechLogo(null);
    }

    setIsTechLogoUploading(false);
  }, [newTech, newTechLogo, profileId]);

  // Function to delete a technology and its logo
  const handleDeleteTech = useCallback(
    async (techId) => {
      const techToDelete = techItems.find((tech) => tech.id === techId);
      if (techToDelete?.tech_logo_url) {
        const urlParts = techToDelete.tech_logo_url.split(
          "/storage/v1/object/public/tech-logos/"
        );
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          await supabase.storage.from("tech-logos").remove([filePath]);
        }
      }

      const { error } = await supabase
        .from("tech_items")
        .delete()
        .eq("id", techId);

      if (error) {
        console.error("Failed to delete technology! Error:", error);
      } else {
        setTechItems((prev) => prev.filter((tech) => tech.id !== techId));
      }
    },
    [techItems]
  );

  // Function to add a technology when Enter key is pressed
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddTech(); // Trigger tech addition
    }
  };

  // تحسين معالج تغيير حقول الاتصال
  const handleContactChange = useCallback((field, value) => {
    switch (field) {
      case "email":
        setEmail(value);
        break;
      case "github":
        setGithub(value);
        break;
      case "linkedin":
        setLinkedin(value);
        break;
      case "facebook":
        setFacebook(value);
        break;
      default:
        break;
    }
  }, []);

  // Effect to toggle loading class on the dashboard page
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

  // Render a loading spinner while data is being fetched
  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  // Render the profile page UI
  return (
    <div className="profile-page">
      {/* Display temporary info messages */}
      {infoMessage && <div className="toast">{infoMessage}</div>}
      <div className="dash-header">
        <h1 className="title">Profile</h1>
        <button className="prof-btn" onClick={handleUpdate}>
          Update
        </button>
      </div>
      <div className="prof-f">
        <div>
          {/* Input for user's name */}
          <div className="input-field">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="name"
            />
          </div>
          {/* Textarea for about section */}
          <div className="input-field">
            <label htmlFor="about">About us</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              id="about"
            ></textarea>
          </div>

          <ContactFields
            email={email}
            github={github}
            linkedin={linkedin}
            facebook={facebook}
            onChange={handleContactChange}
          />
        </div>
        <div className="img-tech">
          <ProfileImage
            userImg={userImg}
            isUploading={isUploading}
            onImageClick={() => fileInputRef.current.click()}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />

          <div className="input-field tech-input">
            <label htmlFor="tech">Profile Technologies</label>
            <div className="tech-add">
              <input
                type="text"
                id="tech"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a technology"
              />
              <div
                className="tech-logo"
                onClick={() => fileTechLogoRef.current.click()}
              >
                {isTechLogoUploading ? (
                  <div className="spin-loading-tech-logo"></div>
                ) : newTechLogo ? (
                  <img src={URL.createObjectURL(newTechLogo)} alt="Tech Logo" loading="lazy"/>
                ) : (
                  <span>Logo</span>
                )}
              </div>
              <input
                type="file"
                ref={fileTechLogoRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => {
                  setNewTechLogo(e.target.files[0]);
                  setIsTechLogoUploading(false);
                }}
              />
              <button
                className="add-tech-btn"
                onClick={handleAddTech}
                disabled={!newTech.trim() || !newTechLogo}
              >
                Add
              </button>
            </div>
            <div className="tech-items">
              {sortedTechItems.length > 0 ? (
                sortedTechItems.map((tech) => (
                  <TechItem
                    key={tech.id}
                    tech={tech}
                    onDelete={handleDeleteTech}
                  />
                ))
              ) : (
                <p>No technologies added yet.</p>
              )}
            </div>
          </div>

          <CvUpload
            cvUrl={cvUrl}
            isCvUploading={isCvUploading}
            onButtonClick={() => cvFileInputRef.current.click()}
            cvFileInputRef={cvFileInputRef}
            onFileChange={handleCvFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;

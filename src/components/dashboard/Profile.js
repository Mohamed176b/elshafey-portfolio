import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

/**
 * Profile Component
 * Manages user profile information and settings in the dashboard
 * Features:
 * - Personal information management
 * - Profile image handling
 * - Social media links
 * - Contact information
 */
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
          setName(profile.name || ""); // Set name, default to empty string if null
          setAbout(profile.about || ""); // Set about section
          setEmail(profile.email || ""); // Set email
          setGithub(profile.github || ""); // Set GitHub URL
          setLinkedin(profile.linkedin || ""); // Set LinkedIn URL
          setFacebook(profile.facebook || ""); // Set Facebook URL
          setUserImg(profile.user_img || ""); // Set profile image URL
          setCvUrl(profile.cv_url || ""); // Set CV URL
          await fetchTechItems(profile.id); // Fetch associated technologies
        } else {
          console.log(
            "No profile found for user. Initializing with empty values."
          ); // Log if no profile exists
          setUserImg(""); // Clear image URL
          setCvUrl(""); // Clear CV URL
        }
      }
    };

    // Function to fetch technology items linked to the profile
    const fetchTechItems = async (profileId) => {
      const { data: techData, error: techError } = await supabase
        .from("tech_items")
        .select("*")
        .eq("profile_id", profileId);

      if (techError) {
        console.error("Failed to fetch technologies! Error:", techError); // Log tech fetch error
      } else {
        setTechItems(techData || []); // Set tech items, default to empty array if null
        console.log("Technologies fetched successfully:", techData); // Log successful fetch
      }
    };

    checkSession(); // Initiate session check and profile fetch
  }, [navigate]); // Dependency array includes navigate to re-run if it changes

  /**
   * Profile update handler
   * Validates and saves profile changes
   * @param {Event} e - Form submission event
   */
  const handleUpdate = async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        "Session unavailable for update! Error:",
        sessionError || "No session"
      ); // Log session error
      navigate("/admin"); // Redirect if session is invalid
      return;
    }
    const user = sessionData.session.user; // Get current user

    const updatedData = {
      user_id: user.id, // Link profile to user
      name,
      about,
      email,
      github,
      linkedin,
      facebook,
    };

    let result;
    if (profileId) {
      // Update existing profile
      result = await supabase
        .from("profile")
        .update(updatedData)
        .eq("id", profileId);
    } else {
      // Insert new profile if no profileId exists
      result = await supabase.from("profile").insert(updatedData);
      if (!result.error && result.data) {
        setProfileId(result.data[0].id); // Set new profile ID after insertion
        console.log("New profile created with ID:", result.data[0].id); // Log successful creation
      }
    }

    const { data, error } = result;
    if (error) {
      console.error("Failed to update profile! Error:", error); // Log update error
    } else {
      console.log("Profile updated successfully:", data); // Log successful update
      setInfoMessage("Information updated"); // Show success message
      setTimeout(() => setInfoMessage(""), 3000); // Clear message after 3 seconds
    }
  };

  /**
   * Image upload handler
   * Processes profile image uploads with validation
   * @param {Event} e - File input change event
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected for profile image upload."); // Log if no file is chosen
      return;
    }

    setIsUploading(true); // Show uploading state

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        "Session unavailable for image upload! Error:",
        sessionError || "No session"
      ); // Log session error
      setIsUploading(false); // Reset uploading state
      return;
    }
    const user = sessionData.session.user; // Get current user

    // Delete old image if it exists
    if (userImg) {
      const parts = userImg.split("/storage/v1/object/public/userimg/");
      if (parts.length > 1) {
        const oldFilePath = parts[1].split("?")[0];
        const { error: removeError } = await supabase.storage
          .from("userimg")
          .remove([oldFilePath]);
        if (removeError) {
          console.error(
            "Failed to delete old profile image! Error:",
            removeError
          ); // Log delete error
        } else {
          console.log("Old profile image deleted successfully:", oldFilePath); // Log successful delete
        }
      }
    }

    const fileExt = file.name.split(".").pop(); // Extract file extension
    const filePath = `user-${user.id}-${Date.now()}.${fileExt}`; // Create unique file path

    const { error: uploadError } = await supabase.storage
      .from("userimg")
      .upload(filePath, file, { upsert: true }); // Upload new image

    if (uploadError) {
      console.error("Failed to upload profile image! Error:", uploadError); // Log upload error
      setIsUploading(false); // Reset uploading state
      return;
    }

    const { data: urlData } = supabase.storage
      .from("userimg")
      .getPublicUrl(filePath); // Get public URL for the uploaded image

    await handleUpdateImageUrl(urlData.publicUrl); // Update image URL in database
    setUserImg(urlData.publicUrl); // Update state with new URL
    setIsUploading(false); // Hide uploading state
    console.log("Profile image uploaded successfully:", urlData.publicUrl); // Log successful upload
  };

  // Function to update profile image URL in the database
  const handleUpdateImageUrl = async (imageUrl) => {
    if (!profileId) {
      console.error("Cannot update image URL: Profile ID is missing!"); // Log error if no profile ID
      return;
    }

    const { error } = await supabase
      .from("profile")
      .update({ user_img: imageUrl })
      .eq("id", profileId);

    if (error) {
      console.error("Failed to update profile image URL! Error:", error); // Log update error
    } else {
      console.log("Profile image URL updated successfully:", imageUrl); // Log successful update
    }
  };

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
  const handleAddTech = async () => {
    if (!newTech.trim() || !newTechLogo || !profileId) {
      console.log("Cannot add technology: Missing name, logo, or profile ID."); // Log if prerequisites are missing
      return;
    }

    setIsTechLogoUploading(true); // Show tech logo uploading state

    const fileExt = newTechLogo.name.split(".").pop(); // Extract file extension
    const filePath = `tech-${profileId}-${Date.now()}.${fileExt}`; // Create unique file path

    const { error: uploadError } = await supabase.storage
      .from("tech-logos")
      .upload(filePath, newTechLogo, { upsert: true }); // Upload tech logo

    if (uploadError) {
      console.error("Failed to upload tech logo! Error:", uploadError); // Log upload error
      setIsTechLogoUploading(false); // Reset uploading state
      return;
    }

    const { data: urlData } = supabase.storage
      .from("tech-logos")
      .getPublicUrl(filePath); // Get public URL for the uploaded logo

    const techLogoUrl = urlData.publicUrl; // Store logo URL

    const newTechData = {
      profile_id: profileId, // Link to profile
      tech_name: newTech.trim(), // Trimmed technology name
      tech_logo_url: techLogoUrl, // Logo URL
    };

    const { data, error } = await supabase
      .from("tech_items")
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
    if (techToDelete && techToDelete.tech_logo_url) {
      const urlParts = techToDelete.tech_logo_url.split(
        "/storage/v1/object/public/tech-logos/"
      );
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        const { error: removeError } = await supabase.storage
          .from("tech-logos")
          .remove([filePath]); // Delete tech logo from storage
        if (removeError) {
          console.error("Failed to delete tech logo! Error:", removeError); // Log delete error
        } else {
          console.log("Tech logo deleted successfully:", filePath); // Log successful delete
        }
      }
    }

    const { error } = await supabase
      .from("tech_items")
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
    }
  };

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
          {/* Contact information inputs */}
          <div className="contacts">
            <h3>Contacts</h3>
            <div>
              <div className="input-field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="email"
                />
              </div>
              <div className="input-field">
                <label htmlFor="github">GitHub</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  id="github"
                />
              </div>
              <div className="input-field">
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  id="linkedin"
                />
              </div>
              <div className="input-field">
                <label htmlFor="facebook">Facebook</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  id="facebook"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="img-tech">
          {/* Profile image display and upload */}
          <div className="user-img">
            {isUploading ? (
              <div className="spin-loading"></div> // Show spinner during upload
            ) : userImg ? (
              <img alt="UserImage" src={userImg} /> // Display image if URL exists
            ) : (
              <div>
                <i className="fa-solid fa-user alt-img" alt="User Image"></i>{" "}
                {/*Placeholder if no image*/}
              </div>
            )}
            <div
              title="Change Picture"
              className="chng-img"
              onClick={() => fileInputRef.current.click()} // Trigger file input click
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }} // Hidden input for image upload
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {/* Technology input and list */}
          <div className="input-field tech-input">
            <label htmlFor="tech">Profile Technologies</label>
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
                    {tech.tech_logo_url && (
                      <img
                        src={tech.tech_logo_url}
                        alt={tech.tech_name}
                        width="50"
                      /> // Display tech logo
                    )}
                    <h4>{tech.tech_name}</h4> {/* Display tech name */}
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
          {/* CV upload and display */}
          <div className="input-field">
            <label>CV</label>
            {cvUrl ? (
              <div className="cv-div">
                <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-file"></i>
                  <span>View CV</span> {/* Link to view CV*/}
                </a>
                <button
                  onClick={() => cvFileInputRef.current.click()} // Trigger CV file input
                  disabled={isCvUploading} // Disable during upload
                >
                  {isCvUploading ? "Uploading..." : "Change CV"}
                </button>
              </div>
            ) : (
              <div className="cv-div">
                <button
                  onClick={() => cvFileInputRef.current.click()} // Trigger CV file input
                  disabled={isCvUploading} // Disable during upload
                >
                  {isCvUploading ? "Uploading..." : "Upload CV"}
                </button>
              </div>
            )}
            <input
              type="file"
              ref={cvFileInputRef}
              style={{ display: "none" }} // Hidden input for CV upload
              accept="application/pdf"
              onChange={handleCvFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

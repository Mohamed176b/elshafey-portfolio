// Import the Supabase client for database interactions
import { supabase } from "../supabase/supabaseClient";

const GECODER_OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;

// Get location info using OpenCage Geocoder
const getLocationInfo = async () => {
  try {
    // Check if location tracking is enabled in config
    const { data: config } = await supabase
      .from("dashboard_config")
      .select("track_location")
      .single();

    if (!config || !config.track_location) {
      console.log("Location tracking is disabled in config");
      return { country: "Unknown", city: "Unknown" };
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log("Geolocation API is not supported in this environment");
      return {
        country: "Unknown",
        city: "Unknown",
      };
    }

    // Check if we're using HTTPS (required for geolocation in modern browsers)
    if (window.location.protocol !== "https:") {
      console.log("Geolocation requires HTTPS");
      return { country: "Unknown", city: "Unknown" };
    }

    // Get user's coordinates with timeout and better error handling
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("User denied geolocation permission"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location information unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out"));
              break;
            default:
              reject(error);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000, 
          maximumAge: 300000, 
        }
      );
    });

    const { latitude, longitude } = position.coords;

    // Call OpenCage Geocoder API
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${GECODER_OPENCAGE_API_KEY}&language=en`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0].components;
      return {
        country: result.country || "Unknown",
        city: result.city || result.town || result.village || "Unknown",
      };
    }

    return { country: "Unknown", city: "Unknown" };
  } catch (error) {
    console.error("Error getting location:", error);
    return { country: "Unknown", city: "Unknown" };
  }
};

// Clean session storage values that are older than 30 minutes
const cleanupSessionStorage = () => {
  try {
    const now = new Date().getTime();
    const cleanupKey = "last_cleanup_time";
    const lastCleanup = sessionStorage.getItem(cleanupKey);

    // Only cleanup every 30 minutes
    if (lastCleanup && now - parseInt(lastCleanup) < 1800000) {
      return;
    }

    // Clean up old visit flags
    Object.keys(sessionStorage).forEach((key) => {
      if (key.endsWith("_visit_tracked")) {
        const timestamp = sessionStorage.getItem(key + "_time");
        if (timestamp && now - parseInt(timestamp) > 1800000) {
          sessionStorage.removeItem(key);
          sessionStorage.removeItem(key + "_time");
        }
      }
    });

    sessionStorage.setItem(cleanupKey, now.toString());
  } catch (error) {
    console.error("Error in cleanupSessionStorage:", error);
  }
};

// Tracks a new visit to the homepage
export const trackHomePageVisit = async () => {
  try {
    cleanupSessionStorage();

    // Check if we already tracked a visit this session
    const hasVisited = sessionStorage.getItem("home_visit_tracked");
    if (hasVisited) {
      return; // Skip if already visited in this session
    }

    // Generate a unique visitor ID
    const visitorId = generateVisitorId();

    // Get location info
    const locationInfo = await getLocationInfo();

    // Insert the new visit record into the 'page_visits' table
    const { error } = await supabase.from("page_visits").insert({
      page_type: "home",
      visitor_id: visitorId,
      visit_date: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referer: document.referrer || "Direct Link",
      country: locationInfo.country,
      city: locationInfo.city,
    });

    if (!error) {
      // Mark that we've tracked a visit this session
      sessionStorage.setItem("home_visit_tracked", "true");
      sessionStorage.setItem(
        "home_visit_tracked_time",
        new Date().getTime().toString()
      );

      // Update the total visit count
      updateTotalVisits();
    }

    return visitorId;
  } catch (error) {
    console.error("Error in trackHomePageVisit:", error);
  }
};

// Tracks a visit to a project page
export const trackProjectPageVisit = async (projectId, projectName) => {
  try {
    cleanupSessionStorage();

    // Check if we already tracked this specific project visit in this session
    const projectVisitKey = `project_${projectId}_visit_tracked`;
    const hasVisited = sessionStorage.getItem(projectVisitKey);
    if (hasVisited) {
      return; // Skip if already visited this project in this session
    }

    // Generate a unique visitor ID
    const visitorId = generateVisitorId();

    // Get location info
    const locationInfo = await getLocationInfo();

    // Convert project ID to string to ensure database compatibility
    const projectIdString = String(projectId);

    // Insert the new visit record into the 'page_visits' table
    const { error } = await supabase.from("page_visits").insert({
      page_type: "project",
      project_id: projectIdString,
      project_name: projectName,
      visitor_id: visitorId,
      visit_date: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referer: document.referrer || "Direct Link",
      country: locationInfo.country,
      city: locationInfo.city,
    });

    if (!error) {
      // Mark that we've tracked this project visit in this session
      sessionStorage.setItem(projectVisitKey, "true");
      sessionStorage.setItem(
        projectVisitKey + "_time",
        new Date().getTime().toString()
      );

      // Update the total visit count
      updateTotalVisits();
    }

    return visitorId;
  } catch (error) {
    console.error("Error in trackProjectPageVisit:", error);
  }
};

// Updates the total visit count in the 'visit_stats' table
const updateTotalVisits = async () => {
  try {
    // Get existing stats with explicit column selection
    const { data: existingStats, error: fetchError } = await supabase
      .from("visit_stats")
      .select("id, total_visits")
      .eq("id", 1)
      .maybeSingle();
    if (fetchError) {
      console.error("Error fetching existing visit stats:", fetchError);
      return;
    }
    const currentTimestamp = new Date().toISOString();

    if (!existingStats) {
      // If no record exists, try to create initial record
      const initialData = {
        id: 1,
        total_visits: 1,
        last_updated: currentTimestamp,
      };

      const { error: insertError } = await supabase
        .from("visit_stats")
        .upsert(initialData)
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating initial visit stats:", insertError);
      }
    } else {
      // Update existing record with explicit type checking
      const newVisitCount =
        typeof existingStats.total_visits === "number"
          ? existingStats.total_visits + 1
          : 1;

      const { error: updateError } = await supabase
        .from("visit_stats")
        .update({
          total_visits: newVisitCount,
          last_updated: currentTimestamp,
        })
        .eq("id", 1)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating visit stats:", updateError);
      }
    }
  } catch (error) {
    console.error("Error in updateTotalVisits:", error);
  }
};

// Generates a unique visitor ID, using session storage for tracking
const generateVisitorId = () => {
  // Check for an existing visitor ID in session storage
  const existingId = sessionStorage.getItem("visitor_id");
  if (existingId) {
    return existingId; // Return existing ID if found
  }

  // Generate a new unique ID combining timestamp and random string
  const newId =
    "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  // Store the new ID in session storage
  sessionStorage.setItem("visitor_id", newId);
  return newId; // Return the new ID
};

// Fetches visit statistics for display in the dashboard
export const fetchVisitStats = async () => {
  try {
    // Fetch total visits from the 'visit_stats' table
    const { data: totalStats, error: totalStatsError } = await supabase
      .from("visit_stats")
      .select("*")
      .eq("id", 1)
      .single();

    if (totalStatsError) {
      console.error("Error fetching total visits:", totalStatsError);
      return null;
    }

    // Calculate date ranges for filtering visits
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);

    const todayStr = today.toISOString().split("T")[0];
    const weekAgoStr = weekAgo.toISOString();
    const monthAgoStr = monthAgo.toISOString();

    // Fetch all visit data in parallel
    const [
      todayVisits,
      weekVisits,
      monthVisits,
      projectVisits,
      visitsData,
      locationData,
    ] = await Promise.all([
      // Today's visits
      supabase
        .from("page_visits")
        .select("*")
        .eq("page_type", "home")
        .gte("visit_date", todayStr),

      // Week's visits
      supabase
        .from("page_visits")
        .select("*")
        .eq("page_type", "home")
        .gte("visit_date", weekAgoStr),

      // Month's visits
      supabase
        .from("page_visits")
        .select("*")
        .eq("page_type", "home")
        .gte("visit_date", monthAgoStr),

      // Project visits
      supabase
        .from("page_visits")
        .select("project_id, project_name")
        .eq("page_type", "project"),

      // User agent and referrer data
      supabase.from("page_visits").select("user_agent, referer"),

      // Location data
      supabase.from("page_visits").select("country, city"),
    ]);

    // Process project visits
    const projectStats = {};
    if (projectVisits.data) {
      projectVisits.data.forEach((visit) => {
        const key = `${visit.project_id}:${visit.project_name}`;
        projectStats[key] = projectStats[key] || {
          project_id: visit.project_id,
          project_name: visit.project_name,
          count: 0,
        };
        projectStats[key].count++;
      });
    }

    // Process user agent statistics
    const userAgentStats = {};
    const browserStats = {};
    const referrerStats = {};

    if (visitsData.data && visitsData.data.length > 0) {
      visitsData.data.forEach((visit) => {
        const userAgent = visit.user_agent;

        // Process device type
        let deviceType = "Unknown";
        if (
          userAgent.includes("Mobile") ||
          userAgent.includes("Android") ||
          userAgent.includes("iPhone") ||
          userAgent.includes("iPad") ||
          userAgent.includes("Windows Phone")
        ) {
          deviceType = "Mobile";
        } else if (
          userAgent.includes("Windows") ||
          userAgent.includes("Macintosh") ||
          userAgent.includes("Linux") ||
          userAgent.includes("X11")
        ) {
          deviceType = "Desktop";
        } else if (
          userAgent.includes("Tablet") ||
          (userAgent.includes("Android") && !userAgent.includes("Mobile"))
        ) {
          deviceType = "Tablet";
        }

        // Process browser type
        let browserType = "Other";
        // Check Edge first because it also includes Chrome and Safari in its UA string
        if (userAgent.includes("Edg/")) {
          browserType = "Edge";
        } else if (
          userAgent.includes("Chrome/") &&
          !userAgent.includes("Edge/")
        ) {
          browserType = "Chrome";
        } else if (userAgent.includes("Firefox/")) {
          browserType = "Firefox";
        } else if (
          userAgent.includes("Safari/") &&
          !userAgent.includes("Chrome/")
        ) {
          browserType = "Safari";
        } else if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
          browserType = "Opera";
        }

        // Update device stats
        userAgentStats[deviceType] = (userAgentStats[deviceType] || 0) + 1;

        // Update browser stats
        browserStats[browserType] = (browserStats[browserType] || 0) + 1;

        // Process referrer
        const referrer = visit.referer || "Direct Link";
        const referrerDomain =
          referrer === "Direct Link"
            ? "Direct Link"
            : new URL(referrer).hostname || "Unknown";
        referrerStats[referrerDomain] =
          (referrerStats[referrerDomain] || 0) + 1;
      });
    }

    // Process location statistics
    const countryStats = {};
    const cityStats = {};

    if (locationData.data) {
      locationData.data.forEach((visit) => {
        const country = visit.country || "Unknown";
        const city = visit.city || "Unknown";

        countryStats[country] = (countryStats[country] || 0) + 1;
        cityStats[city] = (cityStats[city] || 0) + 1;
      });
    }

    // Convert stats to array format and sort
    const formatStats = (stats) =>
      Object.entries(stats)
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits);

    return {
      totalVisits: totalStats?.total_visits || 0,
      todayHomeVisits: todayVisits.data?.length || 0,
      weekHomeVisits: weekVisits.data?.length || 0,
      monthHomeVisits: monthVisits.data?.length || 0,
      projectVisits: Object.values(projectStats),
      userAgentData: formatStats(userAgentStats),
      browserData: formatStats(browserStats),
      referrerData: formatStats(referrerStats),
      countryData: formatStats(countryStats),
      cityData: formatStats(cityStats).slice(0, 10),
      lastUpdated: totalStats?.last_updated,
    };
  } catch (error) {
    console.error("Error in fetchVisitStats:", error);
    return null;
  }
};

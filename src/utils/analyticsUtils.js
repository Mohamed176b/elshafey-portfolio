// Import the Supabase client for database interactions
import { supabase } from "../supabase/supabaseClient";

const GECODER_OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;

// Get location info using OpenCage Geocoder
const getLocationInfo = async () => {
  try {
    // First get user's coordinates
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
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
    // Check for existing visit statistics
    const { data, error } = await supabase
      .from("visit_stats")
      .select("*")
      .eq("id", 1) // Fetch record with ID 1
      .single(); // Expect a single record

    // Handle errors, ignoring 'not found' (PGRST116) case
    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      // console.error('Error fetching visit stats:', error);
      return;
    }

    if (!data) {
      // If no stats exist, create a new record with initial count
      await supabase.from("visit_stats").insert({
        id: 1, // Fixed ID for the stats record
        total_visits: 1, // Initialize with 1 visit
        last_updated: new Date().toISOString(), // Current timestamp
      });
    } else {
      // Update existing stats by incrementing the visit count
      await supabase
        .from("visit_stats")
        .update({
          total_visits: data.total_visits + 1, // Increment total visits
          last_updated: new Date().toISOString(), // Update timestamp
        })
        .eq("id", 1); // Match record with ID 1
    }
  } catch (error) {
    // Log any unexpected errors in the function
    // console.error('Error in updateTotalVisits:', error);
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
      .eq("id", 1) // Fetch record with ID 1
      .single(); // Expect a single record

    // Log any error fetching total visits
    if (totalStatsError) {
      console.error("Error fetching total visits:", totalStatsError);
      return null;
    }

    // Calculate date ranges for filtering visits (today, last week, last month)
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7); // 7 days ago

    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30); // 30 days ago

    const todayStr = today.toISOString().split("T")[0]; // Today's date (YYYY-MM-DD)
    const weekAgoStr = weekAgo.toISOString(); // ISO string for 7 days ago
    const monthAgoStr = monthAgo.toISOString(); // ISO string for 30 days ago

    // Fetch homepage visits for today
    const { data: todayVisits, error: todayError } = await supabase
      .from("page_visits")
      .select("*")
      .eq("page_type", "home") // Filter for homepage visits
      .gte("visit_date", todayStr); // Visits on or after today

    // Log any error fetching today's visits
    if (todayError) {
      console.error("Error fetching today visits:", todayError);
    }

    // Fetch homepage visits for the last week
    const { data: weekVisits, error: weekError } = await supabase
      .from("page_visits")
      .select("*")
      .eq("page_type", "home") // Filter for homepage visits
      .gte("visit_date", weekAgoStr); // Visits on or after 7 days ago

    // Log any error fetching week's visits
    if (weekError) {
      console.error("Error fetching week visits:", weekError);
    }

    // Fetch homepage visits for the last month
    const { data: monthVisits, error: monthError } = await supabase
      .from("page_visits")
      .select("*")
      .eq("page_type", "home") // Filter for homepage visits
      .gte("visit_date", monthAgoStr); // Visits on or after 30 days ago

    // Log any error fetching month's visits
    if (monthError) {
      console.error("Error fetching month visits:", monthError);
    }

    // Fetch project visit statistics
    const { data: rawProjectVisits, error: projectError } = await supabase
      .from("page_visits")
      .select("project_id, project_name") // Select only relevant fields
      .eq("page_type", "project"); // Filter for project visits

    // Log any error fetching project visits
    if (projectError) {
      console.error("Error fetching project visits:", projectError);
    }

    // Manually process project visits to group and count by project
    const projectVisits = [];
    const projectCounts = {};

    if (rawProjectVisits && rawProjectVisits.length > 0) {
      // Group and count visits by project_id and project_name
      rawProjectVisits.forEach((visit) => {
        const key = `${visit.project_id}:${visit.project_name}`; // Unique key for grouping
        if (!projectCounts[key]) {
          projectCounts[key] = {
            project_id: visit.project_id,
            project_name: visit.project_name,
            count: 0, // Initialize count
          };
        }
        projectCounts[key].count++; // Increment count for this project
      });

      // Convert grouped counts to an array
      Object.values(projectCounts).forEach((item) => {
        projectVisits.push(item);
      });
    }

    // Fetch user agent statistics
    const { data: visitsData, error: visitsError } = await supabase
      .from("page_visits")
      .select("user_agent, referer");

    if (visitsError) {
      console.error("Error fetching visits data:", visitsError);
    }

    // Process user agent statistics
    const userAgentStats = {};
    const browserStats = {};
    const referrerStats = {};

    if (visitsData && visitsData.length > 0) {
      visitsData.forEach((visit) => {
        const userAgent = visit.user_agent;

        // Process device type
        let deviceType = "Unknown";
        if (userAgent.includes("Mobile")) {
          deviceType = "Mobile";
        } else if (userAgent.includes("Tablet")) {
          deviceType = "Tablet";
        } else if (
          userAgent.includes("Windows") ||
          userAgent.includes("Macintosh") ||
          userAgent.includes("Linux")
        ) {
          deviceType = "Desktop";
        }

        // Process browser type
        let browserType = "Other";
        if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
          browserType = "Chrome";
        } else if (userAgent.includes("Firefox")) {
          browserType = "Firefox";
        } else if (
          userAgent.includes("Safari") &&
          !userAgent.includes("Chrome")
        ) {
          browserType = "Safari";
        } else if (userAgent.includes("Edg")) {
          browserType = "Edge";
        } else if (userAgent.includes("Opera")) {
          browserType = "Opera";
        }

        // Update device stats
        if (!userAgentStats[deviceType]) {
          userAgentStats[deviceType] = 0;
        }
        userAgentStats[deviceType]++;

        // Update browser stats
        if (!browserStats[browserType]) {
          browserStats[browserType] = 0;
        }
        browserStats[browserType]++;

        // Process referrer
        const referrer = visit.referer || "Direct Link";
        const referrerDomain =
          referrer === "Direct Link"
            ? "Direct Link"
            : new URL(referrer).hostname || "Unknown";

        if (!referrerStats[referrerDomain]) {
          referrerStats[referrerDomain] = 0;
        }
        referrerStats[referrerDomain]++;
      });
    }

    // Convert stats to array format for charts
    const userAgentData = Object.entries(userAgentStats).map(
      ([name, value]) => ({
        name,
        visits: value,
      })
    );

    const browserData = Object.entries(browserStats).map(([name, value]) => ({
      name,
      visits: value,
    }));

    const referrerData = Object.entries(referrerStats).map(([name, value]) => ({
      name,
      visits: value,
    }));

    // Sort data by visit count
    userAgentData.sort((a, b) => b.visits - a.visits);
    browserData.sort((a, b) => b.visits - a.visits);
    referrerData.sort((a, b) => b.visits - a.visits);

    // Fetch location statistics
    const { data: locationData, error: locationError } = await supabase
      .from("page_visits")
      .select("country, city");

    if (locationError) {
      console.error("Error fetching location data:", locationError);
    }

    // Process location statistics
    const countryStats = {};
    const cityStats = {};

    if (locationData && locationData.length > 0) {
      locationData.forEach((visit) => {
        // Process country stats
        const country = visit.country || "Unknown";
        if (!countryStats[country]) {
          countryStats[country] = 0;
        }
        countryStats[country]++;

        // Process city stats
        const city = visit.city || "Unknown";
        if (!cityStats[city]) {
          cityStats[city] = 0;
        }
        cityStats[city]++;
      });
    }

    // Convert location stats to array format for charts
    const countryData = Object.entries(countryStats)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits);

    const cityData = Object.entries(cityStats)
      .map(([name, visits]) => ({ name, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10); // Show top 10 cities only

    // Return stats including the location data
    return {
      totalVisits: totalStats?.total_visits || 0,
      todayHomeVisits: todayVisits?.length || 0,
      weekHomeVisits: weekVisits?.length || 0,
      monthHomeVisits: monthVisits?.length || 0,
      projectVisits: projectVisits || [],
      userAgentData,
      browserData,
      referrerData,
      countryData,
      cityData,
      lastUpdated: totalStats?.last_updated,
    };
  } catch (error) {
    // Log any unexpected errors in the function
    console.error("Error in fetchVisitStats:", error);
    return null; // Return null on error
  }
};

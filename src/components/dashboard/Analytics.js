import React, { useState, useEffect, Suspense, useCallback } from "react";
import { fetchVisitStats } from "../../utils/analyticsUtils";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import "../../styles/Analytics.css";

// Lazy load components
const StatisticsCards = React.lazy(() => import("./charts/StatisticsCards"));
const DailyVisitsChart = React.lazy(() => import("./charts/DailyVisitsChart"));
const ProjectVisitsCharts = React.lazy(() =>
  import("./charts/ProjectVisitsCharts")
);
const BrowserStats = React.lazy(() => import("./charts/BrowserStats"));
const DeviceStats = React.lazy(() => import("./charts/DeviceStats"));
const TrafficSources = React.lazy(() => import("./charts/TrafficSources"));
const LocationStats = React.lazy(() => import("./charts/LocationStats"));

const ChartLoader = () => (
  <div className="chart-loader">
    <div className="loading-spinner"></div>
  </div>
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const navigate = useNavigate();

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    try {
      const stats = await fetchVisitStats();
      console.log("Analytics Data:", stats); // Debug log
      if (stats) {
        setAnalyticsData(stats);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setIsLoading(false);
    }
  }, []);

  // Session check and data loading
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/admin");
        return;
      }
      fetchData();
    };
    checkSession();
  }, [navigate, fetchData]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
  }, []);

  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  // Early return if no data
  if (!analyticsData) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1 className="title">Visit Statistics</h1>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Process daily visits data for the selected time range
  const getDailyVisitsData = () => {
    const today = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setDate(today.getDate() - 30);
        break;
      case "quarter":
        startDate.setDate(today.getDate() - 90);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }

    // Create a map of dates with visit counts
    const visitMap = new Map();
    const currentDate = new Date(startDate);

    // Initialize all dates with zero visits
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      visitMap.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate visits from page_visits data
    analyticsData.todayHomeVisits &&
      visitMap.set(
        today.toISOString().split("T")[0],
        analyticsData.todayHomeVisits
      );

    // Return formatted data for chart
    return Array.from(visitMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      visits: count,
    }));
  };

  const dailyData = getDailyVisitsData();

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="title">Visit Statistics</h1>
        <p className="last-update">
          Last updated:{" "}
          {analyticsData.lastUpdated
            ? new Date(analyticsData.lastUpdated).toLocaleString()
            : "Not available"}
        </p>
      </div>

      <Suspense fallback={<ChartLoader />}>
        <StatisticsCards analyticsData={analyticsData} />
      </Suspense>

      <div className="analytics-charts">
        <Suspense fallback={<ChartLoader />}>
          <DailyVisitsChart
            dailyData={dailyData}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </Suspense>

        {analyticsData.projectVisits &&
          analyticsData.projectVisits.length > 0 && (
            <Suspense fallback={<ChartLoader />}>
                <ProjectVisitsCharts
                  projectData={analyticsData.projectVisits}
                />
              </Suspense>
          )}

        <div className="charts-row">
          <Suspense fallback={<ChartLoader />}>
            <BrowserStats browserData={analyticsData.browserData || []} />
          </Suspense>

          <Suspense fallback={<ChartLoader />}>
            <DeviceStats userAgentData={analyticsData.userAgentData || []} />
          </Suspense>
        </div>

        {analyticsData.referrerData &&
          analyticsData.referrerData.length > 0 && (
            <Suspense fallback={<ChartLoader />}>
              <TrafficSources referrerData={analyticsData.referrerData} />
            </Suspense>
          )}

        {(analyticsData.countryData || analyticsData.cityData) && (
          <Suspense fallback={<ChartLoader />}>
            <LocationStats
              countryData={analyticsData.countryData || []}
              cityData={analyticsData.cityData || []}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Analytics;

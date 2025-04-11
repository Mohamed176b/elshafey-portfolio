import React, { memo } from "react";

const StatisticsCards = memo(({ analyticsData }) => {
  const stats = {
    totalVisits: analyticsData?.totalVisits || 0,
    todayVisits: analyticsData?.todayHomeVisits || 0,
    weekVisits: analyticsData?.weekHomeVisits || 0,
    monthVisits: analyticsData?.monthHomeVisits || 0,
  };

  return (
    <div className="statistics-cards">
      <div className="stat-card">
        <h3>Total Visits</h3>
        <p>{stats.totalVisits.toLocaleString()}</p>
      </div>
      <div className="stat-card">
        <h3>Today's Visits</h3>
        <p>{stats.todayVisits.toLocaleString()}</p>
      </div>
      <div className="stat-card">
        <h3>Week Visits</h3>
        <p>{stats.weekVisits.toLocaleString()}</p>
      </div>
      <div className="stat-card">
        <h3>Month Visits</h3>
        <p>{stats.monthVisits.toLocaleString()}</p>
      </div>
    </div>
  );
});

export default StatisticsCards;

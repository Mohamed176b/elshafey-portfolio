import React, { memo, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LocationStats = memo(({ countryData, cityData }) => {
  const [viewType, setViewType] = useState("country");

  const chartData = useMemo(() => {
    const data = viewType === "country" ? countryData : cityData;
    return (
      data?.map((item) => ({
        location: item.name,
        visits: item.visits,
      })) || []
    );
  }, [viewType, countryData, cityData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = chartData.reduce((sum, item) => sum + item.visits, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "rgba(33, 47, 69, 0.95)",
            padding: "8px",
            border: "none",
            borderRadius: "4px",
            color: "var(--forground-color)",
          }}
        >
          <p style={{ margin: "0 0 4px 0" }}>{label}</p>
          <p style={{ margin: "0" }}>
            Visits: {payload[0].value} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container location-stats">
      <div className="chart-header">
        <h3>Visitor Locations</h3>
        <div className="view-type-buttons">
          <button
            className={viewType === "country" ? "active" : ""}
            onClick={() => setViewType("country")}
          >
            Countries
          </button>
          <button
            className={viewType === "city" ? "active" : ""}
            onClick={() => setViewType("city")}
          >
            Cities
          </button>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="location"
              type="category"
              tick={{ fill: "var(--forground-color)" }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="visits" fill="#8884d8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default LocationStats;

import React, { memo, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TrafficSources = memo(({ referrerData }) => {
  const chartData = useMemo(
    () =>
      referrerData.map((item) => ({
        source: item.name,
        visits: item.visits,
      })),
    [referrerData]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = referrerData.reduce((sum, item) => sum + item.visits, 0);
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
    <div className="chart-container traffic-sources">
      <h3>Traffic Sources</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="source"
              type="category"
              tick={{ fill: "var(--forground-color)" }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="visits" fill="#8884d8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default TrafficSources;

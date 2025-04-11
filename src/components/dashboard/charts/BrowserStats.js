import React, { memo, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const BrowserStats = memo(({ browserData }) => {
  const total = useMemo(
    () => browserData.reduce((sum, item) => sum + item.visits, 0),
    [browserData]
  );

  const chartData = useMemo(
    () =>
      browserData.map((item) => ({
        name: item.name,
        visits: item.visits,
        percentage: ((item.visits / total) * 100).toFixed(1),
      })),
    [browserData, total]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <p style={{ margin: "0 0 4px 0" }}>{data.name}</p>
          <p style={{ margin: "0" }}>
            Visits: {data.visits} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container browser-stats">
      <h3>Browser Distribution</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="visits"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: "var(--forground-color)" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default BrowserStats;

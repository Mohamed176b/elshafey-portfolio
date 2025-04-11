import React, { memo, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0088FE", 
  "#00C49F", 
  "#FFBB28", 
  "#FF8042", 
  "#8884D8", 
  "#82ca9d", 
  "#ffc658",
  "#d53e4f", 
  "#756bb1", 
  "#4daf4a", 
  "#e6550d", 
  "#3182bd", 
  "#31a354", 
  "#756bb1", 
  "#636363", 
];

const ProjectVisitsCharts = memo(({ projectData }) => {
  const chartData = useMemo(() => {
    const total = projectData.reduce((sum, item) => sum + item.count, 0);
    return projectData.map((item) => ({
      name: item.project_name || `Project ${item.project_id}`,
      visits: item.count,
      percentage: ((item.count / total) * 100).toFixed(1),
    }));
  }, [projectData]);

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
    <div className="chart-container project-visits">
      <h3>Project Visits Distribution</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="visits"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              labelLine={true}
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

export default ProjectVisitsCharts;

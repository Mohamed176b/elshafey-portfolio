import React, { memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042"];

const DeviceStats = memo(({ userAgentData }) => {
  const totalVisits = userAgentData.reduce((sum, item) => sum + item.visits, 0);

  const formatTooltip = (value, name) => {
    const percentage = ((value / totalVisits) * 100).toFixed(1);
    return [`${value} (${percentage}%)`, name];
  };

  return (
    <div className="chart-container device-stats">
      <h3>Device Types</h3>
      <div className="chart-body" style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={userAgentData}
              dataKey="visits"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, visits }) =>
                `${name} (${((visits / totalVisits) * 100).toFixed(1)}%)`
              }
            >
              {userAgentData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default DeviceStats;

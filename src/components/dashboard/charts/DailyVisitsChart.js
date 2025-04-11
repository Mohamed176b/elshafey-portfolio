import React, { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DailyVisitsChart = memo(({ dailyData, timeRange, onTimeRangeChange }) => {
  const chartData = useMemo(() => {
    return dailyData.map((item) => ({
      date: item.date,
      visits: parseInt(item.visits),
    }));
  }, [dailyData]);

  return (
    <div className="chart-container daily-visits">
      <div className="chart-header">
        <h3>Daily Visits</h3>
        <div className="time-range-buttons">
          <button
            className={timeRange === "week" ? "active" : ""}
            onClick={() => onTimeRangeChange("week")}
          >
            Week
          </button>
          <button
            className={timeRange === "month" ? "active" : ""}
            onClick={() => onTimeRangeChange("month")}
          >
            Month
          </button>
          <button
            className={timeRange === "quarter" ? "active" : ""}
            onClick={() => onTimeRangeChange("quarter")}
          >
            Quarter
          </button>
        </div>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tick={{ fill: "var(--forground-color)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              tick={{ fill: "var(--forground-color)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(33, 47, 69, 0.9)",
                border: "none",
                borderRadius: "8px",
                color: "var(--forground-color)",
              }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default DailyVisitsChart;

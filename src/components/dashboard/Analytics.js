import React, { useState, useEffect } from 'react';
import { fetchVisitStats } from '../../utils/analyticsUtils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import '../../styles/Analytics.css';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [dailyData, setDailyData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user session exists
    const checkSession = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        navigate('/admin');
        return;
      }
      
      loadAnalyticsData();
    };
    
    checkSession();
  }, [navigate]);
  
  // Load analytics data
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const stats = await fetchVisitStats();
      setAnalyticsData(stats);
      
      // Fetch daily visit data for charts
      await fetchDailyVisitsData();
      
      // Fetch project visit data for charts
      await fetchProjectVisitsData();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setIsLoading(false);
    }
  };
  
  // Fetch daily visit data
  const fetchDailyVisitsData = async () => {
    try {
      // Determine time range
      const today = new Date();
      const startDate = new Date();
      
      if (timeRange === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setDate(today.getDate() - 30);
      } else {
        startDate.setDate(today.getDate() - 90);
      }
      
      const { data, error } = await supabase
        .from('page_visits')
        .select('visit_date')
        .gte('visit_date', startDate.toISOString())
        .order('visit_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching daily visits:', error);
        return;
      }
      
      // Organize data by day
      const dailyCounts = {};
      
      data.forEach(visit => {
        const date = new Date(visit.visit_date);
        const dateString = date.toISOString().split('T')[0];
        
        if (!dailyCounts[dateString]) {
          dailyCounts[dateString] = 0;
        }
        dailyCounts[dateString]++;
      });
      
      // Convert data to chart format
      const chartData = Object.keys(dailyCounts).map(date => ({
        date: formatDate(date),
        visits: dailyCounts[date]
      }));
      
      setDailyData(chartData);
    } catch (error) {
      console.error('Error in fetchDailyVisitsData:', error);
    }
  };
  
  // Fetch project visit data
  const fetchProjectVisitsData = async () => {
    try {
      const { data: visits, error } = await supabase
        .from('page_visits')
        .select('project_id, project_name')
        .eq('page_type', 'project');
      
      if (error) {
        console.error('Error fetching project visits:', error);
        return;
      }
      
      // Organize data by project
      const projectCounts = {};
      
      visits.forEach(visit => {
        const projectName = visit.project_name || `Project ${visit.project_id}`;
        
        if (!projectCounts[projectName]) {
          projectCounts[projectName] = 0;
        }
        projectCounts[projectName]++;
      });
      
      // Convert data to chart format
      const chartData = Object.keys(projectCounts).map(project => ({
        name: project,
        visits: projectCounts[project]
      }));
      
      // Sort by visits in descending order
      chartData.sort((a, b) => b.visits - a.visits);
      
      setProjectData(chartData);
    } catch (error) {
      console.error('Error in fetchProjectVisitsData:', error);
    }
  };
  
  // Format date in a readable way
  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };
  
  // Change time range
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    fetchDailyVisitsData();
  };

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
  
  if (isLoading) {
    return <div className="page-spin"></div>;
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="title">Visit Statistics</h1>
        <p className="last-update">
          Last updated: {analyticsData?.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleString('en-US') : 'Not available'}
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="analytics-cards">
        <div className="analytics-card total-card">
          <div className="card-icon">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div className="card-content">
            <h3>Total Visits</h3>
            <p className="card-number">{analyticsData?.totalVisits || 0}</p>
          </div>
        </div>
        
        <div className="analytics-card today-card">
          <div className="card-icon">
            <i className="fa-solid fa-calendar-day"></i>
          </div>
          <div className="card-content">
            <h3>Today's Visits</h3>
            <p className="card-number">{analyticsData?.todayHomeVisits || 0}</p>
          </div>
        </div>
        
        <div className="analytics-card week-card">
          <div className="card-icon">
            <i className="fa-solid fa-calendar-week"></i>
          </div>
          <div className="card-content">
            <h3>Weekly Visits</h3>
            <p className="card-number">{analyticsData?.weekHomeVisits || 0}</p>
          </div>
        </div>
        
        <div className="analytics-card month-card">
          <div className="card-icon">
            <i className="fa-solid fa-calendar-alt"></i>
          </div>
          <div className="card-content">
            <h3>Monthly Visits</h3>
            <p className="card-number">{analyticsData?.monthHomeVisits || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="analytics-charts">
        {/* Daily visits chart */}
        <div className="chart-container line-chart-container">
          <div className="chart-header">
            <h3>Visits by Date</h3>
            <div className="time-range-selector">
              <button 
                className={timeRange === 'week' ? 'active' : ''} 
                onClick={() => handleTimeRangeChange('week')}
              >
                Week
              </button>
              <button 
                className={timeRange === 'month' ? 'active' : ''} 
                onClick={() => handleTimeRangeChange('month')}
              >
                Month
              </button>
              <button 
                className={timeRange === 'quarter' ? 'active' : ''} 
                onClick={() => handleTimeRangeChange('quarter')}
              >
                Quarter
              </button>
            </div>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Project visits chart */}
        <div className="charts-row">
          <div className="chart-container bar-chart-container">
            <h3>Project Visits</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Pie chart for project visits */}
          <div className="chart-container pie-chart-container">
            <h3>Project Visit Percentages</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="visits"
                  nameKey="name"
                  label={(entry) => entry.name}
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

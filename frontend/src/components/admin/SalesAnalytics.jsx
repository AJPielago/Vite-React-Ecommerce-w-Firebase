import React, { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// Import charts from the main package
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
// Remove the problematic imports and use the components directly
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { DateRange, BarChart as BarChartIcon, ShowChart as LineChartIcon } from '@mui/icons-material';
import api from '../../utils/api';

// Helper function to format date based on groupBy
const formatDateLabel = (dateString, groupBy) => {
  const date = parseISO(dateString);
  switch (groupBy) {
    case 'day':
      return format(date, 'MMM d, yyyy');
    case 'week':
      return `Week ${format(date, 'w, MMM yyyy')}`;
    case 'month':
    default:
      return format(date, 'MMM yyyy');
  }
};

const SalesAnalytics = () => {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(subMonths(new Date(), 12));
  const [endDate, setEndDate] = useState(new Date());
  const [groupBy, setGroupBy] = useState('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('line');

  const fetchSalesData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.get('/sales/analytics', {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          groupBy
        }
      });

      setData(data.data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for MUI X-Charts
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { xAxis: [], series: [] };
    }

    // Create a safe copy of the data and sort it
    const safeData = Array.isArray(data) ? [...data] : [];
    const sortedData = safeData.sort((a, b) => {
      try {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } catch (e) {
        return 0;
      }
    });

    return {
      xAxis: [{
        data: sortedData.map(item => {
          try {
            return item && item.date ? new Date(item.date) : new Date();
          } catch (e) {
            return new Date();
          }
        }),
        scaleType: 'time',
        valueFormatter: (date) => formatDateLabel(date, groupBy),
      }],
      series: [{
        type: chartType === 'line' ? 'line' : 'bar',
        data: sortedData.map(item => item?.totalSales || 0),
        label: 'Sales',
        color: theme.palette.primary.main,
        valueFormatter: (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }],
    };
  }, [data, groupBy, chartType, theme.palette.primary.main]);

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate, groupBy, chartType]);

  // Chart height constant
  const chartHeight = 400;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardHeader 
          title="Sales Analytics" 
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, newType) => newType && setChartType(newType)}
                size="small"
                aria-label="chart type"
              >
                <ToggleButton value="line" aria-label="line chart">
                  <LineChartIcon />
                </ToggleButton>
                <ToggleButton value="bar" aria-label="bar chart">
                  <BarChartIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="group-by-label">Group By</InputLabel>
                <Select
                  labelId="group-by-label"
                  value={groupBy}
                  label="Group By"
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                </Select>
              </FormControl>
              
              <Box display="flex" alignItems="center" gap={1}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  maxDate={endDate}
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
                <DateRange sx={{ color: 'text.secondary' }} />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  minDate={startDate}
                  maxDate={new Date()}
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
              </Box>
            </Box>
          }
        />
        
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ width: '100%', height: 400, position: 'relative' }}>
            {loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <CircularProgress />
              </Box>
            ) : data.length > 0 ? (
              <Box sx={{ width: '100%', height: '100%' }}>
                <LineChart
                  xAxis={[{
                    data: chartData.xAxis[0].data,
                    scaleType: 'time',
                    valueFormatter: (date) => formatDateLabel(date, groupBy),
                  }]}
                  series={[{
                    data: chartData.series[0].data,
                    label: 'Sales',
                    color: theme.palette.primary.main,
                  }]}
                  yAxis={[{
                    label: 'Sales ($)',
                    valueFormatter: (value) => `$${value.toLocaleString()}`,
                  }]}
                  margin={{ left: 80, right: 30, top: 20, bottom: 60 }}
                />
              </Box>
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                color="text.secondary"
              >
                <Typography>No sales data available for the selected date range.</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default SalesAnalytics;

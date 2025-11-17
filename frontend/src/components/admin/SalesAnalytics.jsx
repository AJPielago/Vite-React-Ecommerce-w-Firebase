import React, { useState, useEffect, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
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
const formatDateLabel = (label) => label;

const SalesAnalytics = () => {
  const theme = useTheme();
  const [chartPayload, setChartPayload] = useState({
    labels: [],
    sales: [],
    orders: []
  });
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
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
      const response = await api.get('/sales/analytics', {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          groupBy
        }
      });

      const payload = response?.data?.data || {};
      const datasets = Array.isArray(payload.datasets) ? payload.datasets : [];
      const salesDataset = datasets.find(dataset => dataset.label?.toLowerCase() === 'sales');
      const ordersDataset = datasets.find(dataset => dataset.label?.toLowerCase() === 'orders');

      setChartPayload({
        labels: Array.isArray(payload.labels) ? payload.labels : [],
        sales: Array.isArray(salesDataset?.data) ? salesDataset.data : [],
        orders: Array.isArray(ordersDataset?.data) ? ordersDataset.data : []
      });
      setSummary({
        totalSales: response?.data?.summary?.totalSales || 0,
        totalOrders: response?.data?.summary?.totalOrders || 0,
        averageOrderValue: response?.data?.summary?.averageOrderValue || 0
      });
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for MUI X-Charts
  const chartData = useMemo(() => {
    if (!chartPayload.labels.length) {
      return null;
    }

    return {
      xAxis: [{
        id: 'dates',
        data: chartPayload.labels,
        scaleType: 'band',
        valueFormatter: (label) => formatDateLabel(label, groupBy),
      }],
      series: [{
        id: 'sales',
        data: chartPayload.sales,
        label: 'Sales',
        color: theme.palette.primary.main,
        valueFormatter: (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }],
    };
  }, [chartPayload, groupBy, theme.palette.primary.main]);

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
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h6">
                  ${Number(summary.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Total Orders</Typography>
                <Typography variant="h6">
                  {Number(summary.totalOrders || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Avg Order Value</Typography>
                <Typography variant="h6">
                  ${Number(summary.averageOrderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

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
            ) : chartData ? (
              <Box sx={{ width: '100%', height: '100%' }}>
                {chartType === 'bar' ? (
                  <BarChart
                    xAxis={chartData.xAxis}
                    series={chartData.series}
                    height={chartHeight}
                    yAxis={[{
                      label: 'Sales ($)',
                      valueFormatter: (value) => `$${Number(value || 0).toLocaleString()}`,
                    }]}
                    margin={{ left: 80, right: 30, top: 20, bottom: 60 }}
                  />
                ) : (
                  <LineChart
                    xAxis={chartData.xAxis}
                    series={chartData.series}
                    height={chartHeight}
                    yAxis={[{
                      label: 'Sales ($)',
                      valueFormatter: (value) => `$${Number(value || 0).toLocaleString()}`,
                    }]}
                    margin={{ left: 80, right: 30, top: 20, bottom: 60 }}
                  />
                )}
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

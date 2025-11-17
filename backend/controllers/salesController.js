const Order = require('../models/Order');
const { ErrorResponse } = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const moment = require('moment');

// @desc    Get sales analytics with date range
// @route   GET /api/sales/analytics
// @access  Private/Admin
exports.getSalesAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  // Set default date range to last 30 days if not provided
  const defaultStartDate = moment().subtract(30, 'days').startOf('day');
  const defaultEndDate = moment().endOf('day');
  
  const start = startDate 
    ? moment(startDate).startOf('day')
    : defaultStartDate;
    
  const end = endDate 
    ? moment(endDate).endOf('day')
    : defaultEndDate;

  // Validate date range (max 2 years)
  if (end.diff(start, 'days') > 730) {
    return next(new ErrorResponse('Date range cannot exceed 2 years', 400));
  }

  // Group by day, week, or month
  let groupFormat, dateFormat;
  
  switch (groupBy) {
    case 'week':
      groupFormat = { 
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      dateFormat = 'MMM D';
      break;
    case 'month':
      groupFormat = { 
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      dateFormat = 'MMM YYYY';
      break;
    case 'day':
    default:
      groupFormat = { 
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      dateFormat = 'MMM D';
  }

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start.toDate(), $lte: end.toDate() }
      }
    },
    {
      $group: {
        _id: groupFormat,
        totalSales: { $sum: '$totalPrice' },
        count: { $sum: 1 },
        date: { $first: '$createdAt' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
    }
  ]);

  // Format the data for the chart
  const labels = [];
  const sales = [];
  const orders = [];

  // Fill in missing dates with zero values
  const currentDate = moment(start);
  const endDateMoment = moment(end);
  
  while (currentDate.isSameOrBefore(endDateMoment)) {
    let formattedDate, found = false;
    
    if (groupBy === 'month') {
      formattedDate = currentDate.format('YYYY-MM');
    } else if (groupBy === 'week') {
      formattedDate = `${currentDate.year()}-${currentDate.week()}`;
    } else {
      formattedDate = currentDate.format('YYYY-MM-DD');
    }
    
    // Check if we have data for this date
    const dataPoint = salesData.find(item => {
      if (groupBy === 'month') {
        return (
          item._id.year === currentDate.year() && 
          item._id.month === currentDate.month() + 1
        );
      } else if (groupBy === 'week') {
        return (
          item._id.year === currentDate.year() && 
          item._id.week === currentDate.week()
        );
      } else {
        return (
          item._id.year === currentDate.year() && 
          item._id.month === currentDate.month() + 1 && 
          item._id.day === currentDate.date()
        );
      }
    });

    if (dataPoint) {
      labels.push(moment(dataPoint.date).format(dateFormat));
      sales.push(dataPoint.totalSales);
      orders.push(dataPoint.count);
    } else {
      labels.push(currentDate.format(dateFormat));
      sales.push(0);
      orders.push(0);
    }

    // Move to next period
    if (groupBy === 'month') {
      currentDate.add(1, 'month');
    } else if (groupBy === 'week') {
      currentDate.add(1, 'week');
    } else {
      currentDate.add(1, 'day');
    }
  }

  // Calculate summary
  const totalSales = sales.reduce((sum, val) => sum + val, 0);
  const totalOrders = orders.reduce((sum, val) => sum + val, 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  res.status(200).json({
    success: true,
    data: {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: sales,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Orders',
          data: orders,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue
    },
    dateRange: {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
      groupBy
    }
  });
});

// @desc    Get monthly sales data for the year
// @route   GET /api/sales/monthly
// @access  Private/Admin
exports.getMonthlySales = asyncHandler(async (req, res, next) => {
  const currentYear = moment().year();
  
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalSales: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Initialize all months with zero values
  const monthlyData = Array(12).fill(0).map((_, index) => ({
    month: index + 1,
    totalSales: 0,
    orderCount: 0
  }));

  // Fill in the actual data
  monthlySales.forEach(sale => {
    monthlyData[sale._id - 1] = {
      month: sale._id,
      totalSales: sale.totalSales,
      orderCount: sale.orderCount
    };
  });

  // Format for chart
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const labels = monthNames;
  const salesData = monthlyData.map(m => m.totalSales);
  const orderData = monthlyData.map(m => m.orderCount);

  // Calculate summary
  const totalSales = monthlySales.reduce((sum, month) => sum + month.totalSales, 0);
  const totalOrders = monthlySales.reduce((sum, month) => sum + month.orderCount, 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  res.status(200).json({
    success: true,
    year: currentYear,
    data: {
      labels,
      datasets: [
        {
          label: 'Monthly Sales',
          data: salesData,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Number of Orders',
          data: orderData,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue
    }
  });
});

// @desc    Get sales by category
// @route   GET /api/sales/category
// @access  Private/Admin
exports.getSalesByCategory = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate 
    ? moment(startDate).startOf('day')
    : moment().subtract(30, 'days').startOf('day');
    
  const end = endDate 
    ? moment(endDate).endOf('day')
    : moment().endOf('day');

  const salesByCategory = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'completed'] },
        createdAt: { $gte: start.toDate(), $lte: end.toDate() }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        count: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalSales: -1 } }
  ]);

  // Format for chart
  const labels = salesByCategory.map(item => item._id || 'Uncategorized');
  const salesData = salesByCategory.map(item => item.totalSales);
  const countData = salesByCategory.map(item => item.count);

  res.status(200).json({
    success: true,
    data: {
      labels,
      datasets: [
        {
          label: 'Sales by Category',
          data: salesData,
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(20, 184, 166, 0.7)',
            'rgba(249, 115, 22, 0.7)'
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(20, 184, 166, 1)',
            'rgba(249, 115, 22, 1)'
          ],
          borderWidth: 1
        }
      ]
    },
    summary: {
      totalSales: salesData.reduce((sum, val) => sum + val, 0),
      totalItems: countData.reduce((sum, val) => sum + val, 0)
    },
    dateRange: {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD')
    }
  });
});

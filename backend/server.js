require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Trust first proxy (if behind a reverse proxy like nginx, heroku, etc)
app.set('trust proxy', 1);

// Route files
const auth = require('./routes/auth');
const authRoutes = require('./routes/authRoutes'); // Add social auth routes
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cartRoutes');
const upload = require('./routes/upload');
const salesRoutes = require('./routes/salesRoutes');
// const serviceRoutes = require('./routes/serviceRoutes'); // TODO: Fix serviceRoutes dependency issues

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/auth', authRoutes); // Social auth routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
// Mount upload router under /api/v1 to match frontend calls (frontend uses /api/v1/upload)
app.use('/api/v1/upload', upload);
// Mount sales routes under /api/sales to make them accessible
app.use('/api/sales', salesRoutes);
// app.use('/api/services', serviceRoutes); // TODO: Fix serviceRoutes dependency issues

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the E-commerce API' });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

module.exports = app;

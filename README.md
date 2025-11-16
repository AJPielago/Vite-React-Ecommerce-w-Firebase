# E-Commerce System

A full-stack e-commerce application built with Node.js, Express, MongoDB, and React.

## Features

### Backend
- RESTful API with Express.js
- MongoDB database with Mongoose ODM
- JWT authentication
- User roles (admin/user)
- Product management (CRUD operations)
- Order management
- File upload functionality
- Pagination, filtering, and sorting
- Error handling middleware

### Frontend
- Modern React application with hooks
- React Router for navigation
- Context API for state management
- Tailwind CSS for styling
- Heroicons for icons
- Responsive design
- Shopping cart functionality
- User authentication (login/register)
- Product browsing and search
- Admin dashboard
- User profile with order history

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with MongoDB Compass for local development)
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Cloudinary (image storage and CDN)
- Multer (file uploads)
- Morgan (logging)

### Frontend
- React 18
- Vite (build tool and dev server)
- React Router DOM
- Axios
- Tailwind CSS
- Heroicons

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Compass (for local database management)
- Cloudinary account (free tier available)
- npm or yarn

**Note:** You can easily switch between MongoDB Compass (local) and MongoDB Atlas (cloud) by changing the connection string in `.env`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

See `CLOUDINARY_SETUP.md` for detailed Cloudinary configuration instructions.

4. Start the backend server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server (Vite):
```bash
npm run dev
```

The frontend will run on http://localhost:3000 with Vite's fast HMR (Hot Module Replacement)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (Protected)

### Products
- `GET /api/v1/products` - Get all products (with pagination, filtering, sorting)
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Orders
- `POST /api/v1/orders` - Create new order (Protected)
- `GET /api/v1/orders` - Get all orders (Admin only)
- `GET /api/v1/orders/myorders` - Get user's orders (Protected)
- `GET /api/v1/orders/:id` - Get order by ID (Protected)
- `PUT /api/v1/orders/:id/pay` - Update order to paid (Protected)
- `PUT /api/v1/orders/:id/deliver` - Update order to delivered (Admin only)

### File Upload
- `POST /api/v1/upload` - Upload image (Admin only)

## Usage

### Creating an Admin User

To create an admin user, register a new user and then manually update the role in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or register with role in the request body (if you modify the register controller to accept role).

### Adding Products

1. Login as an admin user
2. Navigate to the Admin Dashboard
3. Click "Add Product"
4. Fill in the product details
5. Click "Add Product" to save

### Making an Order

1. Browse products on the home page or products page
2. Click on a product to view details
3. Add products to cart
4. Go to cart and proceed to checkout
5. Login if not already logged in
6. Complete the order

## Project Structure

```
ecommerce-system/
├── backend/
│   ├── controllers/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   └── products.js
│   ├── middleware/
│   │   ├── async.js
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── fileUpload.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   └── upload.js
│   ├── utils/
│   │   └── errorResponse.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.js
│   │   │   ├── Header.js
│   │   │   └── ProductCard.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── pages/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Cart.js
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── ProductDetail.js
│   │   │   ├── Products.js
│   │   │   ├── Profile.js
│   │   │   └── Register.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
└── README.md
```

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables on your hosting platform
2. Deploy the backend folder
3. Ensure MongoDB connection string is set correctly

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to your hosting platform
3. Set the API proxy to your backend URL

### Environment Variables for Production

Backend:
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time
- `NODE_ENV` - Set to 'production'

## License

MIT

## Author

Your Name

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

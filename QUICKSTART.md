# Quick Start Guide

## Prerequisites
- Node.js (v14+)
- MongoDB Compass (for local database)
- Cloudinary account (free tier available at cloudinary.com)
- npm or yarn

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
NODE_ENV=development

# Cloudinary Configuration (Get these from cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Important:** 
- Change `JWT_SECRET` to a random secure string!
- Sign up at cloudinary.com and get your credentials
- For MongoDB Atlas, replace MONGODB_URI with your Atlas connection string

## Step 3: Start MongoDB with Compass

### Using MongoDB Compass (Recommended for Local Development)
1. Download and install MongoDB Compass from mongodb.com/products/compass
2. Open MongoDB Compass
3. Connect to `mongodb://localhost:27017`
4. The database `ecommerce` will be created automatically when you start the backend

### Using MongoDB Atlas (Cloud Database)
1. Create a free account at mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` with your Atlas connection string
5. You can switch between local and Atlas by changing the MONGODB_URI

## Step 4: Start Backend Server

```bash
# From the backend directory
npm run dev
```

The backend will run on http://localhost:5000

## Step 5: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

## Step 6: Start Frontend Server (Vite)

```bash
# From the frontend directory
npm run dev
```

The frontend will run on http://localhost:3000 (Vite dev server)

## Step 7: Create an Admin User

1. Register a new user at http://localhost:3000/register
2. Open MongoDB and update the user's role:

```javascript
// Using MongoDB Compass or mongo shell
use ecommerce
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

3. Log out and log back in to access admin features

## Step 8: Add Sample Products

1. Login as admin
2. Go to http://localhost:3000/admin
3. Click "Add Product" and create some products

## Using Docker (Alternative)

If you prefer using Docker:

```bash
# From the root directory
docker-compose up
```

This will start MongoDB, backend, and frontend all at once.

## Testing the Application

1. **Browse Products**: Visit http://localhost:3000
2. **Add to Cart**: Click on products and add them to cart
3. **Checkout**: Go to cart and proceed to checkout
4. **Admin Panel**: Login as admin and visit http://localhost:3000/admin
5. **Manage Products**: Add, edit, or delete products
6. **View Orders**: Check all orders in the admin panel

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check the connection string in `.env`
- For Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change the PORT in backend `.env`
- Kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill
  ```

### CORS Errors
- Ensure backend is running on port 5000
- Check the proxy setting in frontend `package.json`

## Next Steps

- Customize the UI with your branding
- Add payment integration (Stripe, PayPal)
- Implement email notifications
- Add product reviews and ratings
- Enhance search functionality
- Add wishlist feature
- Implement coupon codes

## Support

For issues or questions, please check the main README.md file.

# Installation & Testing Guide

## Complete Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd ecommerce-system/backend
npm install
```

Expected packages installed:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- morgan
- multer
- nodemon (dev dependency)

### Step 2: Setup MongoDB

#### Option A: Local MongoDB Installation

**Windows:**
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Verify it's running: `mongod --version`

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` with your connection string

### Step 3: Configure Backend Environment

Create `.env` file in `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=my_super_secret_jwt_key_12345_change_this_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
NODE_ENV=development
```

**Security Note:** Always use a strong, random JWT_SECRET in production!

### Step 4: Start Backend Server

```bash
# From backend directory
npm run dev
```

You should see:
```
Server is running on port 5000
Connected to MongoDB
```

### Step 5: Install Frontend Dependencies

Open a new terminal:

```bash
cd ecommerce-system/frontend
npm install
```

Expected packages installed:
- react
- react-dom
- react-router-dom
- axios
- @heroicons/react
- @headlessui/react
- tailwindcss
- autoprefixer
- postcss

### Step 6: Start Frontend Server

```bash
# From frontend directory
npm start
```

The app should automatically open at http://localhost:3000

## Testing the Application

### Test 1: User Registration

1. Navigate to http://localhost:3000
2. Click "Register" in the header
3. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Register"
5. You should be redirected to the home page and logged in

### Test 2: Create Admin User

1. Open MongoDB Compass or mongo shell
2. Connect to your database
3. Run this command:

```javascript
use ecommerce
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "admin" } }
)
```

4. Log out and log back in
5. You should now see "Admin" link in the header

### Test 3: Add Products (Admin)

1. Login as admin
2. Click "Admin" in the header
3. Click "Add Product"
4. Fill in product details:
   - Name: Laptop
   - Price: 999
   - Category: Electronics
   - Stock: 10
   - Description: High-performance laptop
5. Click "Add Product"
6. Product should appear in the table

Add a few more products for testing:
- Smartphone ($699, Electronics, 15 in stock)
- Novel ($15, Books, 50 in stock)
- T-Shirt ($25, Clothing, 100 in stock)

### Test 4: Browse Products

1. Click "Products" in the header
2. You should see all products
3. Test filters:
   - Select "Electronics" category
   - Change sort to "Price: Low to High"
4. Products should update accordingly

### Test 5: Product Details

1. Click on any product
2. You should see:
   - Product image
   - Name and price
   - Description
   - Stock availability
   - Quantity selector
   - Add to Cart button

### Test 6: Shopping Cart

1. From product detail page, select quantity and click "Add to Cart"
2. Click the cart icon in header
3. You should see:
   - Product in cart
   - Quantity selector
   - Remove button
   - Order summary with totals
4. Test changing quantity
5. Test removing item
6. Add multiple products

### Test 7: Checkout Process

1. With items in cart, click "Proceed to Checkout"
2. If not logged in, you'll be redirected to login
3. After login, you'll proceed to checkout
4. Complete the order

### Test 8: View Orders

1. Click on your profile name in header
2. Select "Profile"
3. You should see your order history
4. Verify order details are correct

### Test 9: Admin Order Management

1. Login as admin
2. Go to Admin Dashboard
3. Click "Orders" tab
4. You should see all orders
5. Test "Mark as Delivered" button
6. Order status should update

### Test 10: Logout and Login

1. Click "Logout"
2. Verify you're logged out
3. Click "Login"
4. Enter credentials
5. Verify you're logged back in

## API Testing with Postman/Thunder Client

### Test Authentication

**Register User:**
```
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "name": "API Test User",
  "email": "apitest@example.com",
  "password": "password123"
}
```

**Login:**
```
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "apitest@example.com",
  "password": "password123"
}
```

Copy the token from the response.

**Get Current User:**
```
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### Test Products

**Get All Products:**
```
GET http://localhost:5000/api/v1/products
```

**Get Products with Filters:**
```
GET http://localhost:5000/api/v1/products?category=Electronics&sort=-price&page=1&limit=10
```

**Get Single Product:**
```
GET http://localhost:5000/api/v1/products/PRODUCT_ID
```

**Create Product (Admin only):**
```
POST http://localhost:5000/api/v1/products
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Test Product",
  "price": 99.99,
  "description": "Test description",
  "category": "Electronics",
  "stock": 20
}
```

### Test Orders

**Create Order:**
```
POST http://localhost:5000/api/v1/orders
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "orderItems": [
    {
      "name": "Product Name",
      "qty": 2,
      "image": "image.jpg",
      "price": 99.99,
      "product": "PRODUCT_ID"
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "PayPal",
  "itemsPrice": 199.98,
  "taxPrice": 19.99,
  "shippingPrice": 10.00,
  "totalPrice": 229.97
}
```

**Get My Orders:**
```
GET http://localhost:5000/api/v1/orders/myorders
Authorization: Bearer YOUR_TOKEN
```

## Troubleshooting

### Backend won't start

**Error: MongoDB connection failed**
- Ensure MongoDB is running
- Check connection string in `.env`
- For Atlas, verify IP whitelist and credentials

**Error: Port 5000 already in use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill
```

### Frontend won't start

**Error: Port 3000 already in use**
- Kill the process or use a different port
- Set PORT=3001 in frontend environment

**Error: Cannot connect to backend**
- Verify backend is running on port 5000
- Check proxy setting in `frontend/package.json`

### Authentication issues

**Token not working**
- Check token format: "Bearer TOKEN"
- Verify JWT_SECRET matches between requests
- Token might be expired (default 7 days)

### CORS errors

**Cross-origin request blocked**
- Verify CORS is enabled in backend
- Check backend URL in frontend requests
- Ensure backend is running

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test product listing endpoint
ab -n 1000 -c 10 http://localhost:5000/api/v1/products

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/v1/auth/me
```

### Expected Performance
- Product listing: < 100ms
- Single product: < 50ms
- Authentication: < 200ms
- Order creation: < 300ms

## Database Verification

### Check Collections

```javascript
// In MongoDB shell or Compass
use ecommerce

// View all users
db.users.find().pretty()

// View all products
db.products.find().pretty()

// View all orders
db.orders.find().pretty()

// Count documents
db.users.countDocuments()
db.products.countDocuments()
db.orders.countDocuments()
```

## Success Criteria

✅ Backend server starts without errors
✅ Frontend server starts and opens in browser
✅ Can register new user
✅ Can login with credentials
✅ Can create admin user
✅ Admin can add products
✅ Can browse and filter products
✅ Can add products to cart
✅ Cart persists across page refreshes
✅ Can complete checkout process
✅ Orders appear in profile
✅ Admin can view all orders
✅ Admin can update order status

## Next Steps After Installation

1. Customize branding and colors
2. Add more products
3. Test all user flows
4. Set up production environment
5. Configure deployment
6. Add monitoring and analytics

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check environment variables
5. Review the logs in terminal

For detailed feature documentation, see `README.md`

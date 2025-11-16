# Cloudinary Setup Guide

This e-commerce system uses Cloudinary for image storage and management instead of local file storage. This provides better performance, automatic image optimization, and CDN delivery.

## Why Cloudinary?

- **Cloud Storage**: No need to manage local uploads folder
- **CDN Delivery**: Fast image loading worldwide
- **Automatic Optimization**: Images are automatically optimized
- **Transformations**: Resize, crop, and transform images on-the-fly
- **Free Tier**: 25GB storage and 25GB bandwidth per month

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" (it's free!)
3. Fill in your details or sign up with Google/GitHub
4. Verify your email address

### 2. Get Your Credentials

After logging in:

1. Go to your Dashboard (https://cloudinary.com/console)
2. You'll see your **Account Details** section with:
   - **Cloud Name**: Your unique cloud name
   - **API Key**: Your API key
   - **API Secret**: Your API secret (click the eye icon to reveal)

### 3. Add Credentials to Backend

Copy your credentials and add them to your `.env` file in the `backend` directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=democloud123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Login as an admin user in your frontend

3. Go to Admin Dashboard

4. Try adding a product with an image

5. The image will be uploaded to Cloudinary and you'll get a URL back

## How It Works

### Image Upload Flow

1. **Admin uploads image** → Frontend sends image to backend
2. **Backend receives image** → Multer middleware processes it
3. **Cloudinary storage** → Image is uploaded to Cloudinary
4. **URL returned** → Cloudinary returns a secure URL
5. **URL saved in database** → Product model stores the Cloudinary URL
6. **Image displayed** → Frontend displays image from Cloudinary CDN

### Folder Structure in Cloudinary

All product images are stored in the `ecommerce-products` folder in your Cloudinary account. You can view and manage them in the Cloudinary Media Library.

### Image Transformations

The current configuration automatically:
- Limits image size to 800x800 pixels
- Accepts formats: jpg, jpeg, png, gif, webp
- Limits file size to 5MB

You can modify these settings in `backend/config/cloudinary.js`.

## Viewing Your Images

1. Login to [cloudinary.com/console](https://cloudinary.com/console)
2. Click on "Media Library" in the left sidebar
3. Navigate to the `ecommerce-products` folder
4. You'll see all uploaded product images

## Managing Images

### Delete Images

Images are automatically managed by Cloudinary. If you delete a product from your database, you may want to also delete the image from Cloudinary to save space.

### Organize Images

You can create subfolders in Cloudinary to organize images by category:
- ecommerce-products/electronics
- ecommerce-products/clothing
- ecommerce-products/books

## Advanced Features (Optional)

### Image Transformations

Cloudinary allows you to transform images on-the-fly by modifying the URL:

**Original:**
```
https://res.cloudinary.com/demo/image/upload/sample.jpg
```

**Resized to 300x300:**
```
https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/sample.jpg
```

**With quality optimization:**
```
https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/sample.jpg
```

### Responsive Images

You can serve different image sizes for different devices:

```javascript
// In your frontend component
const getResponsiveImage = (url, width) => {
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
};

// Usage
<img 
  src={getResponsiveImage(product.images[0], 300)} 
  srcSet={`
    ${getResponsiveImage(product.images[0], 300)} 300w,
    ${getResponsiveImage(product.images[0], 600)} 600w,
    ${getResponsiveImage(product.images[0], 900)} 900w
  `}
  sizes="(max-width: 600px) 300px, (max-width: 900px) 600px, 900px"
  alt={product.name}
/>
```

## Troubleshooting

### Error: "Invalid cloud_name"
- Check that your CLOUDINARY_CLOUD_NAME is correct
- Make sure there are no extra spaces in your .env file

### Error: "Invalid API key"
- Verify your CLOUDINARY_API_KEY is correct
- Make sure you copied it correctly from the dashboard

### Error: "Upload failed"
- Check your internet connection
- Verify file size is under 5MB
- Ensure file format is supported (jpg, png, gif, webp)

### Images not displaying
- Check the image URL in your database
- Verify the URL is accessible in a browser
- Check browser console for CORS errors

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations per month

This is more than enough for development and small to medium e-commerce sites.

## Switching Between Local and Cloudinary

If you want to switch back to local storage:

1. Uncomment the local storage code in `backend/middleware/fileUpload.js`
2. Update the upload route to use local storage
3. Add back the static uploads folder in `server.js`

## Production Considerations

For production:
1. Enable **Strict Transformations** in Cloudinary settings
2. Set up **Auto-backup** for your media
3. Configure **Access Control** for sensitive images
4. Use **Signed URLs** for private images
5. Enable **Auto-tagging** for better organization

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Optimization Best Practices](https://cloudinary.com/documentation/image_optimization)

## Support

If you encounter issues:
1. Check the [Cloudinary Status Page](https://status.cloudinary.com/)
2. Visit [Cloudinary Support](https://support.cloudinary.com/)
3. Check the error logs in your backend console

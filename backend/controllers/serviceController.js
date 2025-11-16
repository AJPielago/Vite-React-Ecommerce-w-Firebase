const Service = require('../models/Service');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { validationResult } = require('express-validator');

// Create a new service
const createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, duration } = req.body;
    let images = [];

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer)
      );
      
      const results = await Promise.all(uploadPromises);
      images = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id
      }));
    }

    const service = new Service({
      name,
      description,
      price,
      duration,
      images
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all services with pagination and search
const getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    };

    const [services, total] = await Promise.all([
      Service.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Service.countDocuments(query)
    ]);

    res.json({
      data: services,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single service by ID
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    const updates = { name, description, price, duration };

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer)
      );
      
      const results = await Promise.all(uploadPromises);
      updates.$push = {
        images: {
          $each: results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id
          }))
        }
      };
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Delete images from Cloudinary
    if (service.images && service.images.length > 0) {
      const deletePromises = service.images.map(image => 
        deleteFromCloudinary(image.public_id)
      );
      await Promise.all(deletePromises);
    }

    await service.remove();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk delete services
const bulkDeleteServices = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No services selected for deletion' });
    }

    // Find all services to be deleted
    const services = await Service.find({ _id: { $in: ids } });
    
    // Delete all associated images from Cloudinary
    const deletePromises = [];
    services.forEach(service => {
      if (service.images && service.images.length > 0) {
        service.images.forEach(image => {
          deletePromises.push(deleteFromCloudinary(image.public_id));
        });
      }
    });

    await Promise.all(deletePromises);
    
    // Delete the services
    await Service.deleteMany({ _id: { $in: ids } });
    
    res.json({ message: `${services.length} services deleted successfully` });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: 'Server error during bulk delete' });
  }
};

// Delete a specific image from a service
const deleteServiceImage = async (req, res) => {
  try {
    const { serviceId, imageId } = req.params;
    
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const imageIndex = service.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageToDelete = service.images[imageIndex];
    
    // Delete from Cloudinary
    await deleteFromCloudinary(imageToDelete.public_id);
    
    // Remove from the array
    service.images.splice(imageIndex, 1);
    await service.save();
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  bulkDeleteServices,
  deleteServiceImage
};

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Increase timeout for large file uploads
app.timeout = 30 * 60 * 1000; // 30 minutes timeout

// Middleware
app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'artist' },
  notifications: [{
    message: String,
    modelTitle: String,
    type: String, // 'rejection', 'approval', etc.
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Authentication Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing in', error: error.message });
  }
});

// Configure multer for file upload with chunked streaming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' && path.extname(file.originalname).toLowerCase() === '.stl') {
      cb(null, true);
    } else {
      cb(new Error('Only .stl files are allowed'));
    }
  },
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB limit
    fieldSize: 300 * 1024 * 1024 // 300MB limit for form fields
  }
});

// Model Schema
const modelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  purchases: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purchaseDate: { type: Date, default: Date.now }
  }]
});

const Model = mongoose.model('Model', modelSchema);

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate as admin' });
  }
};

// Artist middleware
const artistAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'artist') {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Only artists can upload models' });
  }
};

// Protected Routes
app.use('/api/upload', artistAuth);
app.use('/api/models/creator', auth);
app.use('/api/models/status', adminAuth);

// Upload endpoint with better error handling
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, price } = req.body;
    
    const model = new Model({
      title,
      description,
      price: parseFloat(price),
      fileUrl: `/uploads/${req.file.filename}`,
      creator: req.user._id,
    });

    await model.save();
    
    res.status(201).json({
      message: 'File uploaded successfully',
      model
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up the uploaded file if model creation fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({ 
      message: 'Error uploading file', 
      error: error.message,
      details: error.stack 
    });
  }
});

// Get pending models (admin only)
app.get('/api/models/pending', adminAuth, async (req, res) => {
  try {
    const models = await Model.find({ status: 'pending' })
      .populate('creator', 'username')
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(models);
  } catch (error) {
    console.error('Error fetching pending models:', error);
    res.status(500).json({ message: 'Error fetching pending models', error: error.message });
  }
});

// Update model status (admin only)
app.patch('/api/models/status/:modelId', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    console.log('Updating model status:', req.params.modelId, 'to', status);

    const model = await Model.findById(req.params.modelId).populate('creator');
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    if (status === 'rejected') {
      try {
        // Get absolute path to the file using the fileUrl from the model
        const filePath = path.join(__dirname, '..', 'uploads', path.basename(model.fileUrl));
        console.log('Attempting to delete file:', filePath);
        
        // Check if file exists before attempting deletion
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log('File deleted successfully:', filePath);
        } else {
          console.log('File not found for deletion:', filePath);
        }

        // Add notification for the artist
        await User.findByIdAndUpdate(model.creator._id, {
          $push: {
            notifications: {
              message: `Your model "${model.title}" was not approved and has been removed.`,
              modelTitle: model.title,
              type: 'rejection',
              createdAt: new Date()
            }
          }
        });

        // Delete the model from MongoDB
        const deleteResult = await Model.findByIdAndDelete(model._id);
        if (deleteResult) {
          console.log('Model deleted from database:', model._id);
        } else {
          console.log('Model not found in database for deletion:', model._id);
        }

        return res.json({ 
          message: 'Model rejected and deleted successfully',
          deletedModel: model._id
        });
      } catch (error) {
        console.error('Error during model rejection:', error);
        // Even if file deletion fails, proceed with database deletion
        await Model.findByIdAndDelete(model._id);
        return res.json({ 
          message: 'Model rejected successfully',
          deletedModel: model._id,
          warning: 'Model was removed from database but encountered issues cleaning up files'
        });
      }
    } else {
      // If approved, update the status
      try {
        model.status = status;
        const savedModel = await model.save();
        console.log('Model status updated successfully:', savedModel._id);

        // Add notification for approval
        await User.findByIdAndUpdate(model.creator._id, {
          $push: {
            notifications: {
              message: `Your model "${model.title}" has been approved and is now listed in the marketplace.`,
              modelTitle: model.title,
              type: 'approval',
              createdAt: new Date()
            }
          }
        });

        return res.json({ 
          message: 'Model approved successfully',
          model: savedModel 
        });
      } catch (error) {
        console.error('Error saving model status:', error);
        return res.status(500).json({ 
          message: 'Error saving model status',
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error('Error in model status update:', error);
    // Send a more specific error message
    return res.status(500).json({ 
      message: 'Error updating model status',
      error: error.message
    });
  }
});

// Get all models (for marketplace)
app.get('/api/models', async (req, res) => {
  try {
    const models = await Model.find()
      .populate('creator', 'username')
      .populate('purchases.buyer', 'username');
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching models', error: error.message });
  }
});

// Purchase model
app.post('/api/models/:modelId/purchase', auth, async (req, res) => {
  try {
    const model = await Model.findById(req.params.modelId);
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    if (model.status !== 'approved') {
      return res.status(400).json({ message: 'Model is not available for purchase' });
    }

    // Check if user has already purchased
    const alreadyPurchased = model.purchases.some(
      purchase => purchase.buyer.toString() === req.user._id.toString()
    );

    if (alreadyPurchased) {
      return res.status(400).json({ message: 'You have already purchased this model' });
    }

    // Add purchase record
    model.purchases.push({ buyer: req.user._id });
    await model.save();

    res.json({ message: 'Purchase successful', model });
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing model', error: error.message });
  }
});

// Get models by creator
app.get('/api/models/creator/:creatorId', auth, async (req, res) => {
  try {
    const models = await Model.find({ creator: req.params.creatorId })
      .populate('purchases.buyer', 'username');
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching models', error: error.message });
  }
});

// Delete model (artist can delete their own models)
app.delete('/api/models/:modelId', auth, async (req, res) => {
  try {
    console.log('Delete request received for model:', req.params.modelId);
    
    // Validate modelId format
    if (!mongoose.Types.ObjectId.isValid(req.params.modelId)) {
      console.log('Invalid model ID format:', req.params.modelId);
      return res.status(400).json({ message: 'Invalid model ID format' });
    }

    const model = await Model.findById(req.params.modelId);
    console.log('Model found:', model ? 'yes' : 'no');
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found in database' });
    }

    // Check if the user is the creator of the model
    if (model.creator.toString() !== req.user._id.toString()) {
      console.log('Authorization failed - User:', req.user._id, 'Creator:', model.creator);
      return res.status(403).json({ message: 'Not authorized to delete this model' });
    }

    // Try to delete the file if it exists
    try {
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(model.fileUrl));
      console.log('Attempting to delete file:', filePath);
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log('File deleted successfully:', filePath);
      } else {
        console.log('File not found for deletion:', filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database regardless of file deletion result
    const deleteResult = await Model.findByIdAndDelete(model._id);
    if (deleteResult) {
      console.log('Model deleted from database:', model._id);
      return res.status(200).json({ 
        message: 'Model deleted successfully',
        deletedModel: model._id
      });
    } else {
      console.log('Failed to delete model from database:', model._id);
      return res.status(500).json({ 
        message: 'Failed to delete model from database'
      });
    }
  } catch (error) {
    console.error('Error in delete operation:', error);
    return res.status(500).json({ 
      message: 'Error during delete operation', 
      error: error.message 
    });
  }
});

// Add endpoint to get user notifications
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Add endpoint to mark notifications as read
app.post('/api/notifications/clear', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { notifications: [] });
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications', error: error.message });
  }
});

const startServer = async (port) => {
  try {
    await app.listen(port);
    console.log(`Server running on port ${port}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      await startServer(port + 1);
    } else {
      console.error('Server error:', error);
    }
  }
};

const PORT = process.env.PORT || 5000;
startServer(PORT); 
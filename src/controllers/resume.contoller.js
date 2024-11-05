import { uploadResume } from '../middlewares/resume.middleware.js'; // Middleware for file uploads
import { User } from '../models/user.models.js'; // User model
import { Resume } from '../models/resume.models.js'; // Resume model
import cloudinary from '../utils/cloudinary.js'; // Cloudinary utility
import axios from 'axios'; // Axios for HTTP requests
import FormData from 'form-data'; // FormData for multipart/form-data requests

// API URL for fetching embeddings
const renderApiUrl = 'https://cvsmart-flaskapp.onrender.com/get-embedding';

// Async handler for error handling
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Add Resume function
export const addResume = [
  uploadResume.single('file'), // Middleware to handle file upload in memory
  asyncHandler(async (req, res) => {
    const { email, location, commonId } = req.body; // Extract data from the request body
    const file = req.file; // Extract the uploaded file

    if (!file) {
      console.error('No file uploaded.');
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      let cloudinaryUrl;

      // Upload file to Cloudinary directly from memory
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'resumes', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        cloudinaryUrl = cloudinaryResult.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: 'Error uploading file to Cloudinary.', details: err.message });
      }

      // Prepare to send the uploaded file to get embeddings
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);

      // Fetch embeddings
      let embeddings;
      try {
        const response = await axios.post(renderApiUrl, formData, {
          headers: formData.getHeaders(),
        });
        embeddings = response.data.embeddings[0];
        if (!Array.isArray(embeddings) || embeddings.length !== 384) {
          console.error('Invalid embeddings format:', embeddings);
          return res.status(500).json({ error: 'Invalid embeddings format.' });
        }
      } catch (err) {
        console.error('Error fetching embeddings from Flask:', err);
        return res.status(500).json({ error: 'Error fetching embeddings from Flask.', details: err.message });
      }

      // Document to be saved
      const doc = {
        user_id: user._id.toString(),
        file_name: file.originalname,
        file_url: cloudinaryUrl,
        location,
        posted_date: new Date(),
        common_id: commonId,
        embeddings,
        cloudinary_url: cloudinaryUrl,
      };

      // Check if a resume with the same file name already exists
      const existingResume = await Resume.findOne({ file_name: file.originalname });

      if (existingResume) {
        // Update the existing document if found
        await Resume.updateOne({ file_name: file.originalname }, doc);
        res.status(200).json({ message: 'Resume updated successfully!' });
      } else {
        // Create a new document if no existing resume found with the same file name
        const newResume = new Resume(doc);
        await newResume.save();
        res.status(201).json({ message: 'Resume uploaded successfully!' });
      }
    } catch (err) {
      console.error(`Error adding resume: ${err.message}`, err);
      res.status(500).json({ error: 'Error adding resume.', details: err.message });
    }
  }),
];

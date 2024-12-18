import { upload } from '../middlewares/multer.middleware.js';
import { User } from '../models/user.models.js';
import JobDescription from '../models/jobdescription.models.js';
import cloudinary from '../utils/cloudinary.js';
import axios from 'axios';
import FormData from 'form-data';

// API URL for fetching embeddings
const renderApiUrl = 'https://cvsmart-flaskapp.onrender.com/get-embedding';

// Async handler for error handling
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Add Job Description function
export const addJobDescription = [
  upload.single('file'), // Middleware to handle file upload
  asyncHandler(async (req, res) => {
    const { email, location, commonId, status } = req.body; // Extract data from the request body
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

      // Upload file to Cloudinary
      let cloudinaryUrl;
      try {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'job_descriptions',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              throw new Error('Cloudinary upload error: ' + error.message);
            }
            cloudinaryUrl = result.secure_url;
          }
        );

        // Create a stream and pipe the file to Cloudinary
        stream.end(file.buffer);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: 'Error uploading file to Cloudinary.', details: err.message });
      }

      // Prepare to send the uploaded file to get embeddings
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname); // Pass the buffer directly

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

      // Document to be saved or updated
      const doc = {
        user_id: user._id.toString(),
        file_name: file.originalname,
        file_url: cloudinaryUrl,
        location,
        posted_date: new Date(),
        common_id: commonId, // Ensure commonId is correctly used
        status,
        embeddings,
        cloudinary_url: cloudinaryUrl,
      };

      // Check if a job description with the same file name already exists
      const existingJob = await JobDescription.findOne({ file_name: file.originalname });

      if (existingJob) {
        // Update the existing document if found
        await JobDescription.updateOne({ file_name: file.originalname }, doc);
        res.status(200).json({ message: 'Job description updated successfully!' });
      } else {
        // Create a new document if no existing job found with the same file name
        const newJobDescription = new JobDescription(doc);
        await newJobDescription.save();
        res.status(201).json({ message: 'Job description and file added successfully!' });
      }
    } catch (err) {
      console.error(`Error adding job description: ${err.message}`, err);
      res.status(500).json({ error: 'Error adding job description.', details: err.message });
    }
  }),
];

import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.models.js';
import { Resume } from '../models/resume.models.js'; // Import the Resume model
import { uploadResume } from '../middlewares/resume.middleware.js'; // Import resume multer config
import axios from 'axios';
import FormData from 'form-data'; // Import FormData to handle multipart/form-data

const addResume = [
  uploadResume.single('file'),
  asyncHandler(async (req, res) => {
    const { email, location } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No resume uploaded.' });
    }

    try {
      // Check if the user exists in MongoDB
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Cloudinary URL from the uploaded file
      const cloudinaryUrl = file.path;

      // Create FormData and append the Cloudinary URL for embedding
      const formData = new FormData();
      formData.append('file_url', cloudinaryUrl); // Assuming the endpoint accepts `file_url`

      const response = await axios.post('https://cvsmart-flaskapp.onrender.com/get-embedding', formData, {
        headers: { ...formData.getHeaders() },
      });
      const embeddings = response.data.embeddings[0];

      if (!Array.isArray(embeddings) || embeddings.length !== 384) {
        return res.status(500).json({ error: 'Invalid embeddings format' });
      }

      const common_id = "cvsmart";

      // Check if the resume already exists for this user in MongoDB
      const existingResume = await Resume.findOne({ user_id: user._id });

      // Prepare the document for MongoDB
      const doc = {
        user_id: user._id,
        file_name: file.originalname,
        file_type: file.mimetype,
        location,
        posted_date: new Date(),
        common_id,
        embeddings,
        cloudinary_url: cloudinaryUrl,
      };

      if (existingResume) {
        // Document exists, update it
        existingResume.set(doc); // Use set to update the document
        await existingResume.save();
        res.status(200).json({ message: 'Resume updated successfully!' });
      } else {
        // Document doesn't exist, add a new one
        await Resume.create(doc);
        res.status(200).json({ message: 'Resume added successfully!' });
      }
    } catch (err) {
      console.error(`Error adding resume: ${err.message}`);
      res.status(500).json({ error: 'Error adding resume' });
    }
  })
];

export { addResume };

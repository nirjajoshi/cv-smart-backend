// resume.middleware.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cloudinary from '../utils/cloudinary.js';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to ensure the base upload directory exists
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'resumes', // Folder in Cloudinary where resumes will be stored
    format: async (req, file) => {
      // Automatically set format based on file's mimetype (e.g., pdf, docx)
      const ext = path.extname(file.originalname).slice(1);
      return ext || 'pdf'; // Default to 'pdf' if extension not found
    },
    public_id: (req, file) => 'upload_' + Date.now(), // Unique identifier for each upload
  },
});

// Allowed file types: PDF, DOC, DOCX
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Configure multer with Cloudinary storage and file filter
export const uploadResume = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
  },
});
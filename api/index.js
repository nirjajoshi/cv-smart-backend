import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from "../routes/user.routes.js";
import jobDescriptionRouter from '../routes/jobdescription.routes.js';
import resumeRouter from '../routes/resume.routes.js';
import matchingroute from '../routes/matchingjob.routes.js';
import getuserid from '../routes/userid.routes.js';
import fileRoutes from '../routes/file.route.js';
import matchingCandidatesRoutes from '../routes/matchingCandidates.routes.js';
import updatejob from '../routes/jobupdate.routes.js';

// Connect MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'cv-smart'
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Initialize MongoDB connection
await connectDB();

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/job_description", jobDescriptionRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/", matchingroute);
app.use("/api/v1/userid", getuserid);
app.use('/api/v1/', fileRoutes);
app.use('/api/v1', matchingCandidatesRoutes);
app.use('/api/v1', updatejob);

// Export the handler for Vercel
export default app;

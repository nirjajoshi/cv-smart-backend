import express from "express";

const app = express();

// Define a test route for /api/
app.get("/api/", (req, res) => {
    res.send("Hello from Vercel! This is the API root."); // Test response for the /api/ route
});

// Define a catch-all route for other paths
app.get("*", (req, res) => {
    res.status(404).send("Route not found");
});

// Export the Express app
export default app;

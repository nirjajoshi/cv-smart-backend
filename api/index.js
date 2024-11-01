import express from "express";

const app = express();
// Define your routes and middleware here
app.get("/", (req, res) => {
  res.send("Hello from Vercel!");
});

export default app;

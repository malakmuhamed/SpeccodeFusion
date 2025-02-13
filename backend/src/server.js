const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

// ✅ Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.static("public"));

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/speccode", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Directory Setup
const uploadDir = path.join(__dirname, "uploads");
const extractedDir = path.join(__dirname, "extracted");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(extractedDir)) fs.mkdirSync(extractedDir, { recursive: true });

// ✅ AUTH Middleware (Ensure email is in token)
const authenticateUser = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized access!" });
  }

  try {
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, "secretkey");

    if (!decoded.email) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// ✅ File Upload Configuration (Multer)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    if (!req.user || !req.user.email) {
      return cb(new Error("Unauthorized: Missing user email."), false);
    }
    const userEmail = req.user.email.replace(/[@.]/g, "_");
    cb(null, `${userEmail}_${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ Upload & Process File
app.post("/upload", authenticateUser, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded!" });

  const userEmail = req.user.email.replace(/[@.]/g, "_");
  const userFolder = path.join(extractedDir, userEmail);
  if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

  const extractedFilePath = path.join(userFolder, `${req.file.filename}_extracted.csv`);
  console.log(`📂 Saving extracted file to: ${extractedFilePath}`);

  const pythonProcess = spawn("python", [
    path.resolve(__dirname, "./scripts/test_model.py"),
    "--file",
    req.file.path,
    "--output",
    extractedFilePath,
  ]);

  let outputData = "";
  pythonProcess.stdout.on("data", (data) => (outputData += data.toString()));
  pythonProcess.stderr.on("data", (data) => console.error(`❌ Python Error: ${data.toString()}`));

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.json({ success: "File processed successfully!", extractedPath: `/extracted/${userEmail}/latest_extracted.csv` });
    } else {
      res.status(500).json({ error: "Failed to process the file. Check logs." });
    }
  });
});

// ✅ Get Latest Extracted CSV
app.get("/my-extractions/latest", authenticateUser, (req, res) => {
  try {
    const userEmail = req.user.email.replace(/[@.]/g, "_");
    const userFolder = path.join(extractedDir, userEmail);

    if (!fs.existsSync(userFolder)) return res.status(404).json({ error: "No extracted requirements found." });

    const latestFile = fs.readdirSync(userFolder)
      .filter((file) => file.endsWith("_extracted.csv"))
      .sort((a, b) => fs.statSync(path.join(userFolder, b)).mtime - fs.statSync(path.join(userFolder, a)).mtime);

    if (latestFile.length === 0) return res.status(404).json({ error: "No extracted requirements found." });

    const latestFilePath = path.join(userFolder, latestFile[0]);

    const results = [];
    fs.createReadStream(latestFilePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => res.json(results));
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ User Signup
app.post("/api/users/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", user: { username, email } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ User Login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email }, "secretkey", { expiresIn: "3h" });

    res.status(200).json({ message: "Login successful", token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get User Profile
app.get("/api/users/profile", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Update User Profile
app.put("/api/users/profile", authenticateUser, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;
    if (password && password.length > 0) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: "Profile updated successfully!", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Delete User Account
app.delete("/api/users/profile", authenticateUser, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

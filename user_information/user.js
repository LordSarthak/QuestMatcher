// Load Environment Variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");

const app = express();

// Security Middleware
app.use(helmet()); // Protects against common vulnerabilities
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST"],
    })
);
app.use(bodyParser.json());

// Rate Limiting to Prevent Brute Force Attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Configure Secure Session Middleware
app.use(
    session({
        secret: process.env.SECRET_KEY || crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            autoRemove: "native",
        }),
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true, // Prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // Secure in production
            sameSite: "strict",
        },
    })
);

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
});
const User = mongoose.model("User", userSchema);

// Signup Endpoint with Enhanced Security
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Stronger hashing
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: "Username or Email already exists" });
        } else {
            console.error("Error saving user:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
});

// Secure Login Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        req.session.user = { username: user.username, email: user.email };
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Login failed" });
            }
            res.status(200).json({ message: "Login successful", user: req.session.user });
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Google Authentication
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.post("/auth/google", async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const { email, name } = ticket.getPayload();
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ username: name, email, password: null });
            await user.save();
        }
        const authToken = jwt.sign({ username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: "5m" });
        req.session.user = { username: user.username, email: user.email };
        res.status(200).json({ message: "Google Login Successful", user: req.session.user, token: authToken });
    } catch (error) {
        res.status(401).json({ message: "Invalid Google token" });
    }
});

// Secure Logout Endpoint
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });
        res.status(200).json({ message: "Logged out successfully" });
    });
});

// Start Secure Server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
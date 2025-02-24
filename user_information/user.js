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
const { OAuth2Client } = require("google-auth-library");

const app = express();

// Middleware
app.use(bodyParser.json());

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URLS.split(",");

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST"],
    })
);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Configure Session Middleware
const secretKey = process.env.SECRET_KEY || crypto.randomBytes(32).toString("hex");
app.use(
    session({
        secret: secretKey,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            autoRemove: "native",
        }),
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true in production with HTTPS
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
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

// API Endpoint to Handle Signup
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: "Username or Email already exists" });
        } else {
            console.error("Error saving user:", error);
            res.status(500).json({ message: "An error occurred while saving the user" });
        }
    }
});

// API Endpoint to Handle Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
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
        res.status(500).json({ message: "An error occurred during login" });
    }
});

// Google Authentication
const jwtToken = crypto.randomBytes(32).toString("hex");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name } = ticket.getPayload();
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ username: name, email, password: null });
            await user.save();
        }

        const authToken = jwt.sign({ username: user.username, email: user.email }, jwtToken, { expiresIn: "5m" });
        req.session.user = { username: user.username, email: user.email };

        res.status(200).json({ message: "Google Login Successful", user: req.session.user, token: authToken });
    } catch (error) {
        res.status(401).json({ message: "Invalid Google token" });
    }
});

// API Endpoint to Check Session
app.get("/session", (req, res) => {
    if (req.session && req.session.user) {
        res.status(200).json({ user: req.session.user });
    } else {
        res.status(401).json({ message: "No active session" });
    }
});

// Logout API
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT);

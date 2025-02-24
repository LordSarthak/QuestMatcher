const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // Hash passwords
require('dotenv').config();

// Create Express App
const app = express();

// Middleware
app.use(bodyParser.json());

// CORS Configuration for Production
const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// Secure Headers (Best Practice)
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

// Connect to MongoDB (Optimized for Production)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true, // Prevents duplicate keys
    // useFindAndModify: false,
    serverSelectionTimeoutMS: 5000, // Timeout for MongoDB
}).then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit if MongoDB fails
    });

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
});
const User = mongoose.model('User', userSchema);

// Check Environment Variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in .env file");
    process.exit(1); // Exit process if credentials are missing
}

// Nodemailer Transport Configuration (Production Ready)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password
    },
});

// Verify Nodemailer Connection
transporter.verify((error) => {
    if (error) {
        console.error('❌ Nodemailer verification failed:', error);
    } else {
        console.log('✅ Nodemailer is ready to send emails');
    }
});

// Forgot Password API
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.password) {
            return res.status(400).json({ message: "Password reset is not available for Google login users. Login directly with Google Login." });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours validity
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send Reset Email
        const mailOptions = {
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset. Click the link below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you did not request this, ignore this email.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.status(200).json({ message: 'Password reset link sent to your email.' });
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during the process.' });
    }
});

// Reset Password API
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            console.warn('⚠ Invalid or expired token.');
            return res.status(400).json({ message: 'Please request a new password reset link.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password successfully reset.' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during the process.' });
    }
});

// Start Server for Online Hosting
const PORT1 = process.env.PORT1;
app.listen(PORT1);

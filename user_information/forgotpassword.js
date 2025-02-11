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
app.use(cors({
    origin: process.env.FRONTEND_URL, // Ensure this matches your frontend URL
    credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

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

// Nodemailer Transport Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // or 587
    secure: true, // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password, not your real password
    },
    logger: true, // Enable logging
    debug: true,  // Debugging output
});

// Verify Nodemailer Connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Nodemailer verification failed:', error);
    } else {
        console.log('✅ Nodemailer is ready to send emails');
    }
});

// Forgot Password API
app.post('/forgot-password', async (req, res) => {
    console.log('ENV VARIABLES:', process.env);
    console.log('📩 Email User:', process.env.EMAIL_USER);
    const { email } = req.body;

    console.log(`🔍 Received forgot password request for: ${email}`);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.warn(`⚠️ No user found with email: ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user signed up with Google (password is null)
        if (!user.password) {
            return res.status(400).json({ message: "Password reset is not available for Google login users. Try logging in with Google instead." });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        // Construct Reset Link
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        console.log(`🔗 Reset link generated: ${resetLink}`);

        // Send Reset Email
        const mailOptions = {
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email', error: error.toString() });
            }
            console.log(`📧 Email sent: ${info.response}`);
            res.status(200).json({ message: 'Password reset link sent to your email.' });
        });
    } catch (error) {
        console.error('❌ Error during forgot password process:', error);
        res.status(500).json({ message: 'An error occurred during the process.' });
    }
});

// Reset Password API
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!user) {
            console.warn('⚠️ Invalid or expired token.');
            return res.status(400).json({ message: 'Please go to the forgot password page again for resetting the password.' });
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`🔑 Hashed Password: ${hashedPassword}`);  // Debugging

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        
        await user.save();

        // Confirm if the user document has been updated
        const updatedUser = await User.findById(user._id);
        console.log(`✅ Updated User Password: ${updatedUser.password}`);  // Check if password is updated

        console.log('✅ Password reset successfully');
        res.status(200).json({ message: 'Password successfully reset.' });
    } catch (error) {
        console.error('❌ Error during reset password:', error);
        res.status(500).json({ message: 'An error occurred during the process.' });
    }
});

// Start Server
const PORT = process.env.PORT1;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

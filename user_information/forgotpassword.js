const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Validate Environment Variables
const requiredEnvVars = ['MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_URL', 'PORT'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`❌ Missing environment variable: ${varName}`);
        process.exit(1);
    }
});

// Create Express App
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(helmet()); // Security middleware
app.use(morgan('dev')); // Logging middleware

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
});
const User = mongoose.model('User', userSchema);

// Nodemailer Transport Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((error) => {
    if (error) {
        console.error('❌ Nodemailer verification failed:', error);
        process.exit(1);
    } else {
        console.log('✅ Nodemailer is ready to send emails');
    }
});

// Forgot Password API
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`🔍 Forgot password request for: ${email}`);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.warn(`⚠️ No user found with email: ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.password) {
            return res.status(400).json({ message: "Password reset is not available for Google login users." });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log(`🔗 Reset link: ${resetLink}`);

        const mailOptions = {
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you did not request this, ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully');

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ message: 'An error occurred.' });
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
            console.warn('⚠️ Invalid or expired token.');
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        console.log('✅ Password reset successfully');
        res.status(200).json({ message: 'Password successfully reset.' });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// Start Server
const PORT = process.env.PORT1;
app.listen(PORT, () => console.log(`🚀 Server running`));

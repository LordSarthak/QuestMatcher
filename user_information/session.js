// const express = require('express');
// const session = require('express-session');
// const cors = require('cors');

// const crypto = require('crypto');
// const secretKey = crypto.randomBytes(32).toString('hex'); // 256-bit key
// console.log(secretKey);

// const app = express();

// const corsOptions = {
//     origin: 'http://localhost:5173', // Replace with your frontend origin
//     credentials: true, // Allow cookies and credentials
// };

// app.use(cors(corsOptions));

// app.use(express.json());
// app.use(session({
//     secret: process.env.SECRET_KEY, // Replace with a strong secret
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         maxAge: 24 * 60 * 60 * 1000, // 24 hours
//         httpOnly: true,
//         secure: false, // Set `true` in production with HTTPS
//     },
// }));

// // Simulate a user database
// const users = [{ username: 'testuser', password: 'password123' }];

// // Login Route
// app.post('/login', (req, res) => {
//     const { username, password } = req.body;
//     const user = users.find(u => u.username === username && u.password === password);

//     if (user) {
//         req.session.user = { username }; // Save user in session
//         res.status(200).json({ message: 'Login successful', user: { username } });
//     } else {
//         res.status(401).json({ message: 'Invalid username or password' });
//     }
// });

// // Check Session Route
// app.get('/session', (req, res) => {
//     if (req.session.user) {
//         res.status(200).json({ user: req.session.user });
//     } else {
//         res.status(401).json({ message: 'No active session' });
//     }
// });

// // Logout Route
// app.post('/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             res.status(500).json({ message: 'Error logging out' });
//         } else {
//             res.clearCookie('connect.sid'); // Clear session cookie
//             res.status(200).json({ message: 'Logout successful' });
//         }
//     });
// });

// const PORT = 6000; // Change to a safe port
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const jwt = require("jsonwebtoken");

// Register a new user
const registerUser = async (req, res) => {
    const { name, email, password, role} = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({
            name,
            email,
            role,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Registartion failed!", error: error.message });
    }
};

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            config.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "User logged in successfully",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed!", error: error.message });
    }
};

module.exports = {registerUser, loginUser};
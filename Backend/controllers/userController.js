const User = require('../../shared/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../config/config');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.string().trim().email('valid email is required'),
  password: z.string().min(6, 'password must be at least 6 characters')
});

const officerSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.string().trim().email('valid email is required'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional()
});

const registerUser = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || 'Invalid input data'
      });
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: 'citizen',
      password: hashedPassword
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const createOfficer = async (req, res, next) => {
  try {
    const parsed = officerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || 'Invalid officer data'
      });
    }

    const { name, email, password, phone, address } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const officer = await User.create({
      name,
      email: email.toLowerCase(),
      role: 'officer',
      password: hashedPassword,
      phone,
      address
    });

    res.status(201).json({
      message: 'Officer created successfully',
      user: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const getOfficers = async (req, res, next) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('-password');
    res.status(200).json({
      message: 'Officers retrieved',
      count: officers.length,
      officers
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  createOfficer,
  getOfficers
};
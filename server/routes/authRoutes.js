import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customerRepository } from '../repositories/customerRepository.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bitebox_dev_jwt_secret_academic_2026_xyz';
const JWT_EXPIRY = '24h';

// Helper to generate JWT token
function generateToken(customer) {
  return jwt.sign(
    { id: customer.id, email: customer.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Input sanitization helper
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

// Helper to sanitize customer payload for client
function formatUserResponse(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || '',
    address: customer.default_address || ''
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, identifier, password, defaultAddress } = req.body;

    // Validate and sanitize inputs
    const cleanName = sanitizeString(name);
    const cleanId = sanitizeString(identifier).toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanAddress = sanitizeString(defaultAddress);

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }

    if (!cleanId) {
      return res.status(400).json({ error: 'Please enter an email address or 10-digit mobile number.' });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId);
    const isPhone = /^[6-9]\d{9}$/.test(cleanId);
    if (!isEmail && !isPhone) {
      return res.status(400).json({ error: 'Please provide a valid email (e.g. name@domain.com) or 10-digit mobile number.' });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if customer already exists
    const existing = customerRepository.findByEmailOrPhone(cleanId);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email/phone already exists. Please log in.' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const email = isEmail ? cleanId : `${cleanId}@customer.bitebox.local`;
    const phone = isPhone ? cleanId : null;

    const newCustomer = customerRepository.create({
      name: cleanName,
      email,
      phone,
      passwordHash,
      defaultAddress: cleanAddress || null
    });

    const token = generateToken(newCustomer);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: formatUserResponse(newCustomer)
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const cleanId = sanitizeString(identifier).toLowerCase();
    const cleanPassword = (password || '').trim();

    // Generic error message for any login failure
    if (!cleanId || !cleanPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const customer = customerRepository.findByEmailOrPhone(cleanId);
    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(cleanPassword, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(customer);
    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: formatUserResponse(customer)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me (Verify active token and session)
router.get('/me', authMiddleware, (req, res) => {
  return res.status(200).json({
    user: formatUserResponse(req.user)
  });
});

// PATCH /api/auth/location (Update saved address)
router.patch('/location', authMiddleware, (req, res) => {
  const { address } = req.body;
  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Address cannot be empty.' });
  }

  const updated = customerRepository.updateDefaultAddress(req.user.id, address);
  return res.status(200).json({
    message: 'Delivery address updated.',
    user: formatUserResponse(updated)
  });
});

// GET /api/auth/test-expired-token (Testing endpoint for evaluating expired token behavior)
router.get('/test-expired-token', (req, res) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  const expiredToken = jwt.sign(
    { id: 1, email: 'aniket@bitebox.com', exp: Math.floor(Date.now() / 1000) - 3600 },
    JWT_SECRET
  );
  return res.status(200).json({
    message: 'Generated expired token for testing',
    token: expiredToken
  });
});

export default router;

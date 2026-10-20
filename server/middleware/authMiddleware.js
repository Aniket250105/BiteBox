import jwt from 'jsonwebtoken';
import { customerRepository } from '../repositories/customerRepository.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bitebox_dev_jwt_secret_academic_2026_xyz');
    const customer = customerRepository.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({ error: 'User account not found or has been removed.' });
    }

    req.user = customer;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

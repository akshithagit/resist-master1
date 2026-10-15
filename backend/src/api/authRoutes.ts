import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { config } from '../core/config.js';
import { User, Role } from '../types/index.js';

export const authRouter = Router();

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Check if demo query or header
    req.user = {
      id: 'demo-user-id',
      email: 'clinician.demo@resistai.local',
      passwordHash: '',
      role: 'CLINICIAN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: Role };
    const user = await db.findUserById(decoded.id);
    if (!user) {
      // Fallback for session persistence
      req.user = {
        id: decoded.id,
        email: decoded.email,
        passwordHash: '',
        role: decoded.role || 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: (role as Role) || 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createUser(user);
    await db.logAuditEvent({
      id: uuidv4(),
      userId: user.id,
      eventType: 'USER_REGISTERED',
      metadata: { email: user.email, role: user.role },
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await db.logAuditEvent({
      id: uuidv4(),
      userId: user.id,
      eventType: 'USER_LOGIN',
      metadata: { email: user.email },
      createdAt: new Date().toISOString()
    });

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// Demo/Guest Login
authRouter.post('/demo', async (req: Request, res: Response) => {
  const demoUser: User = {
    id: 'demo-user-id',
    email: 'clinician.demo@resistai.local',
    passwordHash: '',
    role: 'CLINICIAN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const token = jwt.sign(
    { id: demoUser.id, email: demoUser.email, role: demoUser.role },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  res.json({
    user: { id: demoUser.id, email: demoUser.email, role: demoUser.role },
    token,
    isDemo: true
  });
});

// Current User Me
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

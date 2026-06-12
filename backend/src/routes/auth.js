const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');
const { jwtSecret, jwtExpiresIn } = require('../config');
const { authenticate } = require('../middleware/auth');
const { subnetForUser } = require('../services/vpnService');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    points: user.points,
    streak: user.streak,
    vpnSubnet: user.vpnSubnet,
  };
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        username: parsed.data.username,
        passwordHash,
      },
    });
    const vpnSubnet = subnetForUser(user.id);
    const updated = await prisma.user.update({ where: { id: user.id }, data: { vpnSubnet } });
    res.status(201).json({ token: sign(updated), user: publicUser(updated) });
  } catch {
    res.status(409).json({ error: 'Email or username already exists' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get('/me', authenticate, async (req, res) => {
  const completedRooms = await prisma.roomProgress.count({ where: { userId: req.user.id, completed: true } });
  const completedTasks = await prisma.taskProgress.count({ where: { userId: req.user.id, completed: true } });
  res.json({ user: req.user, stats: { completedRooms, completedTasks } });
});

module.exports = router;


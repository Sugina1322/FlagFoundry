const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { hashFlag } = require('../utils/flags');

const router = express.Router();
router.use(authenticate, requireAdmin);

const roomSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  type: z.enum(['LINUX_FUNDAMENTALS', 'WEB_EXPLOITATION', 'PRIVILEGE_ESCALATION', 'CTF_CHALLENGE']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'INSANE']),
  points: z.number().int().min(1).max(10000),
  dockerImage: z.string().min(3),
  learningPathId: z.string().optional().nullable(),
  flagValue: z.string().optional(),
});

router.get('/rooms', async (_req, res) => {
  const rooms = await prisma.room.findMany({
    include: { tasks: { orderBy: { order: 'asc' } }, flags: true, learningPath: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ rooms });
});

router.post('/rooms', async (req, res) => {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { flagValue, ...data } = parsed.data;
  const room = await prisma.room.create({
    data: {
      ...data,
      flags: flagValue
        ? { create: [{ label: 'Root flag', valueHash: hashFlag(flagValue), points: data.points }] }
        : undefined,
    },
  });
  res.status(201).json({ room });
});

router.put('/rooms/:id', async (req, res) => {
  const parsed = roomSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { flagValue, ...data } = parsed.data;
  const room = await prisma.room.update({ where: { id: req.params.id }, data });
  if (flagValue) {
    await prisma.flag.create({
      data: { roomId: room.id, label: 'Admin configured flag', valueHash: hashFlag(flagValue), points: room.points },
    });
  }
  res.json({ room });
});

router.delete('/rooms/:id', async (req, res) => {
  await prisma.room.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

const taskSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(3),
  order: z.number().int().min(1),
  points: z.number().int().min(0).max(1000).default(10),
});

router.post('/rooms/:roomId/tasks', async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const task = await prisma.task.create({ data: { ...parsed.data, roomId: req.params.roomId } });
  res.status(201).json({ task });
});

router.get('/writeups', async (_req, res) => {
  const writeups = await prisma.writeup.findMany({
    include: { user: { select: { username: true } }, room: { select: { title: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ writeups });
});

router.post('/writeups/:id/approve', async (req, res) => {
  const writeup = await prisma.writeup.update({ where: { id: req.params.id }, data: { approved: true } });
  res.json({ writeup });
});

module.exports = router;


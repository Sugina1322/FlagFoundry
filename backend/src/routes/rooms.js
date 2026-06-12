const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const { hashFlag, isFlagFormat } = require('../utils/flags');
const { startLab, stopLab } = require('../services/dockerService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const rooms = await prisma.room.findMany({
    include: {
      learningPath: true,
      tasks: { orderBy: { order: 'asc' }, include: { hints: { orderBy: { order: 'asc' } } } },
      progress: { where: { userId: req.user.id } },
      instances: { where: { userId: req.user.id }, orderBy: { startedAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ rooms });
});

router.get('/paths', authenticate, async (req, res) => {
  const paths = await prisma.learningPath.findMany({
    include: {
      rooms: {
        include: { progress: { where: { userId: req.user.id } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });
  res.json({ paths });
});

router.get('/:slug', authenticate, async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { slug: req.params.slug },
    include: {
      learningPath: true,
      tasks: {
        orderBy: { order: 'asc' },
        include: {
          hints: {
            orderBy: { order: 'asc' },
            include: { unlocks: { where: { userId: req.user.id } } },
          },
          progress: { where: { userId: req.user.id } },
        },
      },
      flags: { select: { id: true, label: true, points: true } },
      instances: { where: { userId: req.user.id }, orderBy: { startedAt: 'desc' }, take: 1 },
      writeups: { where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

router.post('/:slug/start', authenticate, async (req, res) => {
  const room = await prisma.room.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const instance = await startLab(req.user, room);
  res.status(instance.status === 'ERROR' ? 500 : 201).json({ instance });
});

router.post('/instances/:id/stop', authenticate, async (req, res) => {
  const instance = await stopLab(req.user.id, req.params.id);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });
  res.json({ instance });
});

router.post('/:slug/tasks/:taskId/complete', authenticate, async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: req.params.taskId, room: { slug: req.params.slug } } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const existing = await prisma.taskProgress.findUnique({
    where: { userId_taskId: { userId: req.user.id, taskId: task.id } },
  });
  if (existing?.completed) return res.json({ progress: existing, awarded: 0, alreadyCompleted: true });

  const completedAt = new Date();
  const [progress] = await prisma.$transaction([
    prisma.taskProgress.upsert({
      where: { userId_taskId: { userId: req.user.id, taskId: task.id } },
      update: { completed: true, completedAt },
      create: { userId: req.user.id, taskId: task.id, completed: true, completedAt },
    }),
    prisma.user.update({ where: { id: req.user.id }, data: { points: { increment: task.points } } }),
  ]);
  res.json({ progress, awarded: task.points, alreadyCompleted: false });
});

router.post('/:slug/hints/:hintId/unlock', authenticate, async (req, res) => {
  const hint = await prisma.hint.findFirst({
    where: { id: req.params.hintId, task: { room: { slug: req.params.slug } } },
  });
  if (!hint) return res.status(404).json({ error: 'Hint not found' });
  const existing = await prisma.hintUnlock.findUnique({
    where: { userId_hintId: { userId: req.user.id, hintId: hint.id } },
  });
  if (!existing) {
    await prisma.$transaction([
      prisma.hintUnlock.create({ data: { userId: req.user.id, hintId: hint.id } }),
      prisma.user.update({ where: { id: req.user.id }, data: { points: { decrement: hint.cost } } }),
    ]);
  }
  res.json({ hint, charged: !existing, alreadyUnlocked: Boolean(existing) });
});

const flagSchema = z.object({ value: z.string().min(6).max(160) });

router.post('/:slug/flags/submit', authenticate, async (req, res) => {
  const parsed = flagSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!isFlagFormat(parsed.data.value)) return res.status(400).json({ error: 'Invalid flag format' });

  const flags = await prisma.flag.findMany({ where: { room: { slug: req.params.slug } }, include: { room: true } });
  const submittedHash = hashFlag(parsed.data.value);
  const matched = flags.find((flag) => flag.valueHash === submittedHash);
  const flag = matched || flags[0];
  if (!flag) return res.status(404).json({ error: 'No flags configured for room' });

  const alreadyCorrect = await prisma.flagSubmission.findFirst({
    where: { userId: req.user.id, flagId: flag.id, correct: true },
  });

  await prisma.flagSubmission.create({
    data: { userId: req.user.id, flagId: flag.id, value: parsed.data.value, correct: Boolean(matched) },
  });

  if (matched && !alreadyCorrect) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: req.user.id }, data: { points: { increment: matched.points }, streak: { increment: 1 } } }),
      prisma.roomProgress.upsert({
        where: { userId_roomId: { userId: req.user.id, roomId: matched.roomId } },
        update: { completed: true, completedAt: new Date() },
        create: { userId: req.user.id, roomId: matched.roomId, completed: true, completedAt: new Date() },
      }),
    ]);
  }

  res.json({ correct: Boolean(matched), alreadyCorrect: Boolean(alreadyCorrect) });
});

const writeupSchema = z.object({ title: z.string().min(3).max(120), body: z.string().min(20).max(20000) });

router.post('/:slug/writeups', authenticate, async (req, res) => {
  const parsed = writeupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const room = await prisma.room.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const writeup = await prisma.writeup.create({
    data: { userId: req.user.id, roomId: room.id, title: parsed.data.title, body: parsed.data.body },
  });
  res.status(201).json({ writeup });
});

module.exports = router;

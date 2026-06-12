const express = require('express');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const { generateClientConfig } = require('../services/vpnService');

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  const [completedRooms, completedTasks, runningLabs, recentProgress] = await Promise.all([
    prisma.roomProgress.findMany({
      where: { userId: req.user.id, completed: true },
      include: { room: true },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.taskProgress.count({ where: { userId: req.user.id, completed: true } }),
    prisma.labInstance.findMany({
      where: { userId: req.user.id, status: 'RUNNING' },
      include: { room: true },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.flagSubmission.findMany({
      where: { userId: req.user.id, correct: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { flag: { include: { room: true } } },
    }),
  ]);
  const rank = (await prisma.user.count({ where: { points: { gt: req.user.points } } })) + 1;
  res.json({ user: req.user, rank, completedRooms, completedTasks, runningLabs, recentProgress });
});

router.get('/leaderboard', async (_req, res) => {
  const users = await prisma.user.findMany({
    take: 25,
    orderBy: [{ points: 'desc' }, { streak: 'desc' }],
    select: { id: true, username: true, points: true, streak: true, role: true },
  });
  res.json({ users });
});

router.get('/vpn-config', authenticate, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
  const bundle = await generateClientConfig(user);
  res.setHeader('Content-Type', 'application/x-openvpn-profile');
  res.setHeader('Content-Disposition', `attachment; filename="${bundle.filename}"`);
  res.send(bundle.config);
});

module.exports = router;


// src/routes/index.ts
import express from 'express';
import { UserRoutes } from '../app/modules/user/user.route';

const router = express.Router();

const apiRoutes = [
  { path: '/auth', route: UserRoutes }, // Changed to /auth for consistency
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;

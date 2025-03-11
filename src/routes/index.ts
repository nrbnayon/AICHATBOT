import express from 'express';
import { UserRoutes } from '../app/modules/user/user.route';

const router = express.Router();

const apiRoutes = [{ path: '/user', route: UserRoutes }];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;

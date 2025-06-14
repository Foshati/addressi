import { Router } from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated';
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from '../controllers/linktree-profile.controller';
import {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from '../controllers/linktree-link.controller';
import { trackAnalytics, getAnalytics } from '../controllers/linktree-analytics.controller';

const router = Router();

// Profile routes
router.get('/profile', isAuthenticated, getProfile);
router.put('/profile', isAuthenticated, updateProfile);
router.delete('/profile', isAuthenticated, deleteProfile);

// Link routes
router.get('/links', isAuthenticated, getLinks);
router.post('/links', isAuthenticated, createLink);
router.put('/links/:id', isAuthenticated, updateLink);
router.delete('/links/:id', isAuthenticated, deleteLink);
router.post('/links/reorder', isAuthenticated, reorderLinks);

// Analytics routes
router.post('/analytics', isAuthenticated, trackAnalytics);
router.get('/analytics', isAuthenticated, getAnalytics);

export default router;

import { Router } from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated';
import {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
} from '../controllers/social-link.controller';

const router = Router();

// All routes are protected
router.use(isAuthenticated);

// Route to get all social links and create a new one
router.route('/')
  .get(getSocialLinks)
  .post(createSocialLink);

// Special route for reordering
router.put('/reorder', reorderSocialLinks);

// Routes to update and delete a specific social link
router.route('/:id')
  .put(updateSocialLink)
  .delete(deleteSocialLink);

export default router;

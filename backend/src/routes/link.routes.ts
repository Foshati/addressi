import express, { Router } from 'express';
import {
  createLink,
  deleteLink,
  getLink,
  getLinkStats,
  getMyLinks,
  getPublicLinks,
  updateLink,
} from '../controllers/link.controller';
import { isAuthenticated } from '../middleware/isAuthenticated';

const Linkrouter: Router = express.Router();

// Routes for authenticated users
Linkrouter.post('/', isAuthenticated, createLink);
Linkrouter.get('/my-links', isAuthenticated, getMyLinks);
Linkrouter.get('/stats', isAuthenticated, getLinkStats);
Linkrouter.put('/:id', isAuthenticated, updateLink);
Linkrouter.delete('/:id', isAuthenticated, deleteLink);

// Public routes
Linkrouter.get('/public-links', getPublicLinks);
Linkrouter.get('/:slug', getLink); // This must be last to avoid capturing other routes

export default Linkrouter;
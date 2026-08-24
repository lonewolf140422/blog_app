import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { removeComment } from '../controllers/comment.controller.js';

const router = Router();

router.delete('/:id', requireAuth, asyncHandler(removeComment));

export default router;

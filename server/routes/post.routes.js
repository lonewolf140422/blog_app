import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  createPost,
  editPost,
  getPost,
  listMyPosts,
  listPosts,
  removePost,
} from '../controllers/post.controller.js';
import { vote } from '../controllers/vote.controller.js';
import { addComment, listComments } from '../controllers/comment.controller.js';

const router = Router();

// '/mine' must be declared before '/:id' or it would be read as an id.
router.get('/mine', requireAuth, asyncHandler(listMyPosts));

router.get('/', optionalAuth, asyncHandler(listPosts));
router.post('/', requireAuth, asyncHandler(createPost));

router.get('/:id', optionalAuth, asyncHandler(getPost));
router.put('/:id', requireAuth, asyncHandler(editPost));
router.delete('/:id', requireAuth, asyncHandler(removePost));

router.post('/:id/vote', requireAuth, asyncHandler(vote));

router.get('/:id/comments', optionalAuth, asyncHandler(listComments));
router.post('/:id/comments', requireAuth, asyncHandler(addComment));

export default router;

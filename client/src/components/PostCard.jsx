import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons.jsx';
import { VisibilityBadge, timeAgo } from './ui.jsx';

export default function PostCard({ post, action }) {
  return (
    <article className="card">
      <VoteButtons postId={post.id} score={post.score} myVote={post.my_vote} />

      <div className="card__body">
        <Link className="card__title" to={`/post/${post.id}`}>
          {post.title}
        </Link>

        <p className="card__excerpt">{post.excerpt || post.content}</p>

        <div className="card__meta">
          <span className="author">@{post.author}</span>
          <span className="dot">{timeAgo(post.created_at)}</span>
          <span className="dot">
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </span>
          <VisibilityBadge visibility={post.visibility} />
          {action}
        </div>
      </div>
    </article>
  );
}

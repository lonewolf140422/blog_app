import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import VoteButtons from '../components/VoteButtons.jsx';
import ShareButton from '../components/ShareButton.jsx';
import CommentSection from '../components/CommentSection.jsx';
import { useToast } from '../components/Toast.jsx';
import { CacheBadge, Empty, Spinner, VisibilityBadge, timeAgo } from '../components/ui.jsx';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast] = useToast();

  const [post, setPost] = useState(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getPost(id)
      .then((data) => {
        if (!active) return;
        setPost(data.post);
        setCached(data.cached);
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this post? Its comments and votes go with it.')) return;
    setDeleting(true);
    try {
      await api.deletePost(id);
      navigate('/');
    } catch (err) {
      window.alert(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;

  if (error) {
    const isPrivate = error.status === 403;
    return (
      <Empty
        title={isPrivate ? 'This post is private' : 'Post not found'}
        message={
          isPrivate
            ? 'Its author has not published it. Only they can open this link.'
            : 'The link may be broken, or the post has since been deleted.'
        }
        actionTo="/"
        actionLabel="Back to the feed"
      />
    );
  }

  const isAuthor = user?.id === post.author_id;

  return (
    <article>
      <header className="article__head">
        <h1 className="article__title">{post.title}</h1>
        <div className="article__meta">
          <span style={{ color: 'var(--muted)' }}>@{post.author}</span>
          <span className="dot">{timeAgo(post.created_at)}</span>
          {post.updated_at !== post.created_at && <span className="dot">edited</span>}
          <VisibilityBadge visibility={post.visibility} />
          <CacheBadge cached={cached} />
        </div>
      </header>

      <div className="article__body">{post.content}</div>

      <div className="article__actions">
        <VoteButtons
          postId={post.id}
          score={post.score}
          myVote={post.my_vote}
          layout="row"
          onChange={({ score, myVote }) => setPost((p) => ({ ...p, score, my_vote: myVote }))}
        />

        <ShareButton postId={post.id} onCopied={showToast} />

        <span className="spacer" />

        {isAuthor && (
          <>
            <Link className="btn btn--ghost btn--sm" to={`/post/${post.id}/edit`}>
              Edit
            </Link>
            <button
              type="button"
              className="btn btn--quiet btn--danger"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        )}
      </div>

      <CommentSection
        postId={post.id}
        postAuthorId={post.author_id}
        onCountChange={(n) => setPost((p) => ({ ...p, comment_count: n }))}
      />

      {toast}
    </article>
  );
}

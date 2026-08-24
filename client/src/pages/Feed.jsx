import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import { Alert, CacheBadge, Empty, Skeleton } from '../components/ui.jsx';

const PAGE_SIZE = 10;

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, hasMore: false, cached: false });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listPosts({ page, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setPosts((prev) => (page === 1 ? data.posts : [...prev, ...data.posts]));
        setMeta({ total: data.total, hasMore: data.hasMore, cached: data.cached });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <header className="hero">
        <span className="hero__eyebrow">
          <strong>{meta.total} posts</strong>
          <span>from the community</span>
        </span>

        <h1>
          Writing that feels
          <br />
          like a <em>conversation.</em>
        </h1>

        <p>
          A small community for people who write. Publish openly, keep a draft to yourself, and
          argue politely in the comments.
        </p>

        <div className="hero__actions">
          {user ? (
            <Link className="btn btn--primary" to="/new">
              Write a post
            </Link>
          ) : (
            <>
              <Link className="btn btn--primary" to="/register">
                Start writing
              </Link>
              <Link className="btn btn--ghost" to="/login">
                Log in →
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="row row--between" style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 20 }}>Latest</h2>
        <CacheBadge cached={meta.cached} />
      </div>

      <Alert>{error}</Alert>

      {loading && page === 1 ? (
        <Skeleton count={4} />
      ) : posts.length === 0 && !error ? (
        <Empty
          title="Nothing here yet"
          message="No one has published a public post. You could be the first."
          actionTo={user ? '/new' : '/register'}
          actionLabel={user ? 'Write a post' : 'Create an account'}
        />
      ) : (
        <div className="feed">
          {posts.map((post) => (
            <PostCard post={post} key={post.id} />
          ))}
        </div>
      )}

      {meta.hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );
}

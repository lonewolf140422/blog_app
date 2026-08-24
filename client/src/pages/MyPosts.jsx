import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import { Alert, Empty, Skeleton } from '../components/ui.jsx';

export default function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myPosts()
      .then((data) => setPosts(data.posts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const publicCount = posts.filter((p) => p.visibility === 'public').length;

  return (
    <>
      <header className="page-head">
        <h1>My posts</h1>
        <p>
          Signed in as @{user.username} · {publicCount} public, {posts.length - publicCount} private
        </p>
      </header>

      <Alert>{error}</Alert>

      {loading ? (
        <Skeleton count={3} />
      ) : posts.length === 0 ? (
        <Empty
          title="You have not written anything yet"
          message="Your published posts and private drafts will both live here."
          actionTo="/new"
          actionLabel="Write your first post"
        />
      ) : (
        <div className="feed">
          {posts.map((post) => (
            <PostCard
              post={post}
              key={post.id}
              action={
                <Link className="card__edit dot" to={`/post/${post.id}/edit`}>
                  Edit
                </Link>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}

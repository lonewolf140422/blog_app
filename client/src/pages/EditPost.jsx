import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostForm from '../components/PostForm.jsx';
import { Empty, Spinner } from '../components/ui.jsx';

export default function EditPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getPost(id)
      .then((data) => setPost(data.post))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (error || post.author_id !== user.id) {
    return (
      <Empty
        title="You cannot edit this post"
        message="It belongs to someone else, or it no longer exists."
        actionTo="/me"
        actionLabel="Back to my posts"
      />
    );
  }

  return (
    <>
      <header className="page-head">
        <h1>Edit post</h1>
        <p>Changes go live as soon as you save, and the cached copy is refreshed.</p>
      </header>

      <PostForm
        initial={post}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await api.updatePost(id, values);
          navigate(`/post/${id}`);
        }}
      />
    </>
  );
}

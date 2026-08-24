import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import PostForm from '../components/PostForm.jsx';

export default function CreatePost() {
  const navigate = useNavigate();

  return (
    <>
      <header className="page-head">
        <h1>Write a post</h1>
        <p>Publish it to the community, or keep it private while it is still a draft.</p>
      </header>

      <PostForm
        submitLabel="Publish"
        onSubmit={async (values) => {
          const { post } = await api.createPost(values);
          navigate(`/post/${post.id}`);
        }}
      />
    </>
  );
}

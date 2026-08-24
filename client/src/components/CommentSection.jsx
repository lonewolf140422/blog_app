import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Avatar, timeAgo } from './ui.jsx';

export default function CommentSection({ postId, postAuthorId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listComments(postId)
      .then((data) => active && setComments(data.comments))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError('');
    try {
      const { comment } = await api.addComment(postId, text);
      setComments((prev) => [...prev, comment]);
      onCountChange?.(comments.length + 1);
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCountChange?.(comments.length - 1);
    } catch (err) {
      setError(err.message);
    }
  }

  // A comment can be removed by whoever wrote it, or by the post's author.
  const canDelete = (c) => user && (c.user_id === user.id || postAuthorId === user.id);

  return (
    <section className="comments">
      <h2 className="comments__title">
        {loading ? 'Comments' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
      </h2>

      {user ? (
        <form className="stack" onSubmit={submit} style={{ marginBottom: 28 }}>
          <textarea
            className="textarea"
            placeholder="Add to the conversation…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <div className="form-actions">
            <button className="btn btn--primary btn--sm" type="submit" disabled={!body.trim() || sending}>
              {sending ? 'Posting…' : 'Post comment'}
            </button>
            <span className="field__hint">{1000 - body.length} characters left</span>
          </div>
        </form>
      ) : (
        <p className="field__hint" style={{ marginBottom: 24 }}>
          <Link to="/login" style={{ textDecoration: 'underline', color: 'var(--muted)' }}>
            Sign in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      <Alert>{error}</Alert>

      {!loading && comments.length === 0 && (
        <p className="field__hint">No comments yet — be the first.</p>
      )}

      {comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment__head">
            <Avatar name={c.author} />
            <span className="comment__author">@{c.author}</span>
            <span className="dot">{timeAgo(c.created_at)}</span>
            {canDelete(c) && (
              <>
                <span className="spacer" />
                <button type="button" className="btn btn--quiet btn--danger" onClick={() => remove(c.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
          <p className="comment__body">{c.body}</p>
        </div>
      ))}
    </section>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from './ui.jsx';

export default function PostForm({ initial, submitLabel, onSubmit }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [visibility, setVisibility] = useState(initial?.visibility ?? 'public');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;

    if (!title.trim() || !content.trim()) {
      setError('A title and some content are both required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), visibility });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Alert>{error}</Alert>

      <input
        className="input input--title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        autoFocus
      />

      <textarea
        className="textarea textarea--tall"
        placeholder="Write your post… Blank lines become paragraphs."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="field">
        <label htmlFor="visibility-toggle">Who can see this?</label>
        <div className="toggle" id="visibility-toggle">
          <button
            type="button"
            className={visibility === 'public' ? 'is-on' : ''}
            onClick={() => setVisibility('public')}
          >
            Public
          </button>
          <button
            type="button"
            className={visibility === 'private' ? 'is-on' : ''}
            onClick={() => setVisibility('private')}
          >
            Private
          </button>
        </div>
        <span className="field__hint">
          {visibility === 'public'
            ? 'Everyone in the community can read, vote and comment on this.'
            : 'Only you can see this. It stays out of the feed, and shared links will not open for anyone else.'}
        </span>
      </div>

      <div className="form-actions">
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="btn btn--ghost" type="button" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const Arrow = ({ up }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d={up ? 'M8 3.5 14 11H2z' : 'M8 12.5 2 5h12z'}
      fill="currentColor"
    />
  </svg>
);

export default function VoteButtons({ postId, score, myVote, layout = 'column', onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ score, myVote });
  const [busy, setBusy] = useState(false);

  const [seen, setSeen] = useState({ score, myVote });
  if (seen.score !== score || seen.myVote !== myVote) {
    setSeen({ score, myVote });
    setState({ score, myVote });
  }

  async function cast(value) {
    if (!user) return navigate('/login');
    if (busy) return;

    const previous = state;
    const nextVote = state.myVote === value ? 0 : value;
    setState({ score: state.score - state.myVote + nextVote, myVote: nextVote });
    setBusy(true);

    try {
      const res = await api.vote(postId, value);
      const settled = { score: res.score, myVote: res.my_vote };
      setState(settled);
      onChange?.(settled);
    } catch {
      setState(previous);
    } finally {
      setBusy(false);
    }
  }

  const tone = state.score > 0 ? 'is-up' : state.score < 0 ? 'is-down' : '';

  return (
    <div className={layout === 'row' ? 'vote vote--row' : 'vote'}>
      <button
        type="button"
        className={`vote__btn is-up ${state.myVote === 1 ? 'is-on' : ''}`}
        onClick={() => cast(1)}
        disabled={busy}
        aria-label="Upvote"
        aria-pressed={state.myVote === 1}
      >
        <Arrow up />
      </button>
      <span className={`vote__score ${tone}`}>{state.score}</span>
      <button
        type="button"
        className={`vote__btn is-down ${state.myVote === -1 ? 'is-on' : ''}`}
        onClick={() => cast(-1)}
        disabled={busy}
        aria-label="Downvote"
        aria-pressed={state.myVote === -1}
      >
        <Arrow up={false} />
      </button>
    </div>
  );
}

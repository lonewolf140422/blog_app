import { Link } from 'react-router-dom';

export const Spinner = () => <div className="spinner" aria-label="Loading" />;

export const Skeleton = ({ count = 3 }) =>
  Array.from({ length: count }, (_, i) => <div className="skeleton" key={i} />);

export const Alert = ({ children }) =>
  children ? (
    <div className="alert" role="alert">
      {children}
    </div>
  ) : null;

export function Empty({ title, message, actionTo, actionLabel }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{message}</p>
      {actionTo && (
        <Link className="btn btn--primary" to={actionTo}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export const Avatar = ({ name = '?' }) => <span className="avatar">{name.slice(0, 2)}</span>;

export const VisibilityBadge = ({ visibility }) =>
  visibility === 'private' ? <span className="badge badge--private">Private</span> : null;

export const CacheBadge = ({ cached }) => (
  <span className="badge badge--cache" title="Where this response came from">
    {cached ? 'Redis cache' : 'Postgres'}
  </span>
);

export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';

  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
  ];
  for (let i = units.length - 1; i >= 0; i -= 1) {
    const [label, size] = units[i];
    const n = Math.floor(seconds / size);
    if (n >= 1) {
      if (label === 'day' && n > 6) {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      return `${n} ${label}${n > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6.5 9.5a2.5 2.5 0 0 0 3.6 0l2.4-2.4a2.55 2.55 0 0 0-3.6-3.6l-.9.9M9.5 6.5a2.5 2.5 0 0 0-3.6 0L3.5 8.9a2.55 2.55 0 0 0 3.6 3.6l.9-.9"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export default function ShareButton({ postId, onCopied }) {
  async function share() {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      onCopied?.('Link copied to clipboard');
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={share}>
      <LinkIcon />
      Share
    </button>
  );
}

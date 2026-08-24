import { Empty } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <Empty
      title="Page not found"
      message="That link does not lead anywhere on Inkwell."
      actionTo="/"
      actionLabel="Back to the feed"
    />
  );
}

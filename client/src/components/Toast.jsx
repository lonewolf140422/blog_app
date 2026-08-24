import { useEffect, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => setMessage(''), 2200);
    return () => clearTimeout(id);
  }, [message]);

  const toast = message ? <div className="toast">{message}</div> : null;
  return [toast, setMessage];
}

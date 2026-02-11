import { useEffect, useRef } from 'react';

/**
 * Dismisses a popover when clicking outside of it.
 * Uses mousedown (not click) so it fires before active:scale transforms
 * create a containing block that breaks position:fixed backdrops.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
        // Eat the subsequent click to prevent ActionableCard navigation
        const eatClick = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
        };
        document.addEventListener('click', eatClick, { capture: true, once: true });
        // Safety: remove if no click fires (e.g., drag)
        setTimeout(() => document.removeEventListener('click', eatClick, { capture: true }), 200);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, ref]);
}

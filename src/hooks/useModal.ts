import { useEffect } from 'react';

let openModalCount = 0;

/**
 * Shared behaviour for every dialog: Escape closes it, and the page behind it
 * does not scroll while it is open.
 */
export function useModal(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    openModalCount += 1;
    document.documentElement.classList.add('cc-modal-open');

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.documentElement.classList.remove('cc-modal-open');
    };
  }, [isOpen, onClose]);
}

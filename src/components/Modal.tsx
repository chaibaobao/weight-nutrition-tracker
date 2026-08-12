import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;
let lockedScrollY = 0;
let previousBodyStyles: Partial<CSSStyleDeclaration> = {};
let previousHtmlOverflow = '';

function lockPageScroll(): void {
  if (openModalCount++ > 0) return;
  lockedScrollY = window.scrollY;
  previousBodyStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    right: document.body.style.right,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };
  previousHtmlOverflow = document.documentElement.style.overflow;
  Object.assign(document.body.style, { position: 'fixed', top: `-${lockedScrollY}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' });
  document.documentElement.style.overflow = 'hidden';
}

function unlockPageScroll(): void {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount > 0) return;
  Object.assign(document.body.style, previousBodyStyles);
  document.documentElement.style.overflow = previousHtmlOverflow;
  window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'auto' });
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    lockPageScroll();
    const backdrop = backdropRef.current;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (!backdrop) return;
      backdrop.style.setProperty('--modal-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      backdrop.style.setProperty('--modal-viewport-offset-top', `${viewport?.offsetTop ?? 0}px`);
      const active = document.activeElement;
      if (active instanceof HTMLElement && backdrop.contains(active)) {
        window.setTimeout(() => active.scrollIntoView({ block: 'nearest', inline: 'nearest' }), 60);
      }
    };
    const keepFocusedFieldVisible = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement) || !backdrop?.contains(event.target)) return;
      window.setTimeout(() => event.target instanceof HTMLElement && event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' }), 100);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    backdrop?.addEventListener('focusin', keepFocusedFieldVisible);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      backdrop?.removeEventListener('focusin', keepFocusedFieldVisible);
      document.removeEventListener('keydown', closeOnEscape);
      unlockPageScroll();
    };
  }, []);

  return createPortal(<div ref={backdropRef} className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal-sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={22} /></button></header>
      <div className="modal-content">{children}</div>
    </section>
  </div>, document.body);
}

/** Anything that behaves as a modal: while one is in the DOM the page behind it must not scroll. */
const MODALS = '.p-dialog-mask, .p-drawer-mask, .lightbox, .ax-drawer';

/**
 * Locks background scrolling (class `scroll-locked` on <html>, see base.scss) for as long as a modal is open and releases it
 * as soon as the last one is removed. Watching the DOM instead of each component means every current and future popup is covered,
 * including ones PrimeNG creates itself, and the lock can never be left on after a route change or an unusual close path.
 */
export function initScrollLock(): void {
  const root = document.documentElement;
  let queued = false;
  const sync = () => {
    queued = false;
    root.classList.toggle('scroll-locked', !!document.querySelector(MODALS));
  };
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    setTimeout(sync); // not rAF: that is paused in background tabs, which would leave the lock stale
  }).observe(document.body, { childList: true, subtree: true });
}

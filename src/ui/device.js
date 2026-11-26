// ============================================================
//  Detección de dispositivo y gestos táctiles.
//  En ordenador (ratón) todo funciona igual que siempre; en móvil o
//  tablet (pantalla táctil) se activa la interfaz táctil.
//  Para probar la versión móvil en el PC: añade ?movil=1 a la URL.
// ============================================================

const params = typeof location !== 'undefined' ? location.search + location.hash : '';
export const IS_MOBILE = /[?&#]movil=1/.test(params) || (
  typeof matchMedia !== 'undefined'
  && matchMedia('(pointer: coarse)').matches
  && !matchMedia('(pointer: fine)').matches
);

export const IS_IOS = typeof navigator !== 'undefined'
  && /iphone|ipad|ipod/i.test(navigator.userAgent || '');

export const IS_STANDALONE = typeof matchMedia !== 'undefined'
  && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true);

/**
 * Acción "usar" sobre un elemento de la interfaz:
 *  - Ordenador: clic derecho = usar; pasar el ratón = tooltip.
 *  - Móvil: tocar = usar; mantener pulsado = tooltip.
 * tip = { show(evt), hide() } (opcional)
 */
export function bindUse(node, use, tip) {
  if (!IS_MOBILE) {
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); tip?.hide(); use(); });
    if (tip) {
      node.addEventListener('mouseenter', (e) => tip.show(e));
      node.addEventListener('mouseleave', () => tip.hide());
    }
    return;
  }
  bindTap(node, () => { tip?.hide(); use(); }, tip);
}

/** Tocar = acción; mantener pulsado (0,42 s) = tooltip (solo móvil). */
export function bindTap(node, action, tip) {
  let timer = null, long = false;
  node.addEventListener('contextmenu', (e) => e.preventDefault());
  node.addEventListener('pointerdown', (e) => {
    long = false;
    clearTimeout(timer);
    if (tip) timer = setTimeout(() => { long = true; tip.show(e); }, 420);
  });
  const cancel = () => clearTimeout(timer);
  node.addEventListener('pointerup', cancel);
  node.addEventListener('pointercancel', cancel);
  node.addEventListener('pointerleave', cancel);
  node.addEventListener('click', (e) => {
    if (long) { long = false; e.preventDefault(); return; }
    action(e);
  });
}

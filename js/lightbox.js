document.addEventListener('click', e => {
  const img = e.target.closest('.screenshot img');
  if (!img) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';

  const clone = document.createElement('img');
  clone.src = img.src;
  clone.alt = img.alt;
  clone.draggable = false;

  overlay.appendChild(clone);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('lightbox--visible'));

  // After the open animation, disable CSS transitions so zoom is instant
  clone.addEventListener('transitionend', () => {
    clone.style.transition = 'none';
  }, { once: true });

  // Zoom / pan state
  let zoom = 1;
  let panX = 0, panY = 0;
  let dragging = false;
  let dragStartX, dragStartY, panStartX, panStartY;
  let didDrag = false;

  // Pinch state
  const pointers = new Map();
  let pinchStartDist = 0, pinchStartZoom = 1;
  let pinchStartMidX = 0, pinchStartMidY = 0;
  let pinchStartPanX = 0, pinchStartPanY = 0;

  function applyTransform() {
    clone.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    clone.style.cursor = zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
    overlay.style.cursor = zoom > 1 ? (dragging ? 'grabbing' : 'default') : 'zoom-out';
  }

  // Scroll to zoom mot musepeker (desktop)
  overlay.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.min(Math.max(zoom * factor, 1), 10);
    if (newZoom === 1) {
      zoom = 1; panX = 0; panY = 0;
    } else {
      // Hold punktet under musepekeren fast:
      // newPan = cursorFromCenter * (1 - scale) + pan * scale
      const scale = newZoom / zoom;
      const cx = e.clientX - window.innerWidth / 2;
      const cy = e.clientY - window.innerHeight / 2;
      panX = cx * (1 - scale) + panX * scale;
      panY = cy * (1 - scale) + panY * scale;
      zoom = newZoom;
    }
    applyTransform();
  }, { passive: false });

  clone.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    clone.setPointerCapture(e.pointerId);

    if (pointers.size === 2) {
      // Start pinch-to-zoom
      const [p1, p2] = [...pointers.values()];
      pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinchStartZoom = zoom;
      pinchStartMidX = (p1.x + p2.x) / 2;
      pinchStartMidY = (p1.y + p2.y) / 2;
      pinchStartPanX = panX;
      pinchStartPanY = panY;
      dragging = false;
      didDrag = true; // hindrer lukking når fingre slippes etter pinch
    } else if (pointers.size === 1 && zoom > 1) {
      // Start single-finger drag
      dragging = true;
      didDrag = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panStartX = panX;
      panStartY = panY;
    }
    applyTransform();
  });

  clone.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const newZoom = Math.min(Math.max(pinchStartZoom * dist / pinchStartDist, 1), 10);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      panX = pinchStartPanX + (midX - pinchStartMidX);
      panY = pinchStartPanY + (midY - pinchStartMidY);
      if (newZoom === 1) { panX = 0; panY = 0; }
      zoom = newZoom;
      applyTransform();
    } else if (dragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
      panX = panStartX + dx;
      panY = panStartY + dy;
      applyTransform();
    }
  });

  const endPointer = e => {
    pointers.delete(e.pointerId);
    if (pointers.size === 1 && zoom > 1) {
      // En finger løftet under pinch — fortsett som én-fingers-dra
      const [p] = [...pointers.values()];
      dragging = true;
      dragStartX = p.x;
      dragStartY = p.y;
      panStartX = panX;
      panStartY = panY;
      // didDrag forblir true for å hindre lukking
    } else if (pointers.size === 0) {
      dragging = false;
    }
    applyTransform();
  };

  clone.addEventListener('pointerup', endPointer);
  clone.addEventListener('pointercancel', endPointer);

  const close = () => {
    zoom = 1; panX = 0; panY = 0;
    clone.style.transition = '';
    clone.style.transform = '';
    overlay.classList.remove('lightbox--visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };

  overlay.addEventListener('click', e => {
    if (e.target === clone) {
      if (zoom > 1 && didDrag) return;
      if (zoom <= 1) close();
      return;
    }
    close();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });
});

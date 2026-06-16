import { state, updateTransform, rerender, autosave, BOARD } from "./app.js";
import { setPosition, findNode } from "./model.js";

export function initZoom() {
  const vp = document.getElementById("viewport");
  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.min(2.5, Math.max(0.2, state.scale * factor));
    const wx = (cx - state.tx) / state.scale;
    const wy = (cy - state.ty) / state.scale;
    state.scale = newScale;
    state.tx = cx - wx * state.scale;
    state.ty = cy - wy * state.scale;
    updateTransform();
  }, { passive: false });
}

export function initPan() {
  const vp = document.getElementById("viewport");
  let panning = false, startX = 0, startY = 0, originX = 0, originY = 0;
  vp.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".node")) return;
    panning = true; vp.classList.add("is-panning");
    startX = e.clientX; startY = e.clientY; originX = state.tx; originY = state.ty;
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener("pointermove", (e) => {
    if (!panning) return;
    state.tx = originX + (e.clientX - startX);
    state.ty = originY + (e.clientY - startY);
    updateTransform();
  });
  vp.addEventListener("pointerup", (e) => {
    panning = false; vp.classList.remove("is-panning");
    try { vp.releasePointerCapture(e.pointerId); } catch {}
  });
}

export function initNodeDrag() {
  const layer = document.getElementById("node-layer");
  let dragging = null, startX = 0, startY = 0, startDx = 0, startDy = 0, moved = false;

  layer.addEventListener("pointerdown", (e) => {
    const nodeEl = e.target.closest(".node");
    if (!nodeEl) return;
    if (e.target.closest(".node-toggle") || e.target.closest(".node-add")) return;
    const id = nodeEl.dataset.id;
    const node = findNode(state.tree, id);
    if (!node) return;
    dragging = { id, el: nodeEl };
    startX = e.clientX; startY = e.clientY;
    startDx = node.position.dx; startDy = node.position.dy;
    moved = false;
    nodeEl.classList.add("is-dragging");
    nodeEl.setPointerCapture(e.pointerId);
  });

  layer.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = (e.clientX - startX) / state.scale;
    const dy = (e.clientY - startY) / state.scale;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
    setPosition(state.tree, dragging.id, startDx + dx, startDy + dy);
    rerender();
  });

  layer.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging.el.classList.remove("is-dragging");
    try { dragging.el.releasePointerCapture(e.pointerId); } catch {}
    if (moved) autosave();
    dragging = null;
  });
}

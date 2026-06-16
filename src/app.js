import { INITIAL_DATA } from "../data.js";
import { normalizeNode, loadLocal, saveLocal } from "./storage.js";
import { computeStableLayout, getNodeSize } from "./layout.js";
import { walk, findNode } from "./model.js";
import { renderNodes, renderConnections, renderDetail } from "./render.js";
import { initZoom, initPan, initNodeDrag } from "./interactions.js";

export const BOARD = { centerX: 1600, centerY: 1100 };

export const state = {
  tree: loadLocal() || normalizeNode(INITIAL_DATA),
  selectedId: null,
  editMode: false,
  filter: "all",
  search: "",
  expanded: new Set(),
  scale: 0.7,
  tx: 0,
  ty: 0
};
state.expanded.add(state.tree.id);

export function autosave() {
  saveLocal(state.tree);
}

export function getLayout() {
  return computeStableLayout(state.tree, BOARD);
}

export function updateTransform() {
  const board = document.getElementById("board");
  board.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
}

export function isExpanded(id) {
  return state.expanded.has(id);
}

export function toggleExpanded(id) {
  if (state.expanded.has(id)) state.expanded.delete(id);
  else state.expanded.add(id);
  rerender();
}

export function visibleNodes() {
  const result = [];
  function walkVis(node, depth) {
    result.push({ node, depth });
    if (state.expanded.has(node.id)) {
      for (const child of node.children) walkVis(child, depth + 1);
    }
  }
  walkVis(state.tree, 0);
  return result;
}

export function selectNode(id) {
  state.selectedId = id;
  document.getElementById("dock").classList.add("is-open");
  rerender();
}

export function rerender() {
  state.__visible = visibleNodes();
  const layout = getLayout();
  renderConnections(layout);
  renderNodes(layout);
  renderDetail();
}

function centerBoard() {
  const vp = document.getElementById("viewport");
  state.tx = vp.clientWidth / 2 - BOARD.centerX * state.scale;
  state.ty = vp.clientHeight / 2 - BOARD.centerY * state.scale;
}

function initControls() {
  document.getElementById("dock-close").addEventListener("click", () => {
    state.selectedId = null;
    document.getElementById("dock").classList.remove("is-open");
    rerender();
  });
  const modeToggle = document.getElementById("mode-edit");
  modeToggle.addEventListener("change", () => {
    state.editMode = modeToggle.checked;
    document.body.classList.toggle("edit-mode", state.editMode);
    rerender();
  });
}

function main() {
  centerBoard();
  updateTransform();
  initZoom();
  initPan();
  initNodeDrag();
  initControls();
  rerender();
}

main();

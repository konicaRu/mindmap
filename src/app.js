import { INITIAL_DATA } from "../data.js";
import { normalizeNode, loadLocal, saveLocal, downloadJSON, readImportedFile } from "./storage.js";
import { computeStableLayout, getNodeSize } from "./layout.js";
import { walk, findNode, addChild, deleteSubtree, reparent, updateFields } from "./model.js";
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

export function editAddChild(parentId) {
  const node = addChild(state.tree, parentId);
  if (node) {
    state.expanded.add(parentId);
    state.selectedId = node.id;
    autosave();
    rerender();
  }
}

export function editDeleteNode(id) {
  let count = 0;
  const target = findNode(state.tree, id);
  if (target) walk(target, () => count++);
  const ok = window.confirm(`Удалить узел и ${count - 1} вложенных? Действие необратимо.`);
  if (!ok) return;
  if (deleteSubtree(state.tree, id)) {
    if (state.selectedId === id) {
      state.selectedId = null;
      document.getElementById("dock").classList.remove("is-open");
    }
    autosave();
    rerender();
  }
}

export function editReparent(id, newParentId) {
  if (reparent(state.tree, id, newParentId)) {
    state.expanded.add(newParentId);
    autosave();
    rerender();
  } else {
    window.alert("Нельзя переместить узел сюда (цикл или недопустимая цель).");
    rerender();
  }
}

export function editUpdateFields(id, patch) {
  updateFields(state.tree, id, patch);
  autosave();
  state.__visible = visibleNodes();
  const layout = getLayout();
  renderConnections(layout);
  renderNodes(layout);
  buildChips(); // tags may have changed
}

export function allTags() {
  const set = new Set();
  walk(state.tree, (n) => n.tags.forEach((t) => set.add(t)));
  return ["all", ...Array.from(set).sort()];
}

function buildChips() {
  const wrap = document.getElementById("chips");
  wrap.innerHTML = "";
  for (const tag of allTags()) {
    const b = document.createElement("button");
    b.className = "chip" + (state.filter === tag ? " is-active" : "");
    b.textContent = tag === "all" ? "Все" : tag;
    b.addEventListener("click", () => { state.filter = tag; buildChips(); rerender(); });
    wrap.appendChild(b);
  }
}

export function matchesNode(node) {
  const tagOk = state.filter === "all" || node.tags.includes(state.filter);
  const q = state.search.trim().toLowerCase();
  const textOk = !q || [node.title, node.summary, node.why, node.example,
    ...node.insights, ...node.tags].join(" ").toLowerCase().includes(q);
  return tagOk && textOk;
}

function centerBoard() {
  const vp = document.getElementById("viewport");
  state.tx = vp.clientWidth / 2 - BOARD.centerX * state.scale;
  state.ty = vp.clientHeight / 2 - BOARD.centerY * state.scale;
}

function centerBoardPublic() { centerBoard(); updateTransform(); }

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

  document.getElementById("btn-export").addEventListener("click", () => {
    downloadJSON(state.tree, "mindmap.json");
  });

  const fileInput = document.getElementById("file-input");
  document.getElementById("btn-import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const tree = await readImportedFile(file);
      state.tree = tree;
      state.selectedId = null;
      state.expanded = new Set([tree.id]);
      autosave();
      document.getElementById("dock").classList.remove("is-open");
      centerBoardPublic();
      buildChips();
      rerender();
    } catch (e) {
      window.alert("Ошибка импорта: " + e.message);
    } finally {
      fileInput.value = "";
    }
  });

  document.getElementById("search").addEventListener("input", (e) => {
    state.search = e.target.value;
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
  buildChips();
  rerender();
}

main();

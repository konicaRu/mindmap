import { state, isExpanded, toggleExpanded, selectNode, rerender, matchesNode } from "./app.js";
import { getNodeSize } from "./layout.js";
import { findParent } from "./model.js";
import { renderEditForm } from "./editor.js";

export function renderNodes(layout) {
  const layer = document.getElementById("node-layer");
  layer.innerHTML = "";
  for (const { node, depth } of state.__visible) {
    const pos = layout.get(node.id);
    if (!pos) continue;
    const size = getNodeSize(depth);
    const el = document.createElement("div");
    el.className = "node";
    el.dataset.id = node.id;
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
    el.style.width = size.width + "px";
    if (node.children.length) el.classList.add("has-children");
    if (node.id === state.selectedId) el.classList.add("is-selected");

    const title = document.createElement("div");
    title.className = "node-title";
    title.textContent = node.title || "(без названия)";
    el.appendChild(title);

    if (node.summary) {
      const sum = document.createElement("div");
      sum.className = "node-summary";
      sum.textContent = node.summary.length > 90 ? node.summary.slice(0, 90) + "…" : node.summary;
      el.appendChild(sum);
    }

    if (node.children.length) {
      const toggle = document.createElement("button");
      toggle.className = "node-toggle";
      toggle.textContent = isExpanded(node.id) ? "−" : "+";
      toggle.addEventListener("click", (e) => { e.stopPropagation(); toggleExpanded(node.id); });
      el.appendChild(toggle);
    }

    const add = document.createElement("button");
    add.className = "node-add";
    add.textContent = "＋";
    add.dataset.add = node.id;
    el.appendChild(add);

    el.addEventListener("click", () => selectNode(node.id));
    const active = state.filter !== "all" || state.search.trim() !== "";
    if (active && !matchesNode(node)) el.style.opacity = "0.25";
    layer.appendChild(el);
  }
}

export function renderConnections(layout) {
  const svg = document.getElementById("connections");
  svg.innerHTML = "";
  for (const { node } of state.__visible) {
    if (!isExpanded(node.id)) continue;
    const from = layout.get(node.id);
    for (const child of node.children) {
      const to = layout.get(child.id);
      if (!from || !to) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const midX = (from.x + to.x) / 2;
      path.setAttribute("d", `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`);
      svg.appendChild(path);
    }
  }
}

export function renderDetail() {
  const body = document.getElementById("dock-body");
  if (!state.selectedId) { body.innerHTML = ""; return; }
  const node = findNodeById(state.selectedId);
  if (!node) { body.innerHTML = ""; return; }

  if (state.editMode) {
    renderEditForm(body, node);
    return;
  }

  body.innerHTML = "";
  appendBlock(body, node.title, "h2");
  appendSection(body, "Описание", node.summary);
  appendSection(body, "Зачем это важно", node.why);
  appendSection(body, "Пример", node.example);
  if (node.insights.length) {
    const h = document.createElement("h3"); h.textContent = "Ключевые тезисы"; body.appendChild(h);
    const ul = document.createElement("ul");
    node.insights.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    body.appendChild(ul);
  }
  if (node.tags.length) appendSection(body, "Теги", node.tags.join(", "));
  if (node.sources.length) {
    const h = document.createElement("h3"); h.textContent = "Источники"; body.appendChild(h);
    node.sources.forEach((s) => {
      const a = document.createElement("a");
      a.href = s.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = s.title || s.url; a.style.display = "block";
      body.appendChild(a);
    });
  }
}

function appendBlock(parent, text, tag) {
  if (!text) return;
  const el = document.createElement(tag); el.textContent = text; parent.appendChild(el);
}
function appendSection(parent, label, text) {
  if (!text) return;
  const h = document.createElement("h3"); h.textContent = label; parent.appendChild(h);
  const p = document.createElement("p"); p.textContent = text; parent.appendChild(p);
}
function findNodeById(id) {
  let f = null;
  (function w(n){ if (n.id === id) f = n; n.children.forEach(w); })(state.tree);
  return f;
}

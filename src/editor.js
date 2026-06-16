import { state, editAddChild, editDeleteNode, editReparent, editUpdateFields } from "./app.js";
import { walk, findParent } from "./model.js";

export function renderEditForm(container, node) {
  container.innerHTML = "";

  const h = document.createElement("h2");
  h.textContent = "Редактирование узла";
  container.appendChild(h);

  textField(container, "Заголовок", node.title, (v) => editUpdateFields(node.id, { title: v }));
  textArea(container, "Описание", node.summary, (v) => editUpdateFields(node.id, { summary: v }));
  textArea(container, "Зачем это важно", node.why, (v) => editUpdateFields(node.id, { why: v }));
  textArea(container, "Пример", node.example, (v) => editUpdateFields(node.id, { example: v }));
  textArea(container, "Тезисы (по строке на пункт)", node.insights.join("\n"),
    (v) => editUpdateFields(node.id, { insights: splitLines(v) }));
  textField(container, "Теги (через запятую)", node.tags.join(", "),
    (v) => editUpdateFields(node.id, { tags: splitComma(v) }));
  textArea(container, "Источники (title | url, по строке)",
    node.sources.map((s) => `${s.title} | ${s.url}`).join("\n"),
    (v) => editUpdateFields(node.id, { sources: parseSources(v) }));

  if (node.id !== state.tree.id) {
    const label = document.createElement("h3");
    label.textContent = "Родитель";
    container.appendChild(label);
    const select = document.createElement("select");
    select.className = "dock-field";
    const currentParent = findParent(state.tree, node.id);
    eligibleParents(node).forEach((cand) => {
      const opt = document.createElement("option");
      opt.value = cand.id;
      opt.textContent = cand.title || "(без названия)";
      if (currentParent && cand.id === currentParent.id) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => editReparent(node.id, select.value));
    container.appendChild(select);
  }

  const actions = document.createElement("div");
  actions.className = "dock-actions";
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "＋ Добавить ребёнка";
  addBtn.addEventListener("click", () => editAddChild(node.id));
  actions.appendChild(addBtn);

  if (node.id !== state.tree.id) {
    const delBtn = document.createElement("button");
    delBtn.className = "btn danger";
    delBtn.textContent = "Удалить узел";
    delBtn.addEventListener("click", () => editDeleteNode(node.id));
    actions.appendChild(delBtn);
  }
  container.appendChild(actions);
}

function eligibleParents(node) {
  const banned = new Set();
  walk(node, (n) => banned.add(n.id));
  const out = [];
  walk(state.tree, (n) => { if (!banned.has(n.id)) out.push(n); });
  return out;
}

function textField(parent, label, value, onChange) {
  const h = document.createElement("h3"); h.textContent = label; parent.appendChild(h);
  const inp = document.createElement("input");
  inp.className = "dock-field"; inp.value = value;
  inp.addEventListener("input", () => onChange(inp.value));
  parent.appendChild(inp);
}
function textArea(parent, label, value, onChange) {
  const h = document.createElement("h3"); h.textContent = label; parent.appendChild(h);
  const ta = document.createElement("textarea");
  ta.className = "dock-field"; ta.value = value;
  ta.addEventListener("input", () => onChange(ta.value));
  parent.appendChild(ta);
}
function splitLines(v) { return v.split("\n").map((s) => s.trim()).filter(Boolean); }
function splitComma(v) { return v.split(",").map((s) => s.trim()).filter(Boolean); }
function parseSources(v) {
  return splitLines(v).map((line) => {
    const [title, url] = line.split("|").map((s) => (s || "").trim());
    return { title: title || "", url: url || "" };
  });
}

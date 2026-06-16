# Editable Mind Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, no-build, vanilla-JS interactive mind map (modeled on `safreliy.github.io/context-engineering-mindmap`) that — unlike the reference — lets the user edit node text, edit tree structure, and move nodes, with localStorage autosave plus JSON export/import.

**Architecture:** Native browser ES modules (`<script type="module">`) — no bundler, no framework. Pure logic (tree operations, radial layout math, serialization) lives in side-effect-free modules tested with Node's built-in `node:test`. DOM rendering and interactions live in separate modules verified manually in the browser. A single in-memory `state` object holds the tree, view transform, and editor mode; every mutation re-renders and autosaves to localStorage.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML, CSS. SVG for connection lines. `node:test` + `node:assert` for unit tests. No dependencies, no build step.

---

## Reference Notes (source of the design)

The reference app (`context-engineering-mindmap`) is three files: `index.html` (static shell), `mindmap-data.js` (one `window.MINDMAP_DATA` object), `app.js` (radial layout + drag/zoom/pan + detail dock + filters + ~100KB of per-node animations). Key mechanics we reproduce:

- **Radial layout:** root centered; children fanned across an angular span proportional to subtree "weight" (leaf count); radius grows with depth.
- **View transform:** `scale`, `tx`, `ty`; wheel zooms at cursor; background drag pans; node drag stores a manual offset.
- **Detail dock:** clicking a node shows its text fields in a right-side panel.
- **Filters/search:** tag chips + text search hide non-matching nodes and auto-expand matching branches.

We **drop**: the `viz` animations, the separate `sources` dictionary (sources move inline into each node), and the "fixed data" constraint (we add editing + persistence).

---

## File Structure

```
mindmap/
  index.html              # shell: topbar (filters, mode toggle, export/import), detail/edit dock, viewport, svg
  styles.css              # all styles
  data.js                 # ES module: export const INITIAL_DATA = { ...empty map: one root... }
  src/
    model.js              # PURE tree ops: normalize, walk, find, addChild, deleteSubtree, reparent,
                          #   setPosition, updateFields, serialize, deserialize, validate. TESTABLE.
    layout.js             # PURE radial layout math: computeStableLayout, subtreeWeight, getRadius,
                          #   getNodeSize, relaxCollisions. TESTABLE.
    storage.js            # PURE: toJSON/fromJSON. SIDE-EFFECT: saveLocal/loadLocal/clearLocal,
                          #   downloadJSON, readImportedFile. (pure parts tested; localStorage parts manual)
    render.js             # DOM: renderNodes, renderConnections, renderDetail (view mode)
    editor.js             # DOM: renderEditForm, parent <select>, add/delete handlers (with confirm)
    interactions.js       # DOM events: initZoom, initPan, initNodeDrag
    app.js                # wiring: state object, main(), re-render orchestration, autosave hook
  tests/
    model.test.js         # node --test
    layout.test.js        # node --test
    storage.test.js       # node --test
  docs/superpowers/plans/2026-06-16-editable-mindmap.md   # this file
```

**Files removed from the repo before Task 1:** everything from the old React/Vite app — `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `node_modules/`, `dist/`, `src/` (old React source), old `index.html`. Keep: `.git/`, `.github/`, `README.md`, `ARCHITECTURE.md`, `MEMORY.md`, `project-starter.md`, `docs/`.

---

## Data Model (canonical shape)

Every node:

```js
{
  id: "string-unique",          // generated via makeId()
  title: "string",
  summary: "string",
  why: "string",
  example: "string",
  insights: ["string", ...],    // bullet points
  tags: ["string", ...],
  sources: [{ title: "string", url: "string" }, ...],
  position: { dx: 0, dy: 0 },   // manual offset added on top of radial layout
  children: [ <node>, ... ]
}
```

The whole map is a single root node. `data.js` ships exactly one root with empty children.

---

## Task 1: Clean the repo and scaffold

**Files:**
- Delete: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `node_modules/`, `dist/`, old `src/`, old `index.html`
- Create: `data.js`, `src/` (empty dir), `tests/` (empty dir)

- [ ] **Step 1: Remove the old React/Vite app**

```bash
cd /c/claude_code_projects/mindmap
git rm -r --cached node_modules 2>/dev/null || true
rm -rf node_modules dist src
rm -f package.json package-lock.json vite.config.ts tsconfig.json tailwind.config.js postcss.config.js index.html
mkdir -p src tests
```

- [ ] **Step 2: Create the initial empty data module**

Create `data.js`:

```js
export const INITIAL_DATA = {
  id: "root",
  title: "Новая карта",
  summary: "Корневой узел. Откройте режим редактирования, чтобы добавлять узлы.",
  why: "",
  example: "",
  insights: [],
  tags: [],
  sources: [],
  position: { dx: 0, dy: 0 },
  children: []
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove React/Vite app, scaffold vanilla data module"
```

---

## Task 2: Pure tree model — id generation and traversal

**Files:**
- Create: `src/model.js`
- Test: `tests/model.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/model.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeId, walk, findNode, findParent } from "../src/model.js";

test("makeId returns unique non-empty strings", () => {
  const a = makeId();
  const b = makeId();
  assert.ok(a.length > 0);
  assert.notEqual(a, b);
});

test("walk visits every node depth-first including root", () => {
  const tree = { id: "r", children: [
    { id: "a", children: [{ id: "a1", children: [] }] },
    { id: "b", children: [] }
  ]};
  const seen = [];
  walk(tree, (n) => seen.push(n.id));
  assert.deepEqual(seen, ["r", "a", "a1", "b"]);
});

test("findNode returns the node with matching id, or null", () => {
  const tree = { id: "r", children: [{ id: "a", children: [] }] };
  assert.equal(findNode(tree, "a").id, "a");
  assert.equal(findNode(tree, "missing"), null);
});

test("findParent returns the parent of a node, null for root", () => {
  const tree = { id: "r", children: [{ id: "a", children: [{ id: "a1", children: [] }] }] };
  assert.equal(findParent(tree, "a1").id, "a");
  assert.equal(findParent(tree, "r"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/model.test.js`
Expected: FAIL — cannot import `../src/model.js` (file does not exist).

- [ ] **Step 3: Write minimal implementation**

Create `src/model.js`:

```js
let idCounter = 0;
export function makeId() {
  idCounter += 1;
  return `n${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function walk(node, fn) {
  fn(node);
  for (const child of node.children || []) walk(child, fn);
}

export function findNode(root, id) {
  let found = null;
  walk(root, (n) => { if (n.id === id) found = n; });
  return found;
}

export function findParent(root, id) {
  let parent = null;
  walk(root, (n) => {
    for (const child of n.children || []) {
      if (child.id === id) parent = n;
    }
  });
  return parent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/model.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/model.js tests/model.test.js
git commit -m "feat: tree traversal and id generation (model.js)"
```

---

## Task 3: Pure tree model — mutations (add, delete, reparent, setPosition, updateFields)

**Files:**
- Modify: `src/model.js`
- Test: `tests/model.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/model.test.js`:

```js
import { addChild, deleteSubtree, reparent, setPosition, updateFields, makeEmptyNode } from "../src/model.js";

function sample() {
  return {
    id: "r", title: "root", summary: "", why: "", example: "",
    insights: [], tags: [], sources: [], position: { dx: 0, dy: 0 },
    children: [
      { id: "a", title: "A", summary: "", why: "", example: "", insights: [], tags: [], sources: [], position: { dx: 0, dy: 0 },
        children: [{ id: "a1", title: "A1", summary: "", why: "", example: "", insights: [], tags: [], sources: [], position: { dx: 0, dy: 0 }, children: [] }] },
      { id: "b", title: "B", summary: "", why: "", example: "", insights: [], tags: [], sources: [], position: { dx: 0, dy: 0 }, children: [] }
    ]
  };
}

test("makeEmptyNode produces a valid default node with a fresh id", () => {
  const n = makeEmptyNode();
  assert.equal(typeof n.id, "string");
  assert.equal(n.title, "Новый узел");
  assert.deepEqual(n.children, []);
  assert.deepEqual(n.position, { dx: 0, dy: 0 });
});

test("addChild appends a new child under the given parent and returns it", () => {
  const tree = sample();
  const child = addChild(tree, "b");
  assert.equal(findParent(tree, child.id).id, "b");
  assert.equal(findNode(tree, "b").children.length, 1);
});

test("deleteSubtree removes a node and all its descendants", () => {
  const tree = sample();
  const ok = deleteSubtree(tree, "a");
  assert.equal(ok, true);
  assert.equal(findNode(tree, "a"), null);
  assert.equal(findNode(tree, "a1"), null);
  assert.equal(tree.children.length, 1);
});

test("deleteSubtree refuses to delete the root", () => {
  const tree = sample();
  assert.equal(deleteSubtree(tree, "r"), false);
  assert.equal(findNode(tree, "r").id, "r");
});

test("reparent moves a node (and subtree) under a new parent", () => {
  const tree = sample();
  const ok = reparent(tree, "a", "b");
  assert.equal(ok, true);
  assert.equal(findParent(tree, "a").id, "b");
  assert.equal(findNode(tree, "a1").id, "a1"); // subtree preserved
});

test("reparent rejects moving a node into its own descendant (cycle)", () => {
  const tree = sample();
  assert.equal(reparent(tree, "a", "a1"), false);
  assert.equal(findParent(tree, "a").id, "r"); // unchanged
});

test("reparent rejects moving the root", () => {
  const tree = sample();
  assert.equal(reparent(tree, "r", "a"), false);
});

test("setPosition updates a node manual offset", () => {
  const tree = sample();
  setPosition(tree, "a", 12, -8);
  assert.deepEqual(findNode(tree, "a").position, { dx: 12, dy: -8 });
});

test("updateFields patches text fields without touching children/id", () => {
  const tree = sample();
  updateFields(tree, "a", { title: "AA", tags: ["x"] });
  const a = findNode(tree, "a");
  assert.equal(a.title, "AA");
  assert.deepEqual(a.tags, ["x"]);
  assert.equal(a.id, "a");
  assert.equal(a.children.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/model.test.js`
Expected: FAIL — `addChild`, `deleteSubtree`, etc. not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/model.js`:

```js
export function makeEmptyNode() {
  return {
    id: makeId(),
    title: "Новый узел",
    summary: "",
    why: "",
    example: "",
    insights: [],
    tags: [],
    sources: [],
    position: { dx: 0, dy: 0 },
    children: []
  };
}

export function addChild(root, parentId) {
  const parent = findNode(root, parentId);
  if (!parent) return null;
  const node = makeEmptyNode();
  parent.children.push(node);
  return node;
}

export function deleteSubtree(root, id) {
  if (id === root.id) return false;
  const parent = findParent(root, id);
  if (!parent) return false;
  parent.children = parent.children.filter((c) => c.id !== id);
  return true;
}

export function reparent(root, id, newParentId) {
  if (id === root.id) return false;
  if (id === newParentId) return false;
  const node = findNode(root, id);
  const newParent = findNode(root, newParentId);
  if (!node || !newParent) return false;
  // reject cycle: newParent must not be inside node's subtree
  let inside = false;
  walk(node, (n) => { if (n.id === newParentId) inside = true; });
  if (inside) return false;
  const oldParent = findParent(root, id);
  if (!oldParent) return false;
  oldParent.children = oldParent.children.filter((c) => c.id !== id);
  newParent.children.push(node);
  return true;
}

export function setPosition(root, id, dx, dy) {
  const node = findNode(root, id);
  if (!node) return false;
  node.position = { dx, dy };
  return true;
}

const EDITABLE_FIELDS = ["title", "summary", "why", "example", "insights", "tags", "sources"];
export function updateFields(root, id, patch) {
  const node = findNode(root, id);
  if (!node) return false;
  for (const key of EDITABLE_FIELDS) {
    if (key in patch) node[key] = patch[key];
  }
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/model.test.js`
Expected: PASS — all tests (Task 2 + Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/model.js tests/model.test.js
git commit -m "feat: tree mutations add/delete/reparent/setPosition/updateFields"
```

---

## Task 4: Serialization + validation (storage core, pure)

**Files:**
- Create: `src/storage.js`
- Test: `tests/storage.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/storage.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { toJSON, fromJSON, normalizeNode } from "../src/storage.js";

test("normalizeNode fills missing fields with defaults and a generated id", () => {
  const n = normalizeNode({ title: "X" });
  assert.equal(n.title, "X");
  assert.equal(typeof n.id, "string");
  assert.deepEqual(n.children, []);
  assert.deepEqual(n.insights, []);
  assert.deepEqual(n.position, { dx: 0, dy: 0 });
});

test("normalizeNode recurses into children", () => {
  const n = normalizeNode({ title: "X", children: [{ title: "Y" }] });
  assert.equal(n.children.length, 1);
  assert.equal(n.children[0].title, "Y");
  assert.deepEqual(n.children[0].position, { dx: 0, dy: 0 });
});

test("toJSON then fromJSON round-trips a tree", () => {
  const tree = normalizeNode({ title: "root", children: [{ title: "a" }] });
  const text = toJSON(tree);
  const back = fromJSON(text);
  assert.equal(back.title, "root");
  assert.equal(back.children[0].title, "a");
});

test("fromJSON throws a clear error on malformed JSON", () => {
  assert.throws(() => fromJSON("{not json"), /Некорректный JSON/);
});

test("fromJSON throws when the top-level node has no title field shape", () => {
  assert.throws(() => fromJSON("[]"), /Ожидался объект карты/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/storage.test.js`
Expected: FAIL — `../src/storage.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/storage.js` (pure section only for now):

```js
import { makeId } from "./model.js";

export function normalizeNode(raw) {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : makeId(),
    title: typeof raw.title === "string" ? raw.title : "",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    why: typeof raw.why === "string" ? raw.why : "",
    example: typeof raw.example === "string" ? raw.example : "",
    insights: Array.isArray(raw.insights) ? raw.insights.slice() : [],
    tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],
    sources: Array.isArray(raw.sources)
      ? raw.sources.map((s) => ({ title: String(s.title || ""), url: String(s.url || "") }))
      : [],
    position: raw.position && typeof raw.position === "object"
      ? { dx: Number(raw.position.dx) || 0, dy: Number(raw.position.dy) || 0 }
      : { dx: 0, dy: 0 },
    children: Array.isArray(raw.children) ? raw.children.map(normalizeNode) : []
  };
}

export function toJSON(tree) {
  return JSON.stringify(tree, null, 2);
}

export function fromJSON(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Некорректный JSON: " + e.message);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Ожидался объект карты на верхнем уровне");
  }
  return normalizeNode(parsed);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/storage.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/storage.js tests/storage.test.js
git commit -m "feat: serialization + normalization (storage.js pure core)"
```

---

## Task 5: Storage side-effects (localStorage + file download/import)

**Files:**
- Modify: `src/storage.js`

These functions touch `localStorage`, `document`, and `FileReader`; they are verified manually in the browser (Task 12), not unit-tested.

- [ ] **Step 1: Add localStorage + file helpers**

Append to `src/storage.js`:

```js
const STORAGE_KEY = "mindmap.draft.v1";

export function saveLocal(tree) {
  try {
    localStorage.setItem(STORAGE_KEY, toJSON(tree));
    return true;
  } catch {
    return false;
  }
}

export function loadLocal() {
  const text = localStorage.getItem(STORAGE_KEY);
  if (!text) return null;
  try {
    return fromJSON(text);
  } catch {
    return null;
  }
}

export function clearLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadJSON(tree, filename = "mindmap.json") {
  const blob = new Blob([toJSON(tree)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readImportedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(fromJSON(String(reader.result)));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file);
  });
}
```

- [ ] **Step 2: Re-run storage tests to confirm pure tests still pass**

Run: `node --test tests/storage.test.js`
Expected: PASS — same 5 tests (new functions are not imported by tests, so no regression).

- [ ] **Step 3: Commit**

```bash
git add src/storage.js
git commit -m "feat: localStorage autosave + JSON download/import helpers"
```

---

## Task 6: Pure radial layout math

**Files:**
- Create: `src/layout.js`
- Test: `tests/layout.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/layout.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { subtreeWeight, getRadius, getNodeSize, computeStableLayout } from "../src/layout.js";

function node(id, children = []) {
  return { id, position: { dx: 0, dy: 0 }, children };
}

test("subtreeWeight counts leaves (a leaf weighs 1)", () => {
  assert.equal(subtreeWeight(node("leaf")), 1);
  const t = node("r", [node("a", [node("a1"), node("a2")]), node("b")]);
  assert.equal(subtreeWeight(t), 3); // a1, a2, b
});

test("getRadius grows with depth", () => {
  assert.ok(getRadius(1) > getRadius(0));
  assert.ok(getRadius(2) > getRadius(1));
});

test("getNodeSize shrinks with depth", () => {
  assert.ok(getNodeSize(0).width > getNodeSize(1).width);
  assert.ok(getNodeSize(1).width >= getNodeSize(3).width);
});

test("computeStableLayout places the root at board center", () => {
  const t = node("r", [node("a"), node("b")]);
  const map = computeStableLayout(t, { centerX: 1000, centerY: 1000 });
  assert.equal(map.get("r").x, 1000);
  assert.equal(map.get("r").y, 1000);
});

test("computeStableLayout gives every node a position and a depth", () => {
  const t = node("r", [node("a", [node("a1")]), node("b")]);
  const map = computeStableLayout(t, { centerX: 0, centerY: 0 });
  for (const id of ["r", "a", "a1", "b"]) {
    assert.ok(map.has(id), `missing ${id}`);
    assert.equal(typeof map.get(id).x, "number");
    assert.equal(typeof map.get(id).y, "number");
  }
  assert.equal(map.get("r").depth, 0);
  assert.equal(map.get("a").depth, 1);
  assert.equal(map.get("a1").depth, 2);
});

test("manual position offset is applied to layout coordinates", () => {
  const t = node("r", [{ id: "a", position: { dx: 50, dy: -20 }, children: [] }]);
  const base = computeStableLayout(node("r", [node("a")]), { centerX: 0, centerY: 0 }).get("a");
  const moved = computeStableLayout(t, { centerX: 0, centerY: 0 }).get("a");
  assert.equal(moved.x, base.x + 50);
  assert.equal(moved.y, base.y - 20);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/layout.test.js`
Expected: FAIL — `../src/layout.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/layout.js`:

```js
const RADII = [0, 360, 620, 860];

export function subtreeWeight(node) {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + subtreeWeight(c), 0);
}

export function getRadius(depth) {
  if (depth < RADII.length) return RADII[depth];
  return RADII[RADII.length - 1] + (depth - RADII.length + 1) * 260;
}

export function getNodeSize(depth) {
  if (depth === 0) return { width: 300, height: 148 };
  if (depth === 1) return { width: 236, height: 118 };
  if (depth === 2) return { width: 194, height: 96 };
  return { width: 160, height: 78 };
}

// Returns Map<id, { x, y, angle, depth }>, manual offsets already applied.
export function computeStableLayout(root, { centerX, centerY }) {
  const map = new Map();
  const spanStart = -Math.PI + 0.18;
  const spanEnd = Math.PI - 0.18;

  function place(node, depth, startAngle, endAngle) {
    const angle = depth === 0 ? -Math.PI / 2 : (startAngle + endAngle) / 2;
    const radius = getRadius(depth);
    const baseX = depth === 0 ? centerX : centerX + Math.cos(angle) * radius;
    const baseY = depth === 0 ? centerY : centerY + Math.sin(angle) * radius;
    const off = node.position || { dx: 0, dy: 0 };
    map.set(node.id, { x: baseX + (off.dx || 0), y: baseY + (off.dy || 0), angle, depth });

    const children = node.children || [];
    if (!children.length) return;
    const total = children.reduce((s, c) => s + subtreeWeight(c), 0);
    let cursor = startAngle;
    for (const child of children) {
      const span = ((endAngle - startAngle) * subtreeWeight(child)) / total;
      const pad = Math.min(0.1, span * 0.18);
      place(child, depth + 1, cursor + pad, cursor + span - pad);
      cursor += span;
    }
  }

  place(root, 0, spanStart, spanEnd);
  return map;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/layout.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/layout.js tests/layout.test.js
git commit -m "feat: pure radial layout math (layout.js)"
```

---

## Task 7: HTML shell + CSS

**Files:**
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: Create the HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Редактируемая mind map</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <div class="topbar">
        <div class="brand">Mind Map</div>
        <div class="chips" id="chips"></div>
        <input class="search" id="search" type="search" placeholder="Поиск…" />
        <div class="spacer"></div>
        <label class="mode-toggle">
          <input type="checkbox" id="mode-edit" /> Редактирование
        </label>
        <button class="btn" id="btn-export" type="button">Экспорт JSON</button>
        <button class="btn" id="btn-import" type="button">Импорт JSON</button>
        <input type="file" id="file-input" accept="application/json" hidden />
      </div>

      <div class="stage">
        <div class="viewport" id="viewport">
          <div class="board" id="board">
            <svg class="connections" id="connections" preserveAspectRatio="none"></svg>
            <div class="node-layer" id="node-layer"></div>
          </div>
        </div>

        <aside class="dock" id="dock">
          <button class="dock-close" id="dock-close" type="button" aria-label="Закрыть">✕</button>
          <div class="dock-body" id="dock-body"></div>
        </aside>
      </div>
    </main>
    <script type="module" src="src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the stylesheet**

Create `styles.css`:

```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; color: #0f172a; }
.app-shell { display: flex; flex-direction: column; height: 100vh; }

.topbar { display: flex; align-items: center; gap: 12px; padding: 8px 14px;
  border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-wrap: wrap; }
.brand { font-weight: 700; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px;
  padding: 4px 10px; font-size: 12px; cursor: pointer; }
.chip.is-active { background: #0f766e; color: #fff; border-color: #0f766e; }
.search { padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
.spacer { flex: 1; }
.btn { padding: 5px 10px; border: 1px solid #cbd5e1; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn:hover { background: #f1f5f9; }

.stage { position: relative; flex: 1; overflow: hidden; }
.viewport { position: absolute; inset: 0; overflow: hidden; cursor: grab; background: #f1f5f9; }
.viewport.is-panning { cursor: grabbing; }
.board { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.connections { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
.connections path { fill: none; stroke: #94a3b8; stroke-width: 2; }
.node-layer { position: absolute; top: 0; left: 0; }

.node { position: absolute; transform: translate(-50%, -50%);
  border: 1px solid #cbd5e1; border-radius: 12px; background: #fff;
  padding: 10px 12px; box-shadow: 0 2px 8px rgba(15,23,42,.08); cursor: pointer; }
.node.is-selected { border-color: #0f766e; box-shadow: 0 0 0 2px #0f766e33; }
.node.is-dragging { cursor: grabbing; user-select: none; }
.node-title { font-weight: 600; font-size: 14px; }
.node-summary { font-size: 12px; color: #475569; margin-top: 4px; }
.node-toggle, .node-add { position: absolute; bottom: -10px; width: 22px; height: 22px;
  border-radius: 50%; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;
  font-size: 12px; line-height: 1; display: none; }
.node-toggle { right: 28px; }
.node-add { right: 2px; }
body.edit-mode .node-add { display: inline-block; }
.node.has-children .node-toggle { display: inline-block; }

.dock { position: absolute; top: 0; right: 0; width: 360px; height: 100%;
  background: #fff; border-left: 1px solid #e2e8f0; padding: 16px;
  overflow-y: auto; transform: translateX(100%); transition: transform .2s; }
.dock.is-open { transform: translateX(0); }
.dock-close { position: absolute; top: 10px; right: 10px; border: none;
  background: none; font-size: 16px; cursor: pointer; }
.dock h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin: 16px 0 4px; }
.dock-field { width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1;
  border-radius: 6px; font: inherit; margin-top: 4px; }
textarea.dock-field { min-height: 64px; resize: vertical; }
.dock-actions { display: flex; gap: 8px; margin-top: 16px; }
.danger { color: #b91c1c; border-color: #fecaca; }
```

- [ ] **Step 3: Manual check**

Open `index.html` in a browser. Expected: topbar with brand, mode toggle, export/import buttons; empty gray viewport; dock hidden off-screen. No console errors except the module 404 for `src/app.js` (created next task).

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: HTML shell + CSS"
```

---

## Task 8: App skeleton — state, load, render dispatch

**Files:**
- Create: `src/app.js`
- Create: `src/render.js` (with stub functions filled in Task 9)

- [ ] **Step 1: Create render.js stubs**

Create `src/render.js`:

```js
// Filled in Task 9. Stubs so app.js imports resolve.
export function renderNodes() {}
export function renderConnections() {}
export function renderDetail() {}
```

- [ ] **Step 2: Create the app state + bootstrap**

Create `src/app.js`:

```js
import { INITIAL_DATA } from "../data.js";
import { normalizeNode } from "./storage.js";
import { loadLocal, saveLocal } from "./storage.js";
import { computeStableLayout } from "./layout.js";
import { renderNodes, renderConnections, renderDetail } from "./render.js";

export const BOARD = { centerX: 1600, centerY: 1100 };

export const state = {
  tree: loadLocal() || normalizeNode(INITIAL_DATA),
  selectedId: null,
  editMode: false,
  filter: "all",
  search: "",
  expanded: new Set(),       // node ids that are expanded
  scale: 0.7,
  tx: 0,
  ty: 0
};

// expand root by default
state.expanded.add(state.tree.id);

export function autosave() {
  saveLocal(state.tree);
}

export function getLayout() {
  return computeStableLayout(state.tree, BOARD);
}

export function rerender() {
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

function main() {
  centerBoard();
  rerender();
}

main();
```

- [ ] **Step 3: Manual check**

Open `index.html`. Expected: no console errors. Nothing renders yet (stubs), viewport empty. Confirm `window` has no errors and the module graph loads (Network tab: all `src/*.js` and `data.js` are 200).

- [ ] **Step 4: Commit**

```bash
git add src/app.js src/render.js
git commit -m "feat: app state, bootstrap, render dispatch (stubs)"
```

---

## Task 9: View-mode rendering — nodes, connections, transform, detail dock

**Files:**
- Modify: `src/render.js`
- Modify: `src/app.js` (add `updateTransform`, expose helpers, wire node click)

- [ ] **Step 1: Implement transform + visibility helpers in app.js**

Add to `src/app.js` (before `main`):

```js
import { getNodeSize } from "./layout.js";
import { walk, findNode } from "./model.js";

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

// Visible nodes: a node is visible if all ancestors are expanded.
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
```

Update `main()` to call `updateTransform()` after `centerBoard()`:

```js
function main() {
  centerBoard();
  updateTransform();
  rerender();
}
```

- [ ] **Step 2: Implement render.js**

Replace `src/render.js`:

```js
import { state, isExpanded, toggleExpanded, selectNode, rerender } from "./app.js";
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
```

Note: `renderNodes`/`renderConnections` read `state.__visible`. Set it in `rerender()` in app.js.

- [ ] **Step 3: Wire `state.__visible` in app.js rerender**

Replace `rerender` in `src/app.js`:

```js
export function rerender() {
  state.__visible = visibleNodes();
  const layout = getLayout();
  renderConnections(layout);
  renderNodes(layout);
  renderDetail();
}
```

- [ ] **Step 4: Create editor.js stub (so render.js import resolves)**

Create `src/editor.js`:

```js
// Filled in Task 11.
export function renderEditForm(container, node) {
  container.innerHTML = "<p>Режим редактирования — форма будет здесь (Task 11).</p>";
}
```

- [ ] **Step 5: Manual check**

Open `index.html`. Expected: a single root node "Новая карта" centered in the viewport. Clicking it opens the dock with its description. No console errors. (Only one node because the map is empty — children come via editing.)

- [ ] **Step 6: Commit**

```bash
git add src/app.js src/render.js src/editor.js
git commit -m "feat: view-mode rendering — nodes, connections, detail dock"
```

---

## Task 10: Interactions — zoom, pan, node drag (position persistence)

**Files:**
- Create: `src/interactions.js`
- Modify: `src/app.js` (import + init, add `dock-close`, mode toggle wiring)

- [ ] **Step 1: Implement interactions.js**

Create `src/interactions.js`:

```js
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
    // keep point under cursor stable
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
    if (e.target.closest(".node")) return; // node drag handled separately
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
```

- [ ] **Step 2: Wire interactions + controls in app.js**

Add imports and init calls in `src/app.js`. Add at top:

```js
import { initZoom, initPan, initNodeDrag } from "./interactions.js";
```

Add a `initControls()` function and call it in `main()`:

```js
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
```

- [ ] **Step 3: Manual check**

Open `index.html`. Expected:
- Wheel over viewport zooms toward cursor.
- Dragging empty background pans.
- Dragging the root node moves it; refresh the page → it stays where you dropped it (localStorage autosave + position).
- Toggling "Редактирование" adds `edit-mode` to `<body>` (the `＋` button on the node appears).

- [ ] **Step 4: Commit**

```bash
git add src/interactions.js src/app.js
git commit -m "feat: zoom, pan, node drag with position autosave + mode toggle"
```

---

## Task 11: Edit form — fields, parent select, add child, delete with confirm

**Files:**
- Modify: `src/editor.js`
- Modify: `src/app.js` (export helpers the editor needs: `editAddChild`, `editDeleteNode`, `editReparent`, `editUpdateFields`)

- [ ] **Step 1: Add editor action helpers to app.js**

Add to `src/app.js`:

```js
import { addChild, deleteSubtree, reparent, updateFields, walk as walkTree } from "./model.js";

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
  if (target) walkTree(target, () => count++);
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
  // Re-render board but not the whole form (avoid losing focus) — caller decides.
  state.__visible = visibleNodes();
  const layout = getLayout();
  renderConnections(layout);
  renderNodes(layout);
}
```

Add `renderConnections, renderNodes` to the existing render.js import in app.js if not already imported.

- [ ] **Step 2: Implement the edit form**

Replace `src/editor.js`:

```js
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

  // Parent select (reparent) — root has no parent
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

  // Actions
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

// candidate parents = all nodes except the node itself and its descendants
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
```

- [ ] **Step 3: Manual check**

Open `index.html`, toggle "Редактирование", click the root node:
- Form shows all fields. Typing in "Заголовок" updates the node card live (board re-renders, focus stays in the field).
- Click "＋ Добавить ребёнка" → a child appears, becomes selected, parent auto-expands.
- Select the child; "Родитель" dropdown lists eligible parents; changing it moves the node.
- Click "Удалить узел" on the child → confirm dialog → node removed. Refresh → still removed (autosaved).
- Reparent cannot list the node's own descendants (verify by adding grandchildren).

- [ ] **Step 4: Commit**

```bash
git add src/editor.js src/app.js
git commit -m "feat: edit form — fields, reparent select, add/delete with confirm"
```

---

## Task 12: Export / Import wiring

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Wire export/import buttons**

Add to `initControls()` in `src/app.js`:

```js
import { downloadJSON, readImportedFile } from "./storage.js";
import { normalizeNode } from "./storage.js";

// inside initControls():
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
    rerender();
  } catch (e) {
    window.alert("Ошибка импорта: " + e.message);
  } finally {
    fileInput.value = "";
  }
});
```

Expose `centerBoardPublic` by renaming `centerBoard` usage: add

```js
function centerBoardPublic() { centerBoard(); updateTransform(); }
```

- [ ] **Step 2: Manual check**

Open `index.html`:
- Build a small map (add a few nodes). Click "Экспорт JSON" → `mindmap.json` downloads; open it and confirm it matches the on-screen tree.
- Click "Импорт JSON", choose that file → map reloads identically; refresh → persists (autosaved on import).
- Import a malformed JSON file → an alert "Ошибка импорта: …" appears and the current map is unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: JSON export/import wiring"
```

---

## Task 13: Filters + search

**Files:**
- Modify: `src/app.js` (build chips, filter visibility), `src/render.js` (apply match dimming)

- [ ] **Step 1: Compute tag set and build chips in app.js**

Add to `src/app.js`:

```js
export function allTags() {
  const set = new Set();
  walkTree(state.tree, (n) => n.tags.forEach((t) => set.add(t)));
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

function matchesNode(node) {
  const tagOk = state.filter === "all" || node.tags.includes(state.filter);
  const q = state.search.trim().toLowerCase();
  const textOk = !q || [node.title, node.summary, node.why, node.example,
    ...node.insights, ...node.tags].join(" ").toLowerCase().includes(q);
  return tagOk && textOk;
}
export { matchesNode };
```

Wire search input + initial chips in `initControls()`:

```js
document.getElementById("search").addEventListener("input", (e) => {
  state.search = e.target.value;
  rerender();
});
```

Call `buildChips()` inside `main()` after `initControls()`, and re-call it after import/edit (tags may change) — add `buildChips()` at the end of `editUpdateFields` and the import handler.

- [ ] **Step 2: Apply dimming in render.js**

In `renderNodes`, import `matchesNode` from app.js and add after creating `el`:

```js
import { matchesNode } from "./app.js";
// ...
const active = state.filter !== "all" || state.search.trim() !== "";
if (active && !matchesNode(node)) el.style.opacity = "0.25";
```

- [ ] **Step 3: Manual check**

Open `index.html`, build nodes with different tags:
- Tag chips appear (built from actual tags). Clicking a chip dims non-matching nodes; "Все" clears.
- Typing in search dims non-matching nodes live.
- Editing a node's tags adds/removes chips.

- [ ] **Step 4: Commit**

```bash
git add src/app.js src/render.js
git commit -m "feat: tag filter chips + text search with dimming"
```

---

## Task 14: README + run all tests

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the full test suite**

Run: `node --test`
Expected: PASS — all tests across model/layout/storage.

- [ ] **Step 2: Rewrite README**

Overwrite `README.md`:

```markdown
# Editable Mind Map

Быстрая редактируемая mind map на чистом ванильном JS (нативные ES-модули, без сборки).

## Запуск
Открыть `index.html` в браузере (двойной клик) или раздать как статику (GitHub Pages).

## Возможности
- Радиальная карта: zoom (колесо), pan (перетаскивание фона), drag узлов.
- Режим «Редактирование»: правка текста, добавление/удаление узлов (с подтверждением), смена родителя.
- Хранение: автосохранение в localStorage + Экспорт/Импорт JSON.

## Тесты
`node --test` — покрывают чистую логику (модель дерева, раскладка, сериализация).

## Структура
- `index.html`, `styles.css` — оболочка и стили
- `data.js` — стартовая (пустая) карта
- `src/model.js` — операции с деревом · `src/layout.js` — раскладка · `src/storage.js` — сериализация и хранение
- `src/render.js` — рендер · `src/editor.js` — форма правки · `src/interactions.js` — zoom/pan/drag · `src/app.js` — связка
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README for vanilla editable mind map"
```

---

## Self-Review Checklist (done while writing — informational)

**Spec coverage:**
- Edit node text → Task 11 (form fields). ✓
- Edit tree structure (add/delete/reparent) → Task 3 (model) + Task 11 (UI). ✓
- Move nodes + persist position → Task 6 (layout offset) + Task 10 (drag) + autosave. ✓
- localStorage autosave → Task 5 + autosave() calls throughout. ✓
- JSON export/import → Task 5 + Task 12. ✓
- Delete with confirmation → Task 11 (`window.confirm` with subtree count). ✓
- Reparent via dropdown (not drag) → Task 11 (`<select>`). ✓
- Vanilla JS, no build → ES modules, no package.json. ✓
- Start from empty map → Task 1 `data.js` single root. ✓
- Drop viz animations → not implemented anywhere. ✓
- Radial layout like reference → Task 6. ✓

**Type consistency:** Field names (`title, summary, why, example, insights, tags, sources, position{dx,dy}, children`) are identical across data.js, model.js, storage.js, render.js, editor.js. Function names referenced across tasks (`computeStableLayout`, `getNodeSize`, `findNode`, `findParent`, `walk`, `addChild`, `deleteSubtree`, `reparent`, `setPosition`, `updateFields`, `normalizeNode`, `toJSON`, `fromJSON`, `saveLocal`, `loadLocal`, `downloadJSON`, `readImportedFile`) match their definitions.

**Open risk to watch during execution:** `editUpdateFields` deliberately does NOT call `renderDetail()` (to preserve input focus), but it must keep `state.__visible` fresh — handled by recomputing it inside the function. If live title editing ever loses focus, that's the place to check.
```

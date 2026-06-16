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

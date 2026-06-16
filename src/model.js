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

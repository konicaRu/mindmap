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

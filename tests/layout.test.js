import { test } from "node:test";
import assert from "node:assert/strict";
import { subtreeWeight, getRadius, getNodeSize, computeStableLayout } from "../src/layout.js";

function node(id, children = []) {
  return { id, position: { dx: 0, dy: 0 }, children };
}

test("subtreeWeight counts leaves (a leaf weighs 1)", () => {
  assert.equal(subtreeWeight(node("leaf")), 1);
  const t = node("r", [node("a", [node("a1"), node("a2")]), node("b")]);
  assert.equal(subtreeWeight(t), 3);
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

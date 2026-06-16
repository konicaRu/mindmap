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

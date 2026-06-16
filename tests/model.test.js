import { test } from "node:test";
import assert from "node:assert/strict";
import { makeId, walk, findNode, findParent, addChild, deleteSubtree, reparent, setPosition, updateFields, makeEmptyNode } from "../src/model.js";

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
  assert.equal(findNode(tree, "a1").id, "a1");
});

test("reparent rejects moving a node into its own descendant (cycle)", () => {
  const tree = sample();
  assert.equal(reparent(tree, "a", "a1"), false);
  assert.equal(findParent(tree, "a").id, "r");
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

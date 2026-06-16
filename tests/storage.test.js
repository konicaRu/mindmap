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

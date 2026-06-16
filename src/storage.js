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

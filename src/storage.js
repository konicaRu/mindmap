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

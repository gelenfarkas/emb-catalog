export function requireElements(selectors, statusSelector = "#status") {
  const elements = {};
  const missing = [];

  for (const selector of selectors) {
    const key = selector.replace(/^#/, "");
    const element = document.querySelector(selector);
    if (!element) missing.push(selector);
    elements[key] = element;
  }

  if (missing.length) {
    const message = `Hiányzó kötelező DOM elemek: ${missing.join(", ")}`;
    const status = document.querySelector(statusSelector);
    if (status) {
      status.className = "notice notice--error";
      status.textContent = message;
    }
    console.error(message, { missing });
    throw new Error(message);
  }

  return elements;
}

export function showStatus(element, message, type = "info") {
  element.className = `notice notice--${type}`;
  element.textContent = message;
}

export function parseNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

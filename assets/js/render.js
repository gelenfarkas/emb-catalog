import { appendVersion } from "./cache-utils.js";

const { DEFAULT_AFFILIATE_USERNAME, buildAffiliateUrl } = await import(appendVersion("./normalizer.js"));

export function renderProducts(container, products, template, options = {}) {
  container.textContent = "";
  const fragment = document.createDocumentFragment();
  const mode = options.mode || "public";

  for (const product of products || []) {
    const node = template.content.firstElementChild.cloneNode(true);
    const imageLink = node.querySelector(".product-image");
    const image = node.querySelector("img");
    const badges = node.querySelector(".badges");
    const title = node.querySelector("h3");
    const price = node.querySelector(".price");
    const meta = node.querySelector(".meta");
    const cardActions = node.querySelector(".card-actions");
    const actionLink = node.querySelector(".card-actions .affiliate-link");
    const href = resolveAffiliateHref(product);
    const copyHref = resolveCopyHref(product);

    image.loading = "lazy";
    image.decoding = "async";
    image.width = 320;
    image.height = 320;
    image.src = product.image;
    image.alt = product.title;
    image.onerror = () => {
      image.src =
        "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20600%20600'%3E%3Crect%20width='600'%20height='600'%20fill='%23efebe3'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20font-family='Arial'%20font-size='28'%20fill='%2368665f'%3ENincs%20k%C3%A9p%3C/text%3E%3C/svg%3E";
    };

    imageLink.href = href;
    title.textContent = product.title;

    for (const category of product.categories?.length ? product.categories : [product.categoryLabel || "Egyéb"]) {
      badges.appendChild(createBadge(category));
    }

    if (product.datasetCount > 1) {
      badges.appendChild(createBadge(`${product.datasetCount} datasetben`));
    }

    price.innerHTML = `
      <strong>${escapeHtml(product.approxHuf || "Ár nincs megadva")}</strong>
      <small>${escapeHtml(product.priceLabel || "")}</small>
    `;
    price.insertAdjacentHTML("afterend", renderShippingEstimate(product));
    meta.appendChild(createMetaRow("Bolt", product.sellerName));
    meta.appendChild(createMetaRow("TID", product.itemId || "nincs adat"));

    if (mode === "admin") {
      meta.appendChild(createMetaRow("Forrás", product.source || "nincs adat"));
      meta.appendChild(createMetaRow("Fájl", (product.datasetLabels || []).join(", ")));
    }

    for (const link of [imageLink, actionLink]) {
      if (!link) continue;
      link.href = href;
      if (href === "#") link.setAttribute("aria-disabled", "true");
    }

    if (cardActions) {
      cardActions.appendChild(createCopyLinkButton(copyHref));
    }

    fragment.appendChild(node);
  }

  container.appendChild(fragment);
}

export function renderDatasets(container, datasets) {
  container.textContent = "";

  if (!datasets.length) {
    container.innerHTML = `<div class="empty">Még nincs betöltött dataset.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const dataset of datasets) {
    const item = document.createElement("article");
    item.className = "dataset-item";
    item.innerHTML = `
      <strong>${escapeHtml(dataset.label)}</strong>
      <small>${escapeHtml(dataset.path || "kézi import")}</small>
      <span>${escapeHtml((dataset.categories || []).join(", "))} · ${dataset.itemCount || 0} termék</span>
      <small>${escapeHtml(dataset.generatedAt || dataset.loadedAt || "")}</small>
    `;
    fragment.appendChild(item);
  }
  container.appendChild(fragment);
}

export function fillSelect(select, values, labelForAll) {
  const current = select.value;
  select.textContent = "";
  select.appendChild(new Option(labelForAll, ""));

  for (const value of values || []) {
    select.appendChild(new Option(value, value));
  }

  if ((values || []).includes(current)) select.value = current;
}

export function renderCategoryNav(container, categories, onSelect) {
  container.textContent = "";
  for (const category of categories || []) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => onSelect(category));
    container.appendChild(button);
  }
}

export function renderActiveFilters(container, filters) {
  container.textContent = "";
  for (const filter of filters || []) {
    if (!filter.value) continue;
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${filter.label}: ${filter.value}`;
    container.appendChild(chip);
  }
}

export function resolveAffiliateHref(product) {
  if (product.affiliateUrl) return product.affiliateUrl;

  const generated = buildAffiliateUrl({
    url: product.url,
    itemId: product.itemId,
    tp: product.tp,
    inviter: DEFAULT_AFFILIATE_USERNAME,
  });

  return generated && generated.includes("inviter=") ? generated : "#";
}

function renderShippingEstimate(product) {
  const estimate = product.shippingEstimate || {};
  const value = estimate.displayHuf || product.shippingEstimateLabel || "Ismeretlen";
  const detail = estimate.known
    ? `${escapeHtml(estimate.sourceCategory || "Kategória")} alapján, tájékoztató becslés`
    : "A kategória alapján nem becsülhető megbízhatóan";

  return `
    <div class="shipping-estimate" title="A szállítási díj tájékoztató jellegű becslés kategória és becsült méret alapján.">
      <span>Becsült DHL szállítás</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${detail}</small>
    </div>
  `;
}

function resolveCopyHref(product) {
  if (product.affiliateUrl) return product.affiliateUrl;

  const generated = buildAffiliateUrl({
    url: product.url,
    itemId: product.itemId,
    tp: product.tp,
    inviter: DEFAULT_AFFILIATE_USERNAME,
  });

  return generated && generated !== "#" ? generated : product.url || "";
}

function createCopyLinkButton(href) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn--ghost copy-link-btn";
  button.textContent = "Link másolása";
  button.addEventListener("click", async () => {
    try {
      await copyToClipboard(href);
      button.textContent = "Kimásolva ✓";
      window.setTimeout(() => {
        button.textContent = "Link másolása";
      }, 2000);
    } catch (error) {
      console.error("Link másolása nem sikerült", error);
      button.textContent = "Nem sikerült";
      window.setTimeout(() => {
        button.textContent = "Link másolása";
      }, 2000);
    }
  });
  return button;
}

async function copyToClipboard(text) {
  const value = String(text || "");
  if (!value) throw new Error("Nincs másolható link.");

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      console.warn("Clipboard API fallback aktiválva", error);
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand("copy")) throw new Error("execCommand copy sikertelen.");
  } finally {
    textarea.remove();
  }
}

function createBadge(text) {
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = text;
  return badge;
}

function createMetaRow(label, value) {
  const wrapper = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value || "-";
  wrapper.append(dt, dd);
  return wrapper;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

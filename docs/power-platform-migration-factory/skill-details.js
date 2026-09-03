(() => {
  const themeChoices = Array.from(document.querySelectorAll("[data-theme-choice]"));
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));

  const productIcon = (product) => `
    <span class="product-icon" title="${escapeHtml(product.label)}">
      <img src="${escapeHtml(product.icon)}" alt="" aria-hidden="true">
      <span>${escapeHtml(product.label)}</span>
    </span>`;

  const updateThemeChoices = () => {
    const theme = document.documentElement.dataset.theme || "light";
    themeChoices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.dataset.themeChoice === theme));
    });
  };

  themeChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
      const next = choice.dataset.themeChoice || "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("ppSkillTheme", next);
      updateThemeChoices();
    });
  });
  updateThemeChoices();

  fetch("data/catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      const item = catalog.details[id];
      if (!item) throw new Error("Skill documentation not found in generated catalog.");
      document.title = `${item.title} documentation | ${catalog.pageTitle}`;
      document.getElementById("docs-eyebrow").textContent = item.category;
      document.getElementById("docs-title").textContent = `${item.title} details`;
      document.getElementById("docs-summary").textContent = item.description;
      document.getElementById("docs-products").innerHTML = (item.products || []).map(productIcon).join("");
      document.getElementById("docs-install").textContent = item.install;
      document.getElementById("docs-overview-link").href = `skill.html?id=${encodeURIComponent(id)}`;
      if (item.docsHtml) {
        document.getElementById("docs-content").innerHTML = item.docsHtml;
      } else {
        document.getElementById("docs-content").innerHTML = "<p>Formatted skill documentation is not available for this skill yet.</p>";
      }
    })
    .catch((error) => {
      document.getElementById("docs-title").textContent = "Skill documentation unavailable";
      document.getElementById("docs-summary").textContent = error.message;
    });
})();

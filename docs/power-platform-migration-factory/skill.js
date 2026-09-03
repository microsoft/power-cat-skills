(() => {
  const themeChoices = Array.from(document.querySelectorAll("[data-theme-choice]"));
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

  const listItems = (items = []) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

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

  const detailDocsUrl = (detailId) => `skill-details.html?id=${encodeURIComponent(detailId)}`;

  const renderImages = (images = []) => {
    return images.map((image) => `
      <figure class="detail-figure">
        <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">
        <figcaption>${escapeHtml(image.caption || image.alt)}</figcaption>
      </figure>`).join("");
  };

  fetch("data/catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      const item = catalog.details[id];
      if (!item) throw new Error("Skill not found in generated catalog.");
      document.title = `${item.title} | ${catalog.pageTitle}`;
      document.getElementById("detail-eyebrow").textContent = item.category;
      document.getElementById("detail-title").textContent = item.title;
      document.getElementById("detail-summary").textContent = item.description;
      document.getElementById("detail-products").innerHTML = (item.products || []).map(productIcon).join("");
      document.getElementById("detail-what").textContent = item.what;
      document.getElementById("detail-when").innerHTML = listItems(item.when);
      document.getElementById("detail-how").innerHTML = listItems(item.how);
      document.getElementById("detail-install").textContent = item.install;
      document.getElementById("detail-docs-link").href = detailDocsUrl(id);
      const visualSection = document.querySelector(".detail-visual-section");
      if (item.images?.length) {
        document.getElementById("detail-visuals").innerHTML = renderImages(item.images);
      } else {
        visualSection.remove();
      }
      if (!item.docsHtml) document.getElementById("detail-docs-link").remove();
    })
    .catch((error) => {
      document.getElementById("detail-title").textContent = "Skill unavailable";
      document.getElementById("detail-summary").textContent = error.message;
    });
})();

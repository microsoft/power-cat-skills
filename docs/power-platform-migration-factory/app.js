(() => {
  const modal = document.getElementById("skill-modal");
  const title = document.getElementById("modal-title");
  const eyebrow = document.getElementById("modal-eyebrow");
  const what = document.getElementById("modal-what");
  const when = document.getElementById("modal-when");
  const how = document.getElementById("modal-how");
  const install = document.getElementById("modal-install");
  const source = document.getElementById("modal-source");
  const migrationGrid = document.getElementById("migration-grid");
  const skillGrid = document.getElementById("skill-grid");
  const marketTabs = document.getElementById("market-tabs");
  const resultCount = document.querySelector(".result-count");
  const skillResultsLabel = document.getElementById("skill-results-label");
  const skillResultsCount = document.getElementById("skill-results-count");
  const exploreMoreMigration = document.getElementById("explore-more-migration");
  const themeChoices = Array.from(document.querySelectorAll("[data-theme-choice]"));
  const migrationCategoryId = "migration-power-platform";
  const visibleMigrationTrackCount = 3;
  let catalog = null;
  let selectedCategory = "all";

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));

  const pill = (value, accent = false) =>
    `<span class="pill${accent ? " pill-accent" : ""}">${escapeHtml(value)}</span>`;

  const productIcon = (product) => `
    <span class="product-icon" title="${escapeHtml(product.label)}">
      <img src="${escapeHtml(product.icon)}" alt="" aria-hidden="true">
      <span>${escapeHtml(product.label)}</span>
    </span>`;

  const productIcons = (products = []) =>
    `<div class="product-icons" aria-label="Related products">${products.map(productIcon).join("")}</div>`;

  const detailUrl = (detailId) => `skill.html?id=${encodeURIComponent(detailId)}`;

  const listItems = (items = []) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const closeModal = () => {
    modal.dataset.open = "false";
  };

  const openSkill = (detailId) => {
    const skill = catalog?.details?.[detailId];
    if (!skill) return;
    eyebrow.textContent = skill.category;
    title.textContent = skill.title;
    what.textContent = skill.what;
    when.innerHTML = listItems(skill.when);
    how.innerHTML = listItems(skill.how);
    install.textContent = skill.install;
    source.href = detailUrl(detailId);
    modal.dataset.open = "true";
    document.getElementById("modal-close").focus();
  };

  const renderMigrationTrack = (track) => {
    const isSkill = track.kind === "skill";
    const className = "need-card";
    const body = [
      `<div class="card-topline">${productIcons(track.products)}</div>`,
      `<strong>${escapeHtml(track.title)}</strong>`,
      `<span>${escapeHtml(track.description)}</span>`,
      `<small>${escapeHtml(track.cta)}${isSkill ? " →" : ""}</small>`,
    ].join("");
    return isSkill
      ? `<a class="${className}" href="${escapeHtml(detailUrl(track.detailId))}" aria-label="${escapeHtml(track.title)} migration skill">${body}</a>`
      : `<a class="${className}" href="${escapeHtml(track.source)}" target="_blank" rel="noopener" aria-label="${escapeHtml(track.title)}">${body}</a>`;
  };

  const renderSkillCard = (skill) => `
    <a class="lab-card" href="${escapeHtml(detailUrl(skill.detailId))}" data-category="${escapeHtml(skill.categoryId)}">
      <div class="card-topline">
        <div class="lab-meta">${pill(skill.categoryLabel)}${skill.tags?.[1] ? pill(skill.tags[1], true) : ""}</div>
        ${productIcons(skill.products)}
      </div>
      <h3>${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.description)}</p>
      <div class="tags">${(skill.tags || []).slice(1, 3).map((tag) => pill(tag)).join("")}</div>
      <div class="lab-footer"><span class="coming-soon">Skill</span><span class="lab-link">View skill details →</span></div>
    </a>`;

  const updateSkillFilter = (categoryId) => {
    selectedCategory = categoryId;
    marketTabs.querySelectorAll("[data-category-filter]").forEach((tab) => {
      tab.setAttribute("aria-pressed", String(tab.dataset.categoryFilter === categoryId));
    });
    const visibleSkills = catalog.skills.filter((skill) => categoryId === "all" || skill.categoryId === categoryId);
    const label = categoryId === "all"
      ? "public skills"
      : `${catalog.categories.find((category) => category.id === categoryId)?.label || "Category"} skills`;
    resultCount.textContent = `${visibleSkills.length} ${label}`;
    skillResultsLabel.textContent = categoryId === "all"
      ? "All marketplace skills"
      : catalog.categories.find((category) => category.id === categoryId)?.label || "Selected skills";
    skillResultsCount.textContent = `${visibleSkills.length} ${visibleSkills.length === 1 ? "skill" : "skills"}`;
    skillGrid.classList.remove("is-transitioning");
    skillGrid.innerHTML = visibleSkills.map(renderSkillCard).join("");
    requestAnimationFrame(() => skillGrid.classList.add("is-transitioning"));
  };

  const renderCatalog = (payload) => {
    catalog = payload;
    migrationGrid.innerHTML = catalog.migrationTracks.slice(0, visibleMigrationTrackCount).map(renderMigrationTrack).join("");
    marketTabs.innerHTML = [
      { id: "all", label: "All" },
      ...catalog.categories,
    ].map((category) =>
      `<button class="market-tab" type="button" data-category-filter="${escapeHtml(category.id)}" aria-pressed="${category.id === "all"}">${escapeHtml(category.label)}</button>`
    ).join("");
    updateSkillFilter(selectedCategory);
  };

  fetch("data/catalog.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then(renderCatalog)
    .catch((error) => {
      migrationGrid.innerHTML = `<div class="need-card"><strong>Catalog unavailable</strong><span>${escapeHtml(error.message)}</span><small>Run the catalog generator</small></div>`;
      skillGrid.innerHTML = `<div class="need-card"><strong>Skills unavailable</strong><span>Run <code>node scripts/build-pages-catalog.js</code> and refresh the page.</span></div>`;
      resultCount.textContent = "Catalog unavailable";
    });

  marketTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-category-filter]");
    if (tab) updateSkillFilter(tab.dataset.categoryFilter);
  });
  exploreMoreMigration?.addEventListener("click", () => {
    updateSkillFilter(migrationCategoryId);
  });

  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  const updateThemeChoices = () => {
    const theme = document.documentElement.dataset.theme || "light";
    themeChoices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.dataset.themeChoice === theme));
    });
  };
  updateThemeChoices();
  themeChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
      const next = choice.dataset.themeChoice || "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("ppSkillTheme", next);
      updateThemeChoices();
    });
  });
})();

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
  let catalog = null;
  let selectedPlugin = "all";

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));

  const pill = (value, accent = false) =>
    `<span class="pill${accent ? " pill-accent" : ""}">${escapeHtml(value)}</span>`;

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
    source.href = skill.source;
    modal.dataset.open = "true";
    document.getElementById("modal-close").focus();
  };

  const renderMigrationTrack = (track, index) => {
    const isSkill = track.kind === "skill";
    const className = index === 0 ? "need-card guidance-card" : "need-card";
    const body = [
      `<strong>${escapeHtml(track.title)}</strong>`,
      `<span>${escapeHtml(track.description)}</span>`,
      `<small>${escapeHtml(track.cta)}${isSkill ? " →" : ""}</small>`,
    ].join("");
    return isSkill
      ? `<button class="${className}" type="button" data-detail-id="${escapeHtml(track.detailId)}" aria-label="${escapeHtml(track.title)} migration skill">${body}</button>`
      : `<a class="${className}" href="${escapeHtml(track.source)}" target="_blank" rel="noopener" aria-label="${escapeHtml(track.title)}">${body}</a>`;
  };

  const renderSkillCard = (skill) => `
    <button class="lab-card" type="button" data-plugin="${escapeHtml(skill.plugin)}" data-detail-id="${escapeHtml(skill.detailId)}">
      <div class="lab-meta">${pill(skill.pluginLabel)}${skill.tags?.[1] ? pill(skill.tags[1], true) : ""}</div>
      <h3>${escapeHtml(skill.title)}</h3>
      <p>${escapeHtml(skill.description)}</p>
      <div class="tags">${(skill.tags || []).slice(1, 3).map((tag) => pill(tag)).join("")}</div>
      <div class="lab-footer"><span class="coming-soon">Skill</span><span class="lab-link">Learn more →</span></div>
    </button>`;

  const updateSkillFilter = (pluginId) => {
    selectedPlugin = pluginId;
    marketTabs.querySelectorAll("[data-plugin-filter]").forEach((tab) => {
      tab.setAttribute("aria-pressed", String(tab.dataset.pluginFilter === pluginId));
    });
    const visibleSkills = catalog.skills.filter((skill) => pluginId === "all" || skill.plugin === pluginId);
    const label = pluginId === "all"
      ? "public skills"
      : `${catalog.plugins.find((plugin) => plugin.id === pluginId)?.label || "Plugin"} skills`;
    resultCount.textContent = `${visibleSkills.length} ${label}`;
    skillGrid.innerHTML = visibleSkills.map(renderSkillCard).join("");
  };

  const renderCatalog = (payload) => {
    catalog = payload;
    migrationGrid.innerHTML = catalog.migrationTracks.map(renderMigrationTrack).join("");
    marketTabs.innerHTML = [
      { id: "all", label: "All" },
      ...catalog.plugins,
    ].map((plugin) =>
      `<button class="market-tab" type="button" data-plugin-filter="${escapeHtml(plugin.id)}" aria-pressed="${plugin.id === "all"}">${escapeHtml(plugin.label)}</button>`
    ).join("");
    updateSkillFilter(selectedPlugin);
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

  migrationGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-detail-id]");
    if (card) openSkill(card.dataset.detailId);
  });

  skillGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-detail-id]");
    if (card) openSkill(card.dataset.detailId);
  });

  marketTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-plugin-filter]");
    if (tab) updateSkillFilter(tab.dataset.pluginFilter);
  });

  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  document.getElementById("theme-button").addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  });
})();

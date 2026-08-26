const API = "https://www.themealdb.com/api/json/v1/1";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const safeJSON = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

const state = {
  meals: [],
  favorites: safeJSON('savora-favorites', []),
  shown: 8,
  view: 'discover',
  layout: localStorage.getItem('savora-layout') || 'grid',
  category: '',
  area: '',
  region: '',
  search: '',
  heroMeals: [],
  language: localStorage.getItem('savora-language') || 'en'
};

const elements = {
  header: $('#siteHeader'),
  searchForm: $('#searchForm'),
  searchInput: $('#searchInput'),
  categoryGrid: $('#categoryGrid'),
  regionGrid: $('#regionGrid'),
  languageSelect: $('#languageSelect'),
  areaFilter: $('#areaFilter'),
  recipeGrid: $('#recipeGrid'),
  status: $('#statusCard'),
  loadMore: $('#loadMore'),
  sectionLabel: $('#sectionLabel'),
  sectionTitle: $('#sectionTitle'),
  resultCount: $('#resultCount'),
  activeFilter: $('#activeFilter'),
  activeFilterText: $('#activeFilterText'),
  favoriteCount: $('#favoriteCount'),
  modal: $('#recipeModal'),
  modalContent: $('#modalContent'),
  toast: $('#toast'),
  toastText: $('#toastText'),
  toastIcon: $('#toastIcon')
};

const categoryMeta = {
    Beef: ["🥩", "Rich & hearty"],
    Chicken: ["🍗", "Crowd favorites"],
    Dessert: ["🍰", "A sweet finish"],
    Lamb: ["🍖", "Bold & comforting"],
    Pasta: ["🍝", "Always satisfying"],
    Seafood: ["🦐", "Fresh from the sea"],
    Side: ["🥗", "Perfect pairings"],
    Starter: ["🥣", "Begin beautifully"],
    Vegan: ["🌿", "Plant-powered"],
    Vegetarian: ["🥕", "Full of goodness"],
    Breakfast: ["🍳", "Start the day"],
    Goat: ["🍲", "Deep flavors"],
};

const { localMeals, regions, translations } = window.SAVORA_DATA;
const t = (key) =>
    translations[state.language]?.[key] || translations.en[key] || key;

const categoryNames = {
    id: {
        Beef: "Daging sapi",
        Chicken: "Ayam",
        Dessert: "Hidangan penutup",
        Lamb: "Daging domba",
        Pasta: "Pasta",
        Seafood: "Hidangan laut",
        Side: "Pendamping",
        Starter: "Pembuka",
        Vegan: "Vegan",
        Vegetarian: "Vegetarian",
        Breakfast: "Sarapan",
        Goat: "Daging kambing",
        Rice: "Nasi",
        Soup: "Sup",
    },
    es: {
        Beef: "Carne",
        Chicken: "Pollo",
        Dessert: "Postre",
        Lamb: "Cordero",
        Pasta: "Pasta",
        Seafood: "Mariscos",
        Side: "Guarnición",
        Starter: "Entrante",
        Vegan: "Vegano",
        Vegetarian: "Vegetariano",
        Breakfast: "Desayuno",
        Goat: "Cabra",
        Rice: "Arroz",
        Soup: "Sopa",
    },
    fr: {
        Beef: "Bœuf",
        Chicken: "Poulet",
        Dessert: "Dessert",
        Lamb: "Agneau",
        Pasta: "Pâtes",
        Seafood: "Fruits de mer",
        Side: "Accompagnement",
        Starter: "Entrée",
        Vegan: "Végétalien",
        Vegetarian: "Végétarien",
        Breakfast: "Petit déjeuner",
        Goat: "Chèvre",
        Rice: "Riz",
        Soup: "Soupe",
    },
};

function localCategory(name) {
    return categoryNames[state.language]?.[name] || name;
}

const escapeHTML = (value = "") =>
    String(value).replace(
        /[&<>'"]/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
            })[char],
    );

function renderRegions() {
    elements.regionGrid.innerHTML = regions
        .map(
            (region) => `
    <button class="region-card ${state.region === region.id ? "active" : ""}" data-region="${region.id}" style="--region-color:${region.color}">
      <span class="region-flag">${region.flag}</span><strong>${escapeHTML(t(region.id))}</strong><small>${escapeHTML(t(`${region.id}Desc`))}</small><span class="region-arrow">→</span>
    </button>`,
        )
        .join("");
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  elements.languageSelect.value = state.language;
  $$('.nav-link')[0].textContent = t('discover');
  $$('.nav-link')[1].childNodes[0].nodeValue = `${t('cookbook')} `;
  $('.eyebrow').lastChild.nodeValue = ` ${t('eyebrow')}`;
  $('.hero h1').innerHTML = t('heroTitle');
  $('.hero-description').textContent = t('heroDescription');
  elements.searchInput.placeholder = t('searchPlaceholder');
  $('.search-bar button').innerHTML = `${t('explore')} <span>→</span>`;
  $('.popular-searches>span').textContent = t('popular');
  $('#randomButton').innerHTML = `<span>✦</span> ${t('surprise')}`;
  const trustLabels = $$('.trust-row div span');
  [t('curated'), t('cuisines'), t('free')].forEach((value, index) => { trustLabels[index].textContent = value; });
  $('.category-section .section-label').textContent = t('taste');
  $('#categoryTitle').textContent = t('craving');
  $('.category-section .section-intro>p').textContent = t('cravingDesc');
  $('#regionLabel').textContent = t('around'); $('#regionTitle').textContent = t('regionTitle'); $('#regionDescription').textContent = t('regionDesc');
  elements.areaFilter.options[0].textContent = t('allCuisines');
  $('#loadMore span').textContent = t('loadMore');
  $('.cta-section>.section-label').textContent = t('cantDecide');
  $('.cta-section h2').innerHTML = t('chance'); $('.cta-section p').textContent = t('chanceDesc');
  $('#randomCta').innerHTML = `${t('surprise')} <span>→</span>`;
  $('.footer-top p').textContent = t('footer'); $('.back-top').textContent = t('back');
  renderRegions();
  $$('.category-card').forEach(button => {
    $('strong', button).textContent = localCategory(button.dataset.category);
    $('small', button).textContent = t('inspiration');
  });
  if (state.view === 'favorites') { elements.sectionLabel.textContent = t('cookbook'); elements.sectionTitle.textContent = t('cookbook'); updateActiveFilter(); }
  else if (state.region) { elements.sectionLabel.textContent = t('around'); elements.sectionTitle.textContent = t(state.region); updateActiveFilter(`${t('around')}: ${t(state.region)}`); }
  else if (state.category) { elements.sectionLabel.textContent = t('taste'); elements.sectionTitle.textContent = localCategory(state.category); updateActiveFilter(`${t('category')}: ${localCategory(state.category)}`); }
  else if (state.area) { elements.sectionLabel.textContent = t('around'); updateActiveFilter(`${t('cuisine')}: ${state.area}`); }
  else if (state.search) { elements.sectionLabel.textContent = t('explore'); updateActiveFilter(`${t('explore')}: ${state.search}`); }
  else { elements.sectionLabel.textContent = t('handpicked'); elements.sectionTitle.textContent = t('today'); updateActiveFilter(); }
  renderMeals();
}

async function api(path) {
    const response = await fetch(`${API}/${path}`);
    if (!response.ok) throw new Error("The recipe service is unavailable.");
    return response.json();
}

function showToast(text, icon = "✓") {
    elements.toastText.textContent = text;
    elements.toastIcon.textContent = icon;
    elements.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(
        () => elements.toast.classList.remove("show"),
        2300,
    );
}

function showSkeletons() {
  elements.status.classList.add('hidden');
  elements.loadMore.classList.add('hidden');
  elements.recipeGrid.innerHTML = Array.from({ length: 8 }, () => `
    <article class="recipe-card skeleton-card" aria-hidden="true">
      <div class="card-image"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div>
    </article>`,
    ).join("");
}

function showStatus(icon, title, text) {
    elements.recipeGrid.innerHTML = "";
    elements.status.innerHTML = `<div class="status-icon">${icon}</div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span>`;
    elements.status.classList.remove("hidden");
    elements.loadMore.classList.add("hidden");
    elements.resultCount.textContent = "Nothing to display yet";
}

function isFavorite(id) {
    return state.favorites.some((meal) => meal.idMeal === String(id));
}

function mealCard(meal, index) {
    const category = meal.strCategory || state.category || "Recipe";
    const area = meal.strArea || state.area || "";
    const favorite = isFavorite(meal.idMeal);
    return `
    <article class="recipe-card" data-id="${escapeHTML(meal.idMeal)}" tabindex="0" aria-label="Open ${escapeHTML(meal.strMeal)} recipe">
      <div class="card-image">
        <img src="${escapeHTML(meal.strMealThumb)}" alt="${escapeHTML(meal.strMeal)}" loading="lazy" decoding="async">
        <div class="image-overlay"></div><span class="card-index">${String(index + 1).padStart(2, "0")}</span>
        <button class="favorite-button ${favorite ? "saved" : ""}" data-favorite="${escapeHTML(meal.idMeal)}" aria-label="${favorite ? "Remove from" : "Save to"} cookbook">${favorite ? "♥" : "♡"}</button>
      </div>
      <div class="recipe-card-body">
        <div class="card-meta"><span>${escapeHTML(localCategory(category))}</span>${area ? `<span>${escapeHTML(area)}</span>` : ""}</div>
        <h3>${escapeHTML(meal.strMeal)}</h3>
        <div class="card-footer"><span>${escapeHTML(t("inspiration"))}</span><span class="open-label">${escapeHTML(t("viewRecipe"))}</span></div>
      </div>
    </article>`;
}

function currentSource() {
  return state.view === 'favorites' ? state.favorites : state.meals;
}

function renderMeals() {
    const source = currentSource();
    elements.status.classList.add("hidden");
    elements.recipeGrid.classList.toggle("list-mode", state.layout === "list");
    if (!source.length) {
        showStatus(
            state.view === "favorites" ? "♡" : "⌕",
            state.view === "favorites" ? t("empty") : t("noResults"),
            state.view === "favorites" ? t("emptyDesc") : t("noResultsDesc"),
        );
        return;
    }
    const visible = source.slice(0, state.shown);
    elements.recipeGrid.innerHTML = visible.map(mealCard).join("");
    elements.resultCount.textContent = t("results")
        .replace("{shown}", visible.length)
        .replace("{total}", source.length);
    elements.loadMore.classList.toggle(
        "hidden",
        visible.length >= source.length,
    );
}

function updateNavigation() {
    $$(".nav-link").forEach((button) =>
        button.classList.toggle("active", button.dataset.view === state.view),
    );
    elements.favoriteCount.textContent = state.favorites.length;
}

function updateActiveFilter(text = "") {
    elements.activeFilter.classList.toggle("hidden", !text);
    elements.activeFilterText.textContent = text;
}

function setHeroMeals(meals) {
    if (meals.length < 3) return;
    state.heroMeals = meals.slice(0, 3);
    const [main, first, second] = state.heroMeals;
    $("#heroMainImage").style.backgroundImage = `url('${main.strMealThumb}')`;
    $("#heroMainImage").classList.remove("skeleton-bg");
    $("#heroMainTitle").textContent = main.strMeal;
    $("#heroMainCard").dataset.id = main.idMeal;
    const miniCards = [
        ["#heroMiniOne", first],
        ["#heroMiniTwo", second],
    ];
    miniCards.forEach(([selector, meal]) => {
        const card = $(selector);
        $(".mini-image", card).style.backgroundImage =
            `url('${meal.strMealThumb}')`;
        $(".mini-image", card).classList.remove("skeleton-bg");
        $("span", card).textContent = meal.strMeal;
        card.dataset.id = meal.idMeal;
    });
}

async function loadFeatured({ scroll = false } = {}) {
  state.view = 'discover'; state.category = ''; state.area = ''; state.region = ''; state.search = ''; state.shown = 8;
  elements.areaFilter.value = '';
  updateNavigation(); updateActiveFilter(); updateCategorySelection(); updateRegionSelection(); showSkeletons();
  elements.sectionLabel.textContent = t('handpicked'); elements.sectionTitle.textContent = t('today');
  try {
    const batches = await Promise.all(['chicken', 'pasta', 'salmon', 'curry'].map(term => api(`search.php?s=${term}`)));
    const unique = new Map();
    batches.flatMap(batch => batch.meals || []).forEach(meal => unique.set(meal.idMeal, meal));
    state.meals = [...unique.values()];
    setHeroMeals(state.meals);
    renderMeals();
    if (scroll) scrollToRecipes();
  } catch {
    showStatus('!', 'Could not load recipes', 'Check your connection and refresh the page.');
  }
}

async function searchMeals(term) {
  term = term.trim();
  if (!term) return loadFeatured({ scroll: true });
  state.view = 'discover'; state.category = ''; state.area = ''; state.region = ''; state.search = term; state.shown = 8;
  elements.areaFilter.value = '';
  updateNavigation(); updateCategorySelection(); updateRegionSelection(); updateActiveFilter(`${t('explore')}: ${term}`); showSkeletons();
  elements.sectionLabel.textContent = t('explore'); elements.sectionTitle.textContent = `“${term}”`;
  try {
    const data = await api(`search.php?s=${encodeURIComponent(term)}`);
    const localMatches = localMeals.filter(meal => `${meal.strMeal} ${meal.strCategory} ${meal.strArea}`.toLowerCase().includes(term.toLowerCase()));
    state.meals = [...localMatches, ...(data.meals || [])];
    renderMeals(); scrollToRecipes();
  } catch {
    showStatus('!', 'Search is unavailable', 'Please wait a moment and try again.');
  }
}

async function filterMeals(type, value) {
  state.view = 'discover'; state.shown = 8; state.search = ''; state.region = '';
  if (type === 'c') { state.category = value; state.area = ''; elements.areaFilter.value = ''; }
  else { state.area = value; state.category = ''; }
  updateNavigation(); updateCategorySelection(); updateRegionSelection(); updateActiveFilter(`${type === 'c' ? t('category') : t('cuisine')}: ${value}`); showSkeletons();
  elements.sectionLabel.textContent = type === 'c' ? 'Explore by taste' : 'Explore the world';
  elements.sectionTitle.textContent = type === 'c' ? localCategory(value) : value;
  try {
    const data = await api(`filter.php?${type}=${encodeURIComponent(value)}`);
    state.meals = data.meals || [];
    renderMeals(); scrollToRecipes();
  } catch {
    showStatus('!', 'This filter is unavailable', 'Please wait a moment and try again.');
  }
}

async function loadFilters() {
  try {
    const [categoryData, areaData] = await Promise.all([api('list.php?c=list'), api('list.php?a=list')]);
    const categories = (categoryData.meals || []).filter(item => item.strCategory !== 'Miscellaneous').slice(0, 12);
    elements.categoryGrid.innerHTML = categories.map(item => {
      const [icon, subtitle] = categoryMeta[item.strCategory] || ['🍽️', 'Discover recipes'];
      return `<button class="category-card" data-category="${escapeHTML(item.strCategory)}"><span class="category-icon">${icon}</span><strong>${escapeHTML(localCategory(item.strCategory))}</strong><small>${escapeHTML(state.language === 'en' ? subtitle : t('inspiration'))}</small></button>`;
    }).join('');
    elements.areaFilter.innerHTML += (areaData.meals || []).map(item => `<option value="${escapeHTML(item.strArea)}">${escapeHTML(item.strArea)}</option>`).join('');
  } catch {
    elements.categoryGrid.innerHTML = '<div class="status-card"><strong>Categories unavailable</strong><span>You can still search for any meal above.</span></div>';
  }
}

function updateCategorySelection() {
    $$(".category-card").forEach((button) =>
        button.classList.toggle(
            "active",
            button.dataset.category === state.category,
        ),
    );
}

function updateRegionSelection() {
    $$(".region-card").forEach((button) =>
        button.classList.toggle(
            "active",
            button.dataset.region === state.region,
        ),
    );
}

async function loadRegion(regionId) {
  const region = regions.find(item => item.id === regionId);
  if (!region) return;
  state.view = 'discover'; state.category = ''; state.area = ''; state.search = ''; state.region = regionId; state.shown = 8;
  elements.areaFilter.value = '';
  updateNavigation(); updateCategorySelection(); updateRegionSelection(); updateActiveFilter(`${t('around')}: ${t(regionId)}`); showSkeletons();
  elements.sectionLabel.textContent = t('around'); elements.sectionTitle.textContent = t(regionId);

    if (regionId === "indonesia") {
        state.meals = localMeals;
        renderMeals();
        scrollToRecipes();
        return;
    }

    try {
        const batches = await Promise.allSettled(
            region.areas.map((area) =>
                api(`filter.php?a=${encodeURIComponent(area)}`),
            ),
        );
        const unique = new Map();
        batches.forEach((result, index) => {
            if (result.status !== "fulfilled") return;
            (result.value.meals || [])
                .slice(0, 7)
                .forEach((meal) =>
                    unique.set(meal.idMeal, {
                        ...meal,
                        strArea: meal.strArea || region.areas[index],
                    }),
                );
        });
        state.meals = [...unique.values()];
        renderMeals();
        scrollToRecipes();
    } catch {
        showStatus("!", t("noResults"), t("noResultsDesc"));
    }
}

async function loadAllWorld() {
  if (state.allMealsCache.length) {
    state.meals = state.allMealsCache;
    renderMeals(); scrollToRecipes();
    return;
  }

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const unique = new Map(localMeals.map(meal => [meal.idMeal, meal]));

  try {
    for (let index = 0; index < letters.length; index += 5) {
      const batch = letters.slice(index, index + 5);
      const results = await Promise.allSettled(batch.map(letter => api(`search.php?f=${letter}`)));
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          (result.value.meals || []).forEach(meal => unique.set(meal.idMeal, meal));
        }
      });
      elements.resultCount.textContent = `${t('loadingCatalog')} ${Math.min(index + 5, letters.length)}/${letters.length} · ${unique.size}`;
    }
    state.allMealsCache = [...unique.values()];
    state.meals = state.allMealsCache;
    renderMeals(); scrollToRecipes();
  } catch {
    state.meals = [...unique.values()];
    if (state.meals.length) renderMeals();
    else showStatus('!', t('noResults'), t('noResultsDesc'));
  }
}

async function getMeal(id) {
    const cached = [...state.meals, ...state.favorites].find(
        (meal) => meal.idMeal === String(id),
    );
    if (cached?.strInstructions) return cached;
    const data = await api(`lookup.php?i=${encodeURIComponent(id)}`);
    return data.meals?.[0];
}

function getIngredients(meal) {
    return Array.from({ length: 20 }, (_, index) => {
        const name = meal[`strIngredient${index + 1}`]?.trim();
        const measure = meal[`strMeasure${index + 1}`]?.trim();
        return name ? { name, measure } : null;
    }).filter(Boolean);
}

async function openRecipe(id) {
    elements.modalContent.innerHTML = `<div class="status-card"><div class="status-icon">✦</div><strong>${escapeHTML(t("loading"))}</strong><span>${escapeHTML(t("fetching"))}</span></div>`;
    elements.modal.showModal();
    document.body.classList.add("modal-open");
    try {
        const meal = await getMeal(id);
        if (!meal) throw new Error("Recipe not found");
        const ingredients = getIngredients(meal);
        const favorite = isFavorite(meal.idMeal);
        const instructions =
            state.language === "id" && meal.strInstructionsId
                ? meal.strInstructionsId
                : meal.strInstructions;
        elements.modalContent.innerHTML = `
      <div class="modal-hero" style="background-image:url('${escapeHTML(meal.strMealThumb)}')">
        <div class="modal-heading"><div class="modal-tags"><span>${escapeHTML(localCategory(meal.strCategory || "Recipe"))}</span><span>${escapeHTML(meal.strArea || "International")}</span></div><h2>${escapeHTML(meal.strMeal)}</h2></div>
      </div>
      <div class="modal-body">
        <div class="modal-summary"><div class="recipe-facts"><div><strong>${ingredients.length}</strong><span>${escapeHTML(t("ingredients"))}</span></div><div><strong>${escapeHTML(meal.strArea || "World")}</strong><span>${escapeHTML(t("cuisine"))}</span></div><div><strong>${escapeHTML(localCategory(meal.strCategory || "Meal"))}</strong><span>${escapeHTML(t("category"))}</span></div></div><div class="modal-actions"><button class="modal-action ${favorite ? "primary" : ""}" data-modal-favorite="${escapeHTML(meal.idMeal)}">${favorite ? `♥ ${escapeHTML(t("saved"))}` : `♡ ${escapeHTML(t("save"))}`}</button><button class="modal-action" data-share="${escapeHTML(meal.idMeal)}">↗ ${escapeHTML(t("share"))}</button></div></div>
        <div class="modal-columns"><div><h3>${escapeHTML(t("ingredients"))}</h3><ul class="ingredient-list">${ingredients.map((item) => `<li><span>${escapeHTML(item.name)}</span><b>${escapeHTML(item.measure)}</b></li>`).join("")}</ul></div><div><h3>${escapeHTML(t("method"))}</h3><div class="instructions">${escapeHTML(instructions || "Instructions are not available.")}</div>${meal.strYoutube ? `<a class="source-link" href="${escapeHTML(meal.strYoutube)}" target="_blank" rel="noreferrer">Watch the cooking video ↗</a>` : meal.strSource ? `<a class="source-link" href="${escapeHTML(meal.strSource)}" target="_blank" rel="noreferrer">View original recipe ↗</a>` : ""}</div></div>
      </div>`;
    } catch {
        elements.modalContent.innerHTML =
            '<div class="status-card"><div class="status-icon">!</div><strong>Could not load this recipe</strong><span>Close this window and try again.</span></div>';
    }
}

async function toggleFavorite(id) {
    if (isFavorite(id)) {
        state.favorites = state.favorites.filter(
            (meal) => meal.idMeal !== String(id),
        );
        showToast("Removed from your cookbook", "♡");
    } else {
        const meal = await getMeal(id);
        if (!meal) return;
        state.favorites.push(meal);
        showToast("Saved to your cookbook", "♥");
    }
    localStorage.setItem("savora-favorites", JSON.stringify(state.favorites));
    updateNavigation();
    renderMeals();
    const modalButton = $("[data-modal-favorite]");
    if (modalButton?.dataset.modalFavorite === String(id)) {
        const nowSaved = isFavorite(id);
        modalButton.classList.toggle("primary", nowSaved);
        modalButton.textContent = nowSaved
            ? `♥ ${t("saved")}`
            : `♡ ${t("save")}`;
    }
}

async function randomRecipe() {
    showToast("Finding something delicious…", "✦");
    try {
        const data = await api("random.php");
        if (data.meals?.[0]) openRecipe(data.meals[0].idMeal);
    } catch {
        showToast("Could not find a recipe", "!");
    }
}

async function shareRecipe(id) {
    const meal = await getMeal(id);
    const shareData = {
        title: `${meal.strMeal} — Savora`,
        text: `Try this ${meal.strMeal} recipe!`,
        url: location.href.split("#")[0],
    };
    try {
        if (navigator.share) await navigator.share(shareData);
        else {
            await navigator.clipboard.writeText(
                `${shareData.text} ${shareData.url}`,
            );
            showToast("Recipe link copied", "↗");
        }
    } catch (error) {
        if (error.name !== "AbortError")
            showToast("Could not share recipe", "!");
    }
}

function scrollToRecipes() {
    $("#recipesSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

elements.searchForm.addEventListener('submit', event => { event.preventDefault(); searchMeals(elements.searchInput.value); });
$$('[data-search]').forEach(button => button.addEventListener('click', () => { elements.searchInput.value = button.dataset.search; searchMeals(button.dataset.search); }));
elements.categoryGrid.addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) filterMeals('c', button.dataset.category); });
elements.regionGrid.addEventListener('click', event => { const button = event.target.closest('[data-region]'); if (button) loadRegion(button.dataset.region); });
elements.areaFilter.addEventListener('change', () => elements.areaFilter.value ? filterMeals('a', elements.areaFilter.value) : loadFeatured({ scroll: true }));
$('#clearFilter').addEventListener('click', () => { elements.searchInput.value = ''; loadFeatured({ scroll: true }); });
elements.loadMore.addEventListener('click', () => { state.shown += 8; renderMeals(); });

elements.recipeGrid.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
        event.stopPropagation();
        toggleFavorite(favorite.dataset.favorite);
        return;
    }
    const card = event.target.closest("[data-id]");
    if (card) openRecipe(card.dataset.id);
});
elements.recipeGrid.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("[data-id]"))
        openRecipe(event.target.dataset.id);
});
$$("#heroMainCard,#heroMiniOne,#heroMiniTwo").forEach((card) =>
    card.addEventListener(
        "click",
        () => card.dataset.id && openRecipe(card.dataset.id),
    ),
);

$$('.nav-link').forEach(button => button.addEventListener('click', () => {
  state.view = button.dataset.view; state.shown = 8; updateNavigation(); updateActiveFilter();
  if (state.view === 'favorites') { elements.sectionLabel.textContent = t('cookbook'); elements.sectionTitle.textContent = t('cookbook'); renderMeals(); scrollToRecipes(); }
  else loadFeatured({ scroll: true });
}));

$("#gridView").addEventListener("click", () => {
    state.layout = "grid";
    localStorage.setItem("savora-layout", state.layout);
    $("#gridView").classList.add("active");
    $("#listView").classList.remove("active");
    renderMeals();
});
$("#listView").addEventListener("click", () => {
    state.layout = "list";
    localStorage.setItem("savora-layout", state.layout);
    $("#listView").classList.add("active");
    $("#gridView").classList.remove("active");
    renderMeals();
});
if (state.layout === "list") {
    $("#listView").classList.add("active");
    $("#gridView").classList.remove("active");
}

$("#randomButton").addEventListener("click", randomRecipe);
$("#randomCta").addEventListener("click", randomRecipe);
$("#modalClose").addEventListener("click", () => elements.modal.close());
elements.modal.addEventListener("close", () =>
    document.body.classList.remove("modal-open"),
);
elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) elements.modal.close();
});
elements.modalContent.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-modal-favorite]");
    const share = event.target.closest("[data-share]");
    if (favorite) toggleFavorite(favorite.dataset.modalFavorite);
    if (share) shareRecipe(share.dataset.share);
});

$("#searchShortcut").addEventListener("click", () =>
    elements.searchInput.focus(),
);
document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        elements.searchInput.focus();
        elements.searchInput.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
});

elements.languageSelect.addEventListener("change", () => {
    state.language = elements.languageSelect.value;
    localStorage.setItem("savora-language", state.language);
    applyLanguage();
    showToast(
        state.language === "id" ? "Bahasa berhasil diubah" : "Language updated",
        "🌐",
    );
});

const savedTheme = localStorage.getItem("savora-theme");
if (
    savedTheme === "dark" ||
    (!savedTheme && matchMedia("(prefers-color-scheme: dark)").matches)
)
    document.documentElement.dataset.theme = "dark";
$("#themeToggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    localStorage.setItem("savora-theme", dark ? "light" : "dark");
});
window.addEventListener(
    "scroll",
    () => elements.header.classList.toggle("scrolled", scrollY > 18),
    { passive: true },
);
window.addEventListener(
    "pointermove",
    (event) => {
        $("#cursorGlow").style.left = `${event.clientX}px`;
        $("#cursorGlow").style.top = `${event.clientY}px`;
    },
    { passive: true },
);

const observer = new IntersectionObserver(
    (entries) =>
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        }),
    { threshold: 0.12 },
);
$$(".reveal-section").forEach((section) => observer.observe(section));

elements.languageSelect.value = state.language;
updateNavigation();
renderRegions();
applyLanguage();
loadFilters();
loadFeatured();

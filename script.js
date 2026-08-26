const API = "https://www.themealdb.com/api/json/v1/1";
const $ = (s) => document.querySelector(s),
    $$ = (s) => document.querySelectorAll(s);
const state = {
    meals: [],
    shown: 8,
    category: "",
    view: "discover",
    favorites: JSON.parse(localStorage.getItem("savora-favorites") || "[]"),
};
const el = {
    grid: $("#grid"),
    message: $("#message"),
    more: $("#more"),
    title: $("#title"),
    kicker: $("#kicker"),
    categories: $("#categories"),
    area: $("#area"),
    modal: $("#modal"),
    modalBody: $("#modalBody"),
    toast: $("#toast"),
    favCount: $("#favCount"),
};
const esc = (v = "") =>
    String(v).replace(
        /[&<>'"]/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
            })[c],
    );
async function api(path) {
    const r = await fetch(`${API}/${path}`);
    if (!r.ok) throw Error("Recipe service unavailable");
    return r.json();
}
function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.toast.classList.remove("show"), 2200);
}
function skeletons() {
    el.message.classList.add("hidden");
    el.more.classList.add("hidden");
    el.grid.innerHTML = Array(8)
        .fill(
            '<article class="card skeleton"><div class="photo"></div><p></p><p></p></article>',
        )
        .join("");
}
function message(title, text) {
    el.grid.innerHTML = "";
    el.message.innerHTML = `<strong>${esc(title)}</strong>${esc(text)}`;
    el.message.classList.remove("hidden");
    el.more.classList.add("hidden");
}
const saved = (id) => state.favorites.some((m) => m.idMeal === String(id));
function card(m) {
    return `<article class="card" data-id="${esc(m.idMeal)}" tabindex="0" aria-label="View ${esc(m.strMeal)} recipe"><div class="photo"><img src="${esc(m.strMealThumb)}" alt="${esc(m.strMeal)}" loading="lazy"><button class="heart ${saved(m.idMeal) ? "saved" : ""}" data-fav="${esc(m.idMeal)}" aria-label="Favorite">${saved(m.idMeal) ? "♥" : "♡"}</button></div><div class="card-body"><div class="meta"><span>${esc(m.strCategory || "Recipe")}</span>${m.strArea ? `<span>${esc(m.strArea)}</span>` : ""}</div><h3>${esc(m.strMeal)}</h3><span class="view">View full recipe →</span></div></article>`;
}
function render(source = state.meals) {
    el.message.classList.add("hidden");
    if (!source.length) {
        message(
            state.view === "favorites"
                ? "No favorites yet"
                : "No recipes found",
            state.view === "favorites"
                ? "Tap the heart on a recipe to save it here."
                : "Try another dish, category, or cuisine.",
        );
        return;
    }
    const visible = source.slice(0, state.shown);
    el.grid.innerHTML = visible.map(card).join("");
    el.more.classList.toggle("hidden", visible.length >= source.length);
}
function updateNav() {
    $$(".nav").forEach((b) =>
        b.classList.toggle("active", b.dataset.view === state.view),
    );
    el.favCount.textContent = state.favorites.length;
}
function updateChips() {
    $$(".chip").forEach((b) =>
        b.classList.toggle("active", b.dataset.category === state.category),
    );
}
async function featured() {
    skeletons();
    try {
        const data = await Promise.all(
            ["chicken", "pasta", "curry", "salmon"].map((q) =>
                api(`search.php?s=${q}`),
            ),
        );
        const map = new Map();
        data.flatMap((x) => x.meals || []).forEach((m) => map.set(m.idMeal, m));
        state.meals = [...map.values()];
        state.shown = 8;
        el.kicker.textContent = "EXPLORE THE COLLECTION";
        el.title.textContent = "Popular recipes";
        render();
    } catch {
        message(
            "Something went wrong",
            "Check your internet connection and try again.",
        );
    }
}
async function search(term) {
    term = term.trim();
    if (!term) return featured();
    state.view = "discover";
    state.category = "";
    el.area.value = "";
    updateNav();
    updateChips();
    skeletons();
    try {
        const d = await api(`search.php?s=${encodeURIComponent(term)}`);
        state.meals = d.meals || [];
        state.shown = 8;
        el.kicker.textContent = "SEARCH RESULTS";
        el.title.textContent = `Recipes for “${term}”`;
        render();
        $(".collection").scrollIntoView({ behavior: "smooth" });
    } catch {
        message("Search unavailable", "Please wait a moment and try again.");
    }
}
async function filter(type, value) {
    skeletons();
    try {
        const d = await api(`filter.php?${type}=${encodeURIComponent(value)}`);
        state.meals = d.meals || [];
        state.shown = 8;
        el.kicker.textContent =
            type === "c" ? "BROWSE BY CATEGORY" : "BROWSE BY CUISINE";
        el.title.textContent = value;
        render();
    } catch {
        message("Filter unavailable", "Please wait a moment and try again.");
    }
}
async function filters() {
    try {
        const [c, a] = await Promise.all([
            api("list.php?c=list"),
            api("list.php?a=list"),
        ]);
        el.categories.innerHTML =
            '<button class="chip active" data-category="">All</button>' +
            c.meals
                .filter((x) => x.strCategory !== "Miscellaneous")
                .map(
                    (x) =>
                        `<button class="chip" data-category="${esc(x.strCategory)}">${esc(x.strCategory)}</button>`,
                )
                .join("");
        el.area.innerHTML += (a.meals || [])
            .map(
                (x) =>
                    `<option value="${esc(x.strArea)}">${esc(x.strArea)}</option>`,
            )
            .join("");
    } catch {
        el.categories.innerHTML =
            "<span>Categories temporarily unavailable</span>";
    }
}
async function getMeal(id) {
    const cached = [...state.meals, ...state.favorites].find(
        (m) => m.idMeal === String(id),
    );
    if (cached?.strInstructions) return cached;
    const d = await api(`lookup.php?i=${encodeURIComponent(id)}`);
    return d.meals?.[0];
}
function ingredients(m) {
    return Array.from({ length: 20 }, (_, i) => {
        const name = m[`strIngredient${i + 1}`]?.trim(),
            amount = m[`strMeasure${i + 1}`]?.trim();
        return name ? { name, amount } : null;
    }).filter(Boolean);
}
async function openMeal(id) {
    el.modalBody.innerHTML =
        '<div class="message"><strong>Preparing recipe...</strong>Loading ingredients and instructions.</div>';
    el.modal.showModal();
    try {
        const m = await getMeal(id);
        if (!m) throw Error();
        el.modalBody.innerHTML = `<div class="modal-hero" style="background-image:url('${esc(m.strMealThumb)}')"><div class="modal-title"><p>${esc(m.strCategory || "RECIPE")} · ${esc(m.strArea || "INTERNATIONAL")}</p><h2>${esc(m.strMeal)}</h2></div></div><div class="modal-content"><div><h3>Ingredients</h3><ul class="ingredients">${ingredients(
            m,
        )
            .map(
                (i) =>
                    `<li><span>${esc(i.name)}</span><b>${esc(i.amount)}</b></li>`,
            )
            .join(
                "",
            )}</ul></div><div><h3>How to make it</h3><div class="instructions">${esc(m.strInstructions || "Instructions are not available.")}</div>${m.strSource ? `<a class="source" href="${esc(m.strSource)}" target="_blank" rel="noreferrer">View original source ↗</a>` : ""}</div></div>`;
    } catch {
        el.modalBody.innerHTML =
            '<div class="message"><strong>Could not load this recipe</strong>Please close this window and try again.</div>';
    }
}
async function toggle(id) {
    const exists = saved(id);
    if (exists) {
        state.favorites = state.favorites.filter(
            (m) => m.idMeal !== String(id),
        );
        toast("Removed from favorites");
    } else {
        const m = await getMeal(id);
        if (!m) return;
        state.favorites.push(m);
        toast("Saved to favorites");
    }
    localStorage.setItem("savora-favorites", JSON.stringify(state.favorites));
    updateNav();
    render(state.view === "favorites" ? state.favorites : state.meals);
}
$("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    search($("#searchInput").value);
});
$$("[data-search]").forEach((b) =>
    b.addEventListener("click", () => {
        $("#searchInput").value = b.dataset.search;
        search(b.dataset.search);
    }),
);
el.categories.addEventListener("click", (e) => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    state.view = "discover";
    state.category = b.dataset.category;
    el.area.value = "";
    updateNav();
    updateChips();
    state.category ? filter("c", state.category) : featured();
});
el.area.addEventListener("change", () => {
    state.view = "discover";
    state.category = "";
    updateNav();
    updateChips();
    el.area.value ? filter("a", el.area.value) : featured();
});
el.grid.addEventListener("click", (e) => {
    const h = e.target.closest("[data-fav]");
    if (h) {
        e.stopPropagation();
        toggle(h.dataset.fav);
        return;
    }
    const c = e.target.closest("[data-id]");
    if (c) openMeal(c.dataset.id);
});
el.grid.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("[data-id]"))
        openMeal(e.target.dataset.id);
});
el.more.addEventListener("click", () => {
    state.shown += 8;
    render(state.view === "favorites" ? state.favorites : state.meals);
});
$$(".nav").forEach((b) =>
    b.addEventListener("click", () => {
        state.view = b.dataset.view;
        state.shown = 8;
        updateNav();
        if (state.view === "favorites") {
            el.kicker.textContent = "YOUR PERSONAL COOKBOOK";
            el.title.textContent = "Saved favorites";
            render(state.favorites);
        } else featured();
        $(".collection").scrollIntoView({ behavior: "smooth" });
    }),
);
$("#random").addEventListener("click", async () => {
    toast("Finding something delicious...");
    try {
        const d = await api("random.php");
        if (d.meals?.[0]) openMeal(d.meals[0].idMeal);
    } catch {
        toast("Could not find a random recipe");
    }
});
$("#close").addEventListener("click", () => el.modal.close());
el.modal.addEventListener("click", (e) => {
    if (e.target === el.modal) el.modal.close();
});
updateNav();
filters();
featured();

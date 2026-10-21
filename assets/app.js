(function () {
  var LANGS = ["kk", "ru", "en"];
  var DEFAULT_LANG = "ru";
  var current = DEFAULT_LANG;

  function t(key) {
    return (I18N[current] && I18N[current][key]) || I18N[DEFAULT_LANG][key] || key;
  }

  // Язык берём из URL (/kk, /ru, /en), затем из ?lang=, localStorage и языка браузера
  function detectLang() {
    var fromPath = location.pathname.replace(/\//g, "");
    if (LANGS.indexOf(fromPath) !== -1) return fromPath;
    var fromQuery = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(fromQuery) !== -1) return fromQuery;
    try {
      var saved = localStorage.getItem("lang");
      if (LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var browser = (navigator.language || "").slice(0, 2);
    if (browser === "kk") return "kk";
    if (browser === "en") return "en";
    return DEFAULT_LANG;
  }

  function setLang(lang, updateUrl) {
    current = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]').setAttribute("content", t("meta.description"));
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang);
    });
    try { localStorage.setItem("lang", lang); } catch (e) {}
    // На Vercel /kk, /ru, /en отдают index.html (см. vercel.json); локально оставляем URL как есть
    if (updateUrl && location.protocol !== "file:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      history.replaceState(null, "", "/" + lang + location.search + location.hash);
    }
  }

  document.querySelectorAll("[data-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.dataset.lang, true); });
  });
  setLang(detectLang(), true);

  // --- Форма заявки ---
  var form = document.getElementById("lead-form");
  var statusEl = form.querySelector(".form__status");
  var submitBtn = form.querySelector("button[type=submit]");
  var phoneInput = form.elements.phone;

  // Маска телефона: +7 7XX XXX XX XX
  function formatPhone(value) {
    var d = value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    var out = "+7";
    if (d.length > 1) out += " " + d.slice(1, 4);
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += " " + d.slice(7, 9);
    if (d.length > 9) out += " " + d.slice(9, 11);
    return out;
  }
  phoneInput.addEventListener("input", function () {
    phoneInput.value = phoneInput.value ? formatPhone(phoneInput.value) : "";
  });

  function validate() {
    var ok = true;
    var nameField = form.elements.name.closest(".field");
    var phoneField = phoneInput.closest(".field");
    var nameOk = form.elements.name.value.trim().length >= 2;
    var phoneOk = phoneInput.value.replace(/\D/g, "").length === 11;
    nameField.classList.toggle("has-error", !nameOk);
    phoneField.classList.toggle("has-error", !phoneOk);
    if (!nameOk || !phoneOk) ok = false;
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    var params = new URLSearchParams(location.search);
    var payload = {
      name: form.elements.name.value.trim(),
      phone: phoneInput.value,
      age: form.elements.age.value,
      format: form.elements.format.value,
      website: form.elements.website.value,
      lang: current,
      page: location.href,
      utm_source: params.get("utm_source") || "",
      utm_campaign: params.get("utm_campaign") || ""
    };

    submitBtn.disabled = true;
    submitBtn.textContent = t("form.sending");
    statusEl.className = "form__status";
    statusEl.textContent = "";

    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        statusEl.className = "form__status is-success";
        statusEl.dataset.i18n = "form.success";
        statusEl.textContent = t("form.success");
        form.reset();
      })
      .catch(function () {
        statusEl.className = "form__status is-error";
        statusEl.dataset.i18n = "form.error";
        statusEl.textContent = t("form.error");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = t("form.submit");
      });
  });
})();

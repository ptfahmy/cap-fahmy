(function () {
  const TIERS = [
    {
      id: "foundation",
      featured: false,
      egp: 2500,
      usd: 79,
    },
    {
      id: "standard",
      featured: true,
      egp: 4000,
      usd: 129,
    },
    {
      id: "focused",
      featured: false,
      egp: 6000,
      usd: 189,
    },
  ];

  const state = {
    lang: localStorage.getItem("capfahmy-lang") || "en",
    currency: localStorage.getItem("capfahmy-currency") || "EGP",
    tier: localStorage.getItem("capfahmy-tier") || "standard",
  };

  function t(key) {
    const dict = window.CapFahmyI18n[state.lang] || window.CapFahmyI18n.en;
    return dict[key] || window.CapFahmyI18n.en[key] || key;
  }

  function formatPrice(amount, currency) {
    if (currency === "EGP") {
      return new Intl.NumberFormat(state.lang === "ar" ? "ar-EG" : "en-EG", {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat(state.lang === "ar" ? "ar" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function applyI18n() {
    document.documentElement.lang = state.lang === "ar" ? "ar" : "en";
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.body.dir = state.lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });

    const toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.textContent = state.lang === "ar" ? "English" : "عربي";
      toggle.setAttribute(
        "aria-label",
        state.lang === "ar" ? "Switch to English" : "التبديل إلى العربية"
      );
    }

    renderPricing();
    updateSelectedTierLabel();
    renderLibrary();
  }

  /* Exercise library */
  const libraryState = {
    playlists: [],
    activePlaylistId: null,
    activeVideoId: null,
    loaded: false,
  };

  function playlistTitle(playlist) {
    return state.lang === "ar" ? playlist.titleAr || playlist.title : playlist.title;
  }

  function embedUrl(playlistId, videoId) {
    return `https://www.youtube.com/embed/${videoId}?list=${playlistId}&rel=0`;
  }

  function renderLibrary() {
    const root = document.getElementById("library-root");
    if (!root || !libraryState.loaded) return;

    if (!libraryState.playlists.length) {
      root.innerHTML = `<p class="hint">${t("library.empty")}</p>`;
      return;
    }

    const playlist =
      libraryState.playlists.find((p) => p.id === libraryState.activePlaylistId) ||
      libraryState.playlists[0];
    libraryState.activePlaylistId = playlist.id;
    if (
      !libraryState.activeVideoId ||
      !playlist.videos.some((v) => v.id === libraryState.activeVideoId)
    ) {
      libraryState.activeVideoId = playlist.videos[0]?.id || null;
    }

    const tabs = libraryState.playlists
      .map(
        (p) => `
        <button type="button" class="library-tab ${
          p.id === playlist.id ? "is-active" : ""
        }" data-playlist="${p.id}">
          ${playlistTitle(p)}
          <span>${p.videos.length}</span>
        </button>`
      )
      .join("");

    const items = playlist.videos
      .map(
        (video, index) => `
        <li>
          <button type="button" class="library-item ${
            video.id === libraryState.activeVideoId ? "is-active" : ""
          }" data-video="${video.id}">
            <span class="library-item-num">${String(index + 1).padStart(2, "0")}</span>
            <span class="library-item-title">${video.title}</span>
          </button>
        </li>`
      )
      .join("");

    root.innerHTML = `
      <div class="library-tabs" role="tablist">${tabs}</div>
      <div class="library-layout">
        <div class="library-player">
          <div class="video-frame">
            <iframe
              id="library-frame"
              src="${embedUrl(playlist.id, libraryState.activeVideoId)}"
              title="${playlistTitle(playlist)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
          <div class="library-player-meta">
            <p><strong>${playlistTitle(playlist)}</strong> · ${
              playlist.videos.length
            } ${t("library.count")}</p>
            <a class="btn btn-ghost" href="${playlist.url}" target="_blank" rel="noopener noreferrer">${t(
              "library.open"
            )}</a>
          </div>
        </div>
        <ol class="library-list">${items}</ol>
      </div>
    `;
  }

  function bindLibrary() {
    const root = document.getElementById("library-root");
    if (!root) return;

    root.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-playlist]");
      if (tab) {
        libraryState.activePlaylistId = tab.dataset.playlist;
        libraryState.activeVideoId = null;
        renderLibrary();
        return;
      }
      const item = event.target.closest("[data-video]");
      if (item) {
        libraryState.activeVideoId = item.dataset.video;
        renderLibrary();
      }
    });

    fetch("playlists.json")
      .then((res) => res.json())
      .then((data) => {
        libraryState.playlists = data.playlists || [];
        libraryState.activePlaylistId = libraryState.playlists[0]?.id || null;
        libraryState.activeVideoId = libraryState.playlists[0]?.videos?.[0]?.id || null;
        libraryState.loaded = true;
        renderLibrary();
      })
      .catch(() => {
        libraryState.loaded = true;
        libraryState.playlists = [];
        renderLibrary();
      });
  }

  function renderPricing() {
    const root = document.getElementById("pricing");
    if (!root) return;

    root.innerHTML = TIERS.map((tier) => {
      const amount = state.currency === "EGP" ? tier.egp : tier.usd;
      const features = [1, 2, 3]
        .map(
          (n) =>
            `<li>${t(`pricing.${tier.id}.f${n}`)}</li>`
        )
        .join("");

      return `
        <article class="price-card ${tier.featured ? "is-featured" : ""}">
          <h3>${t(`pricing.${tier.id}.name`)}</h3>
          <p class="price-amount">${formatPrice(amount, state.currency)}<span style="font-size:0.85rem;font-weight:500;color:var(--muted)"> / mo</span></p>
          <p>${t(`pricing.${tier.id}.desc`)}</p>
          <ul>${features}</ul>
          <a class="btn ${tier.featured ? "btn-primary" : "btn-ghost"}" href="onboard.html?tier=${tier.id}">
            ${t("pricing.cta")}
          </a>
        </article>
      `;
    }).join("");
  }

  function updateSelectedTierLabel() {
    const el = document.getElementById("selected-tier-label");
    if (!el) return;
    const tier = TIERS.find((item) => item.id === state.tier) || TIERS[1];
    const amount = state.currency === "EGP" ? tier.egp : tier.usd;
    el.textContent = `${t(`pricing.${tier.id}.name`)} · ${formatPrice(
      amount,
      state.currency
    )}`;
  }

  function bindLanguage() {
    const toggle = document.getElementById("lang-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      state.lang = state.lang === "ar" ? "en" : "ar";
      localStorage.setItem("capfahmy-lang", state.lang);
      applyI18n();
    });
  }

  function bindCurrency() {
    document.querySelectorAll("[data-currency]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.currency === state.currency);
      btn.addEventListener("click", () => {
        state.currency = btn.dataset.currency;
        localStorage.setItem("capfahmy-currency", state.currency);
        document.querySelectorAll("[data-currency]").forEach((b) => {
          b.classList.toggle("is-active", b.dataset.currency === state.currency);
        });
        renderPricing();
        updateSelectedTierLabel();
      });
    });
  }

  function readTierFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get("tier");
    if (tier && TIERS.some((item) => item.id === tier)) {
      state.tier = tier;
      localStorage.setItem("capfahmy-tier", tier);
    }
  }

  /* Onboarding wizard */
  function initOnboard() {
    const form = document.getElementById("onboard-form");
    if (!form) return;

    readTierFromQuery();
    updateSelectedTierLabel();

    let step = 0;
    const panels = [...form.querySelectorAll(".step-panel")];
    const progress = [...document.querySelectorAll(".progress-step")];
    const alertEl = document.getElementById("onboard-alert");
    const dateInput = document.getElementById("waiver-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    function showStep(index) {
      step = index;
      panels.forEach((panel, i) => {
        panel.hidden = i !== step;
      });
      progress.forEach((bar, i) => {
        bar.classList.toggle("is-done", i < step);
        bar.classList.toggle("is-current", i === step);
      });
      if (alertEl) {
        alertEl.hidden = true;
        alertEl.textContent = "";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function showAlert(message) {
      if (!alertEl) return;
      alertEl.hidden = false;
      alertEl.textContent = message;
    }

    form.addEventListener("click", (event) => {
      const target = event.target.closest("[data-next], [data-back]");
      if (!target) return;
      event.preventDefault();

      if (target.hasAttribute("data-back")) {
        showStep(Math.max(0, step - 1));
        return;
      }

      if (step === 0) {
        const ack1 = document.getElementById("waiver-ack-1");
        const ack2 = document.getElementById("waiver-ack-2");
        const name = document.getElementById("waiver-name");
        if (!ack1.checked || !ack2.checked || !name.value.trim()) {
          showAlert(t("waiver.blocked"));
          return;
        }
        localStorage.setItem(
          "capfahmy-waiver",
          JSON.stringify({
            name: name.value.trim(),
            date: document.getElementById("waiver-date").value,
            signedAt: new Date().toISOString(),
          })
        );
      }

      if (step === 1) {
        const required = ["intake-name", "intake-email", "intake-phone", "intake-goal"];
        const missing = required.some((id) => !document.getElementById(id).value.trim());
        if (missing) {
          showAlert(
            state.lang === "ar"
              ? "أكمل الحقول المطلوبة للمتابعة."
              : "Please complete the required fields to continue."
          );
          return;
        }
      }

      if (step === 3) {
        const payAck = document.getElementById("pay-ack");
        if (!payAck.checked) {
          showAlert(
            state.lang === "ar"
              ? "أكد فهمك لطريقة الدفع للمتابعة."
              : "Please confirm you understand the payment process."
          );
          return;
        }

        const payload = {
          waiver: JSON.parse(localStorage.getItem("capfahmy-waiver") || "{}"),
          tier: state.tier,
          currency: state.currency,
          lang: state.lang,
          intake: {
            name: document.getElementById("intake-name").value.trim(),
            email: document.getElementById("intake-email").value.trim(),
            phone: document.getElementById("intake-phone").value.trim(),
            city: document.getElementById("intake-city").value.trim(),
            goal: document.getElementById("intake-goal").value.trim(),
            history: document.getElementById("intake-history").value.trim(),
            health: document.getElementById("intake-health").value.trim(),
            equipment: document.getElementById("intake-equipment").value.trim(),
            schedule: document.getElementById("intake-schedule").value.trim(),
          },
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem("capfahmy-intake", JSON.stringify(payload));
        showStep(4);
        return;
      }

      showStep(Math.min(panels.length - 1, step + 1));
    });

    showStep(0);
  }

  bindLanguage();
  bindCurrency();
  applyI18n();
  bindLibrary();
  initOnboard();
})();

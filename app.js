/* ORBITA storefront — interactions.
   Motion road: class toggles with CSS transitions, plus one IntersectionObserver
   for the section reveals. No library, nothing animated in JS beyond pointer maths. */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = (n) => "€" + n.toLocaleString("en-IE");

  /* ---------- header ---------- */

  const head = $("[data-head]");
  const syncHead = () => head.classList.toggle("is-solid", window.scrollY > 40);
  syncHead();
  window.addEventListener("scroll", syncHead, { passive: true });

  /* ---------- hero: finish lines + crossfade ---------- */

  const field = $("[data-field]");
  const heroImgs = $$("[data-hero-img]");
  const lines = $$("[data-line]");
  const heroCode = $("[data-hero-code]");
  const heroName = $("[data-hero-name]");
  const heroPrice = $("[data-hero-price]");

  const pieces = [
    { code: "ORB·01", name: "Segno signet", price: "€340" },
    { code: "ORB·06", name: "Tre stacking set", price: "€390" },
    { code: "ORB·03", name: "Pietra ring", price: "€395" },
    { code: "ATL·74", name: "The workshop", price: "Milano" },
  ];

  const showLine = (index) => {
    lines.forEach((btn, i) => {
      const on = i === index;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    heroImgs.forEach((img, i) => img.classList.toggle("is-on", i === index));
    heroCode.textContent = pieces[index].code;
    heroName.textContent = pieces[index].name;
    heroPrice.textContent = pieces[index].price;
  };

  lines.forEach((btn, i) => {
    btn.addEventListener("click", () => showLine(i));
    btn.addEventListener("focus", () => showLine(i));
  });

  /* ---------- hero: drag to pan, click to zoom ---------- */

  let scale = 1.06;
  let tx = 0;
  let ty = 0;
  let drag = null;

  const paint = () => {
    field.style.setProperty("--sc", scale.toFixed(3));
    field.style.setProperty("--tx", tx.toFixed(1) + "px");
    field.style.setProperty("--ty", ty.toFixed(1) + "px");
  };

  const clampPan = () => {
    const box = field.getBoundingClientRect();
    const maxX = ((scale - 1) * box.width) / 2;
    const maxY = ((scale - 1) * box.height) / 2;
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
  };

  const hint = $("[data-field-hint]");

  const toggleZoom = (event) => {
    const zoomed = scale > 1.4;
    if (zoomed) {
      scale = 1.06;
      tx = 0;
      ty = 0;
      if (hint) hint.textContent = "Drag to pan · Click to zoom";
    } else {
      const box = field.getBoundingClientRect();
      scale = 1.9;
      tx = (box.width / 2 - (event.clientX - box.left)) * 0.9;
      ty = (box.height / 2 - (event.clientY - box.top)) * 0.9;
      clampPan();
      if (hint) hint.textContent = "Click to zoom out · Drag to pan";
    }
    paint();
  };

  field.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, tx, ty, moved: false };
    field.setPointerCapture(event.pointerId);
    field.classList.add("is-dragging");
  });

  field.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    tx = drag.tx + dx;
    ty = drag.ty + dy;
    clampPan();
    paint();
  });

  const endDrag = (event) => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    field.classList.remove("is-dragging");
    if (field.hasPointerCapture(event.pointerId)) field.releasePointerCapture(event.pointerId);
    if (!moved) toggleZoom(event);
  };

  field.addEventListener("pointerup", endDrag);
  field.addEventListener("pointercancel", () => {
    drag = null;
    field.classList.remove("is-dragging");
  });

  /* ---------- collection filters ---------- */

  const chips = $$("[data-filter]");
  const cards = $$(".card");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      const filter = chip.dataset.filter;
      cards.forEach((card) => {
        card.classList.toggle("is-hidden", filter !== "all" && card.dataset.cat !== filter);
      });
    });
  });

  /* ---------- campaign frames ---------- */

  const frames = [
    {
      src: "assets/campaign-stones.jpg",
      alt: "Raw pale stones and rough diamonds scattered on cracked black coal",
    },
    {
      src: "assets/product-stack.jpg",
      alt: "Three sterling silver stacking rings on one finger",
    },
    {
      src: "assets/atelier-hands.jpg",
      alt: "Hands holding a silver ring over a worn workbench",
    },
  ];

  const campImg = $("[data-camp-img]");
  const campIndex = $("[data-camp-index]");
  const campBar = $("[data-camp-bar]");
  const thumbs = $$("[data-camp]");

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const index = Number(thumb.dataset.camp);
      thumbs.forEach((t) => {
        const on = t === thumb;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-pressed", String(on));
      });
      const swap = () => {
        campImg.src = frames[index].src;
        campImg.alt = frames[index].alt;
        campImg.classList.remove("is-out");
      };
      if (reduceMotion) {
        swap();
      } else {
        campImg.classList.add("is-out");
        window.setTimeout(swap, 240);
      }
      campIndex.textContent = String(index + 1).padStart(2, "0");
      campBar.style.width = ((index + 1) / frames.length) * 100 + "%";
    });
  });

  /* ---------- bag ---------- */

  const bag = [];
  const bagPanel = $("[data-bag]");
  const bagList = $("[data-bag-list]");
  const bagEmpty = $("[data-bag-empty]");
  const bagFoot = $(".bag-foot");
  const bagTotal = $("[data-bag-total]");
  const bagCounts = $$("[data-bag-count]");

  const paintBag = () => {
    bagList.textContent = "";

    bag.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "bag-item";

      const img = document.createElement("img");
      img.src = item.img;
      img.alt = "";
      img.width = 62;
      img.height = 47;

      const text = document.createElement("div");
      const name = document.createElement("h4");
      name.textContent = item.name;
      const meta = document.createElement("p");
      meta.textContent = money(item.price) + " · qty " + item.qty;
      text.append(name, meta);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "bag-remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + item.name + " from the bag");
      remove.addEventListener("click", () => {
        bag.splice(index, 1);
        paintBag();
      });

      row.append(img, text, remove);
      bagList.append(row);
    });

    const units = bag.reduce((sum, item) => sum + item.qty, 0);
    const total = bag.reduce((sum, item) => sum + item.qty * item.price, 0);
    bagCounts.forEach((el) => {
      el.textContent = String(units);
    });
    bagTotal.textContent = money(total);
    bagEmpty.hidden = units > 0;
    bagFoot.hidden = units === 0;
  };

  const addToBag = (card) => {
    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const img = card.querySelector(".card-media img").src;
    const known = bag.find((item) => item.name === name);
    if (known) {
      known.qty += 1;
    } else {
      bag.push({ name, price, img, qty: 1 });
    }
    paintBag();
    openPanel(bagPanel);
  };

  $$("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToBag(button.closest(".card")));
  });

  /* ---------- panels ---------- */

  const scrim = $("[data-scrim]");
  const menuPanel = $("[data-menu]");
  const menuButton = $("[data-menu-open]");
  let lastFocus = null;

  function openPanel(panel) {
    lastFocus = document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    window.requestAnimationFrame(() => scrim.classList.add("is-open"));
    document.body.classList.add("is-locked");
    if (panel === menuPanel) menuButton.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => {
      const first = panel.querySelector("button, a[href], input");
      if (first) first.focus();
    });
  }

  function closePanels() {
    const open = $(".panel.is-open");
    if (!open) return;
    $$(".panel.is-open").forEach((panel) => {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    });
    scrim.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    menuButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!$(".panel.is-open")) scrim.hidden = true;
    }, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  menuButton.addEventListener("click", () => openPanel(menuPanel));
  $("[data-bag-open]").addEventListener("click", () => openPanel(bagPanel));
  $("[data-menu-close]").addEventListener("click", closePanels);
  $("[data-bag-close]").addEventListener("click", closePanels);
  scrim.addEventListener("click", closePanels);
  $$("[data-menu-close]").forEach((el) => el.addEventListener("click", closePanels));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanels();
      return;
    }
    if (event.key !== "Tab") return;
    const open = $(".panel.is-open");
    if (!open) return;
    const focusable = $$("button, a[href], input", open).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- newsletter ---------- */

  const form = $("[data-signup]");
  const note = $("[data-signup-note]");
  const row = $(".signup-row");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#signup-email");
    const value = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    row.classList.toggle("is-error", !valid);
    note.classList.toggle("is-error", !valid);
    if (!valid) {
      note.textContent = "That address looks incomplete — check it and try again.";
      input.focus();
      return;
    }
    note.textContent = "Thank you. This demo keeps no list — nothing was sent.";
    form.reset();
  });

  /* ---------- checkout (demo) ---------- */

  $("[data-bag-checkout]").addEventListener("click", () => {
    const noteEl = $(".bag-foot .signup-note");
    noteEl.textContent = "Demo storefront — no payment provider is connected.";
  });

  /* ---------- reveals ---------- */

  const revealables = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealables.forEach((el) => observer.observe(el));
  }

  paintBag();
})();

/* Paradise Interiors — interactions. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Sticky nav state ---------- */
  var nav = document.getElementById("nav");

  function updateNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("nav-burger");
  var menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    nav.classList.toggle("menu-open", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-locked", open);
  }

  burger.addEventListener("click", function () {
    setMenu(!menu.classList.contains("is-open"));
  });

  // Close the menu when a link inside it is followed
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---------- Project filtering ---------- */
  var filterGroup = document.querySelector("[data-filter-group]");

  if (filterGroup) {
    var pills = filterGroup.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-category]");
    var FADE_MS = 300;

    filterGroup.addEventListener("click", function (event) {
      var pill = event.target.closest("[data-filter]");
      if (!pill || pill.classList.contains("is-active")) return;

      pills.forEach(function (p) {
        var active = p === pill;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-pressed", String(active));
      });

      var filter = pill.dataset.filter;

      cards.forEach(function (card) {
        var show =
          filter === "all" || card.dataset.category === filter;

        if (show) {
          card.hidden = false;
          // Two frames so the un-hide registers before the fade runs
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              card.classList.remove("prj-fade");
            });
          });
        } else {
          card.classList.add("prj-fade");
          setTimeout(function () {
            // Skip if a later filter change made it visible again
            if (card.classList.contains("prj-fade")) card.hidden = true;
          }, FADE_MS);
        }
      });
    });
  }

  /* ---------- Quote form (client-side validation only) ---------- */
  var quoteForm = document.getElementById("quote-form");

  if (quoteForm) {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateInput(input) {
      var value = input.value.trim();
      var bad =
        !value || (input.type === "email" && !EMAIL_RE.test(value));
      var field = input.closest(".field");
      if (field) field.classList.toggle("is-invalid", bad);
      input.setAttribute("aria-invalid", String(bad));
      return !bad;
    }

    // Clear errors as the user fixes them
    quoteForm.addEventListener("input", function (event) {
      if (event.target.matches("[required]")) validateInput(event.target);
    });

    quoteForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      quoteForm.querySelectorAll("[required]").forEach(function (input) {
        if (!validateInput(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Honeypot filled => bot. Show success anyway, send nothing.
      // (No backend yet — wire to a form handler / email service before launch.)
      quoteForm.hidden = true;
      var success = document.getElementById("form-success");
      if (success) {
        success.hidden = false;
        success.focus && success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  }

  /* ---------- Count-up numbers ---------- */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    var duration = 1600;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      el.textContent =
        Math.round(target * easeOutCubic(progress)) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ---------- Scroll-into-view animations ---------- */
  var animated = document.querySelectorAll("[data-animate]");

  function reveal(el) {
    el.classList.add("in-view");
    if (!prefersReducedMotion) {
      el.querySelectorAll("[data-count]").forEach(countUp);
    }
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    // Show everything immediately; counters keep their final HTML values.
    animated.forEach(function (el) {
      el.classList.add("in-view");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );

    animated.forEach(function (el) {
      observer.observe(el);
    });
  }
})();

(function () {
  "use strict";

  var OPEN_THEME = "#444444";
  var CLOSED_THEME = "#ffffff";

  function setThemeColor(color) {
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (el) {
      el.remove();
    });
    var meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
  }

  function initBurgerModal() {
    var burgerIcon = document.querySelector(".navbar_toggle");
    var overlay = document.querySelector(".navbar_overlay");
    var resume = document.querySelector(".resume");
    var icons = document.querySelectorAll(".icons-wrapper a");
    var header = document.querySelector(".heading-2");
    var body = document.querySelector(".body") || document.body;
    var dropdown = document.querySelector(".navbar_dropdown");
    var dropdownList = document.querySelector(".navbar_dropdown-list");

    if (!burgerIcon) return;

    var lastOpen = false;
    var isClosing = false;
    var syncingWebflowClose = false;
    var lockedScrollY = 0;
    var swallowUntil = 0;

    var showOverlay = function () {
      if (!overlay) return;
      overlay.style.display = "block";
      overlay.style.opacity = "1";
    };

    var hideOverlay = function () {
      if (!overlay) return;
      overlay.style.display = "none";
      overlay.style.opacity = "0";
    };

    var preventScroll = function (e) {
      e.preventDefault();
    };

    var setOpen = function (open) {
      if (open && isClosing) return;
      if (open === lastOpen) return;
      lastOpen = open;
      if (open) {
        lockedScrollY = window.scrollY || window.pageYOffset;
        document.documentElement.classList.add("no-scroll");
        body.classList.add("no-scroll");
        body.style.top = "-" + lockedScrollY + "px";
        document.addEventListener("touchmove", preventScroll, { passive: false });
        document.addEventListener("wheel", preventScroll, { passive: false });
        burgerIcon.classList.add("active");
        showOverlay();
        setThemeColor(OPEN_THEME);
      } else {
        document.documentElement.classList.remove("no-scroll");
        body.classList.remove("no-scroll");
        body.style.top = "";
        document.removeEventListener("touchmove", preventScroll);
        document.removeEventListener("wheel", preventScroll);
        burgerIcon.classList.remove("active");
        hideOverlay();
        setThemeColor(CLOSED_THEME);
        window.scrollTo(0, lockedScrollY);
      }
    };

    var closeMenu = function () {
      if (isClosing) return;
      if (!lastOpen && !burgerIcon.classList.contains("w--open")) return;
      isClosing = true;
      setOpen(false);
      if (burgerIcon.classList.contains("w--open")) {
        syncingWebflowClose = true;
        burgerIcon.click();
        syncingWebflowClose = false;
      } else {
        if (dropdown) dropdown.classList.remove("w--open");
        if (dropdownList) dropdownList.classList.remove("w--open");
        burgerIcon.classList.remove("w--open");
        burgerIcon.setAttribute("aria-expanded", "false");
      }
    };

    var closeOnEmptySpace = function (e) {
      if (isClosing) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!lastOpen) return;
      e.preventDefault();
      e.stopPropagation();
      swallowUntil = Date.now() + 350;
      closeMenu();
    };

    var swallowGhostClick = function (e) {
      if (Date.now() >= swallowUntil) return;
      if (e.target && e.target.closest && e.target.closest(".navbar_toggle")) return;
      e.preventDefault();
      e.stopPropagation();
    };

    var syncOpen = function () {
      var open = !!(
        (dropdown && dropdown.classList.contains("w--open")) ||
        (dropdownList && dropdownList.classList.contains("w--open"))
      );
      if (!open) {
        isClosing = false;
        setOpen(false);
        return;
      }
      if (isClosing) return;
      setOpen(true);
    };

    if (overlay) {
      ["wheel", "touchmove"].forEach(function (type) {
        overlay.addEventListener(type, function (e) {
          e.preventDefault();
          e.stopPropagation();
        }, { capture: true, passive: false });
      });
      overlay.addEventListener("click", closeOnEmptySpace);
      overlay.addEventListener("touchend", closeOnEmptySpace, { passive: false });
    }

    document.addEventListener("click", swallowGhostClick, true);
    document.addEventListener("touchend", swallowGhostClick, { capture: true, passive: false });

    [dropdown, dropdownList].forEach(function (el) {
      if (!el) return;
      new MutationObserver(syncOpen).observe(el, { attributes: true, attributeFilter: ["class"] });
    });

    burgerIcon.addEventListener("click", function (e) {
      if (syncingWebflowClose) return;
      if (isClosing) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);

    burgerIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      if (syncingWebflowClose || isClosing) return;
      if (lastOpen) {
        isClosing = true;
        setOpen(false);
      }
    });

    if (resume) {
      resume.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    if (header) {
      header.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    icons.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBurgerModal);
  } else {
    initBurgerModal();
  }
})();

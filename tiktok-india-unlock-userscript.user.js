// ==UserScript==
// @name         TikTok India Unlock
// @namespace    https://github.com/chirag127
// @version      1.0.0
// @description  Opens any TikTok link through a working mirror when tiktok.com is blocked or region-gated, with a saved mirror list and one-click handoff.
// @author       chirag127
// @license      MIT
// @match        https://www.tiktok.com/*
// @match        https://urlebird.com/*
// @match        https://tikwm.com/*
// @match        https://ssstik.io/*
// @match        https://www.tiktokv.com/*
// @icon         https://www.tiktok.com/favicon.ico
// @homepageURL  https://github.com/chirag127/tiktok-india-unlock-userscript
// @supportURL   https://github.com/chirag127/tiktok-india-unlock-userscript/issues
// @downloadURL  https://github.com/chirag127/tiktok-india-unlock-userscript/raw/main/tiktok-india-unlock-userscript.user.js
// @updateURL    https://github.com/chirag127/tiktok-india-unlock-userscript/raw/main/tiktok-india-unlock-userscript.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /**
   * A userscript cannot beat an ISP block by itself: if tiktok.com never loads, nothing runs there.
   * So this is a handoff tool. It runs on TikTok when reachable and on the mirrors, and turns any
   * link into the equivalent mirror URL.
   *
   * Mirror templates use `{id}` (video id) or `{user}` (handle). Edit them in the panel when a
   * mirror dies - they change often.
   */
  const DEFAULT_MIRRORS = [
    { name: "urlebird", url: "https://urlebird.com/video/{id}/", note: "video viewer, no app" },
    { name: "tikwm", url: "https://tikwm.com/video/{id}.html", note: "viewer + download" },
    { name: "ssstik", url: "https://ssstik.io/en?url=https%3A%2F%2Fwww.tiktok.com%2F%40{user}%2Fvideo%2F{id}", note: "downloader" },
    { name: "profile (urlebird)", url: "https://urlebird.com/user/{user}/", note: "profile view" },
  ];

  const mirrors = GM_getValue("mirrors", DEFAULT_MIRRORS);
  const saveMirrors = () => GM_setValue("mirrors", mirrors);

  const idOf = (href) => {
    const m = (href || "").match(/\/video\/(\d+)/) || (href || "").match(/[?&]item_id=(\d+)/);
    return m ? m[1] : "";
  };
  const userOf = (href) => {
    const m = (href || "").match(/@([\w.\-]+)/);
    return m ? m[1] : "";
  };

  function build(tpl, id, user) {
    return tpl.replace(/\{id\}/g, id).replace(/\{user\}/g, user);
  }

  function currentLink() {
    const id = idOf(location.href) || idOf(document.querySelector('link[rel=canonical]')?.href || "");
    const user = userOf(location.href);
    return { id, user };
  }

  function open(tpl) {
    const { id, user } = currentLink();
    if (!id && !user) return alert("Open a TikTok video or profile first, or paste a link in the panel.");
    const url = build(tpl, id, user);
    window.open(url, "_blank", "noopener");
  }

  // ---------- panel ----------
  let ui = null;
  function el(tag, css, text) {
    const n = document.createElement(tag);
    if (css) Object.assign(n.style, css);
    if (text != null) n.textContent = text;
    return n;
  }

  function panel() {
    if (ui) { ui.root.remove(); ui = null; return; }
    const root = el("div", { position: "fixed", right: "18px", bottom: "18px", width: "360px", zIndex: 2147483647, background: "#181818", color: "#fff", font: "12px Roboto, Arial", border: "1px solid #3a3a3a", borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.65)" });
    const head = el("div", { padding: "8px", background: "#242424", display: "flex", gap: "6px", alignItems: "center", cursor: "move" });
    head.append(el("strong", { flex: "1" }, "Open through a mirror"), el("button", { background: "#333", color: "#fff", border: "0", borderRadius: "5px", padding: "3px 7px", cursor: "pointer" }, "×"));
    head.lastChild.onclick = panel;

    const paste = el("input", { margin: "8px", padding: "6px", background: "#111", color: "#fff", border: "1px solid #3a3a3a", borderRadius: "5px" });
    paste.placeholder = "paste a tiktok link";
    const body = el("div", { padding: "0 8px 8px" });

    function draw() {
      body.textContent = "";
      const { id, user } = currentLink();
      const src = id || user;
      body.append(el("div", { color: "#9aa", padding: "4px 0" }, src ? "current: " + src : "no video/profile detected on this page"));
      for (const m of mirrors) {
        const row = el("div", { display: "flex", gap: "6px", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #262626" });
        row.append(el("span", { flex: "1", color: "#ddd" }, m.name + " · " + m.note));
        const b = el("button", { background: "#065fd4", color: "#fff", border: "0", borderRadius: "4px", padding: "2px 7px", cursor: "pointer" }, "Open");
        b.onclick = () => open(m.url);
        row.append(b);
        body.append(row);
      }
      const add = el("button", { marginTop: "8px", background: "#333", color: "#fff", border: "0", borderRadius: "5px", padding: "4px 8px", cursor: "pointer" }, "+ add mirror");
      add.onclick = () => {
        const url = prompt("Template URL. Use {id} and/or {user}:", "https://example.com/video/{id}");
        if (!url) return;
        mirrors.push({ name: new URL(url.replace("{id}", "1")).hostname, url, note: "custom" });
        saveMirrors(); draw();
      };
      body.append(add);
    }

    paste.onkeydown = (e) => {
      if (e.key !== "Enter") return;
      const id = idOf(paste.value), user = userOf(paste.value);
      if (!id && !user) return alert("No TikTok id in that link.");
      window.open(build(mirrors[0].url, id, user), "_blank", "noopener");
    };

    root.append(head, paste, body);
    document.body.appendChild(root);
    ui = { root };

    let dx = 0, dy = 0, drag = false;
    head.addEventListener("pointerdown", (e) => { if (e.target.tagName === "BUTTON") return; drag = true; dx = e.clientX; dy = e.clientY; head.setPointerCapture(e.pointerId); });
    head.addEventListener("pointermove", (e) => {
      if (!drag) return;
      root.style.right = "auto"; root.style.bottom = "auto";
      root.style.left = Math.max(0, root.offsetLeft + e.clientX - dx) + "px";
      root.style.top = Math.max(0, root.offsetTop + e.clientY - dy) + "px";
      dx = e.clientX; dy = e.clientY;
    });
    head.addEventListener("pointerup", () => (drag = false));
    draw();
  }

  GM_registerMenuCommand("Open through a mirror", panel);
  addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "u" && !/input|textarea/i.test(document.activeElement.tagName)) panel();
  });

  const chip = el("button", { position: "fixed", right: "18px", bottom: "96px", zIndex: 2147483646, background: "#065fd4", color: "#fff", border: "0", borderRadius: "18px", padding: "6px 12px", cursor: "pointer", font: "12px Roboto, Arial" }, "🌍");
  chip.title = "Open through a mirror (Alt+U)";
  chip.onclick = panel;
  document.body.appendChild(chip);
})();

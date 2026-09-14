const MIDIBackDemo = (() => {
  const CORRECTION_ORDER = [
    ["original", "Original MIX", null],
    ["detune", "Detuned-GRU-only vocal mix", null],
    [
      "outshift_detune",
      "Detuned Outshift vocal mix",
      "This vocal is the input to the models below.",
    ],
    ["midiback", "Corrected audio: full MIDIBack", null],
    ["bertapc_gru", "Corrected audio: BERT-APC (GRU-only)", null],
    ["ddpc", "DDPC (Uniform)", null],
  ];

  function siteBase() {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || "";
      if (src.includes("app.js")) {
        return src.replace(/app\.js(?:\?.*)?$/, "");
      }
    }
    const path = location.pathname || "/";
    if (path.endsWith(".html")) {
      return path.slice(0, path.lastIndexOf("/") + 1);
    }
    return path.endsWith("/") ? path : `${path}/`;
  }

  function assetUrl(rel) {
    if (!rel) return null;
    if (/^(https?:|data:|blob:)/i.test(rel)) return rel;
    const encoded = String(rel)
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return new URL(encoded, siteBase() || location.href).href;
  }

  async function loadCatalog() {
    const res = await fetch(assetUrl("catalog.json"), { cache: "no-store" });
    if (!res.ok) throw new Error(`catalog.json ${res.status}`);
    return res.json();
  }

  function audioEl(src) {
    const href = assetUrl(src);
    if (!href) return null;
    const a = document.createElement("audio");
    a.controls = true;
    a.preload = "metadata";
    a.src = href;
    a.addEventListener("error", () => {
      a.classList.add("audio-error");
      a.title = `Failed to load ${src}`;
    });
    return a;
  }

  function clipRow(label, src, note) {
    const row = document.createElement("div");
    row.className = "clip" + (src ? "" : " missing");
    const left = document.createElement("div");
    left.className = "clip-label";
    const lab = document.createElement("label");
    lab.textContent = label;
    left.appendChild(lab);
    if (note) {
      const hint = document.createElement("span");
      hint.className = "clip-note";
      hint.textContent = note;
      left.appendChild(hint);
    }
    row.appendChild(left);
    const a = audioEl(src);
    if (a) row.appendChild(a);
    return row;
  }

  function songTitle(song) {
    if (song.dataset === "mir1k") return song.id || song.slug;
    const raw = String(song.id || song.slug || "").split("__")[0];
    return raw.replace(/_/g, " ");
  }

  function songMeta(song) {
    const datasetLabel =
      song.dataset === "mir1k"
        ? "MIR-1K"
        : song.dataset === "ccmixter"
          ? "CCMixter"
          : song.dataset || "";
    const r = song.region_sec || [];
    if (r.length === 2) {
      return `${datasetLabel}, window ${Number(r[0]).toFixed(1)} to ${Number(r[1]).toFixed(1)} s`;
    }
    return datasetLabel;
  }

  async function renderCorrection() {
    const status = document.getElementById("status");
    const root = document.getElementById("songs");
    try {
      const catalog = await loadCatalog();
      // Case-study track stays on its own page; correction uses clearer vocal demos.
      const songs = catalog.songs.filter(
        (s) => s.clips && Object.keys(s.clips).length
      );
      status.textContent = `${songs.length} songs. ${catalog.sources || catalog.library || ""}`;
      root.innerHTML = "";
      for (const song of songs) {
        const card = document.createElement("article");
        card.className = "song";
        const h = document.createElement("h3");
        h.textContent = songTitle(song);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = songMeta(song);
        const grid = document.createElement("div");
        grid.className = "grid";
        for (const [key, label, note] of CORRECTION_ORDER) {
          grid.appendChild(clipRow(label, song.clips && song.clips[key], note));
        }
        card.append(h, meta, grid);
        root.appendChild(card);
      }
    } catch (err) {
      status.textContent =
        "Could not load catalog.json. Serve the MidiBackDemo folder over HTTP (not file://).";
      console.error(err);
    }
  }

  function fmtShift(s) {
    const n = Number(s);
    return (n > 0 ? "+" : "") + n + " st";
  }

  async function renderCaseStudy() {
    const status = document.getElementById("status");
    const root = document.getElementById("case");
    try {
      const catalog = await loadCatalog();
      const songs = catalog.songs.filter((s) => s.case_study && s.case_study.length);
      if (!songs.length) {
        status.textContent = "Case-study clips not in catalog yet.";
        return;
      }
      status.textContent = `Case study on ${songs.map((s) => s.parent).join(", ")}`;
      root.innerHTML = "";
      for (const song of songs) {
        const section = document.createElement("section");
        const h = document.createElement("h2");
        h.textContent = songTitle(song);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = songMeta(song);
        const wrap = document.createElement("div");
        wrap.className = "table-wrap";
        const table = document.createElement("table");
        table.className = "case";
        table.innerHTML =
          "<thead><tr>" +
          "<th>Window</th><th>Shift</th>" +
          "<th>Original mix<br><span class=\"th-sub\">vocal + backing</span></th>" +
          "<th>Original vocal + transposed backing<br><span class=\"th-sub\">held vocal, shifted band</span></th>" +
          "<th>MIDIBack + transposed backing<br><span class=\"th-sub\">corrected vocal over shifted band</span></th>" +
          "</tr></thead>";
        const tbody = document.createElement("tbody");
        const rows = [...song.case_study].sort((a, b) =>
          a.n_bars !== b.n_bars ? a.n_bars - b.n_bars : a.shift - b.shift
        );
        for (const row of rows) {
          const tr = document.createElement("tr");
          const cells = [
            `${row.n_bars} bars`,
            fmtShift(row.shift),
          ];
          for (const text of cells) {
            const td = document.createElement("td");
            td.textContent = text;
            tr.appendChild(td);
          }
          for (const key of ["original", "modulated", "midiback"]) {
            const td = document.createElement("td");
            const a = audioEl(row[key]);
            if (a) td.appendChild(a);
            else td.textContent = "n/a";
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        section.append(h, meta, wrap);
        root.appendChild(section);
      }
    } catch (err) {
      status.textContent =
        "Could not load catalog.json. Serve the MidiBackDemo folder over HTTP (not file://).";
      console.error(err);
    }
  }

  return { renderCorrection, renderCaseStudy };
})();

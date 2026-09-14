const MIDIBackDemo = (() => {
  const CORRECTION_ORDER = [
    ["original", "Original"],
    ["detune", "Detune"],
    ["outshift_detune", "Outshift + Detune"],
    ["midiback", "MIDIBack"],
    ["bertapc_gru", "BERT-APC GRU-only"],
    ["ddpc", "DDPC"],
  ];

  async function loadCatalog() {
    const res = await fetch("catalog.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`catalog.json ${res.status}`);
    return res.json();
  }

  function audioEl(src) {
    if (!src) return null;
    const a = document.createElement("audio");
    a.controls = true;
    a.preload = "none";
    a.src = src;
    return a;
  }

  function clipRow(label, src) {
    const row = document.createElement("div");
    row.className = "clip" + (src ? "" : " missing");
    const lab = document.createElement("label");
    lab.textContent = label;
    row.appendChild(lab);
    const a = audioEl(src);
    if (a) row.appendChild(a);
    return row;
  }

  async function renderCorrection() {
    const status = document.getElementById("status");
    const root = document.getElementById("songs");
    try {
      const catalog = await loadCatalog();
      status.textContent = `${catalog.songs.length} songs · ${catalog.library}`;
      root.innerHTML = "";
      for (const song of catalog.songs) {
        const card = document.createElement("article");
        card.className = "song";
        const h = document.createElement("h3");
        h.textContent = song.id;
        const meta = document.createElement("div");
        meta.className = "meta";
        const r = song.region_sec || [];
        meta.textContent = r.length
          ? `listen window around ${r[0].toFixed(1)}–${r[1].toFixed(1)} s`
          : "";
        const grid = document.createElement("div");
        grid.className = "grid";
        for (const [key, label] of CORRECTION_ORDER) {
          grid.appendChild(clipRow(label, song.clips && song.clips[key]));
        }
        card.append(h, meta, grid);
        root.appendChild(card);
      }
    } catch (err) {
      status.textContent = "Catalog not ready yet — audio render still running.";
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
        h.textContent = song.id;
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
          // modulated.wav = original vocal mixed with transposed backing
          for (const key of ["original", "modulated", "midiback"]) {
            const td = document.createElement("td");
            const a = audioEl(row[key]);
            if (a) td.appendChild(a);
            else td.textContent = "—";
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        section.append(h, wrap);
        root.appendChild(section);
      }
    } catch (err) {
      status.textContent = "Catalog not ready yet — audio render still running.";
      console.error(err);
    }
  }

  return { renderCorrection, renderCaseStudy };
})();

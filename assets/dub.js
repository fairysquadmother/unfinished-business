/* The Department of Unfinished Business — shared clerk logic. */

const DUB = {
  SB: "https://opdiwufyuxogwkjhhkig.supabase.co",
  KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZGl3dWZ5dXhvZ3dramhoa2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODcxNjQsImV4cCI6MjA5MDU2MzE2NH0.yz95CLW9uujdAIJAdTtxzcqVQJX1GgsCUw2yP4Y8y6o",
};

const CAUSES = [
  "Seasonal Ambition",
  "Scope Creep",
  "I Met Someone (a Different Hobby)",
  "January",
  "The Tutorial Ended",
  "Chapter Two",
  "Required Talking to Strangers",
  "The Free Trial Expired",
  "It Became Exercise",
  "Perfectionism, Terminal",
  "The Group Chat Went Quiet",
  "Needed One More Part From the Hardware Store",
  "The YouTube Video Made It Look Easier",
  "A Small Child Appeared",
  "Turned Out to Involve Math",
  "Waiting for the Right Moment (Ongoing)",
  "The Fun Part Ended",
  "Someone Else Did It Better",
  "Someone Asked How It Was Going",
  "Budget Reallocated to Snacks",
  "It Knew What It Did",
  "No Memory of Starting This",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

async function dubRest(path) {
  const res = await fetch(`${DUB.SB}/rest/v1/${path}`, {
    headers: { apikey: DUB.KEY, Authorization: `Bearer ${DUB.KEY}` },
  });
  if (!res.ok) throw new Error(`registry read failed (${res.status})`);
  return res.json();
}

async function dubFn(name, body) {
  const res = await fetch(`${DUB.SB}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: DUB.KEY,
      Authorization: `Bearer ${DUB.KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error */ }
  return { status: res.status, ok: res.ok, data };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtMonth(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return "";
  return `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
}

function fmtInt(n) {
  return Number(n ?? 0).toLocaleString("en-US");
}

function ordinal(d) {
  const s = ["th", "st", "nd", "rd"], v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtEffective(iso) {
  const d = new Date(iso);
  return `this ${ordinal(d.getDate())} day of ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

function certPath(no) {
  // Relative, query-param form: works on any static host with no rewrite rules.
  return `cert.html?no=${encodeURIComponent(no)}`;
}

function stampInfo(row) {
  if (row.status === "pending") return { cls: "discharged", label: "AWAITING FEE" };
  if (row.stamp === "contested") return { cls: "contested", label: "CONTESTED" };
  if (row.stamp === "miracle") return { cls: "miracle", label: "MIRACLE" };
  if (row.status === "house") return { cls: "house", label: "HOUSE FILE" };
  return { cls: "discharged", label: "DISCHARGED" };
}

/* local records of the visitor's own filings (token = proof of ownership).
   Storage is best-effort: a blocked localStorage must never break the flow. */
function dubSaveFiling(rec) {
  try {
    const all = dubFilings();
    all[rec.registry_no] = rec;
    localStorage.setItem("dub_filings", JSON.stringify(all));
    localStorage.setItem("dub_last_pending", JSON.stringify({ token: rec.token, kind: "claim", registry_no: rec.registry_no }));
  } catch { /* private mode / quota — the ?t= URL carries the token instead */ }
}
function dubFilings() {
  try { return JSON.parse(localStorage.getItem("dub_filings") || "{}"); } catch { return {}; }
}
function dubSavePendingAmendment(a) {
  try {
    localStorage.setItem("dub_last_pending", JSON.stringify({ token: a.token, kind: "amendment", registry_no: a.registry_no }));
  } catch { /* best-effort */ }
}
function dubLastPending() {
  try { return JSON.parse(localStorage.getItem("dub_last_pending") || "null"); } catch { return null; }
}

function toast(msg, ms = 3200) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.display = "none"; }, ms);
}

/* The Great Seal: laurel wreath encircling an empty checkbox. */
function sealSVG(opts = {}) {
  const gold = opts.gold === true;
  const ring = gold ? "#a8863a" : "#6e1e1e";
  const arcText = gold ? "ABANDONED WITH DISTINCTION" : "OFFICE OF THE REGISTRAR";
  const id = `sealarc${Math.floor(Math.random() * 1e9)}`;
  return `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Seal of the Department of Unfinished Business: a laurel wreath encircling an empty checkbox">
  <circle cx="60" cy="60" r="57" fill="${gold ? "#f6efdc" : "#f7f2e7"}" stroke="${ring}" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="${ring}" stroke-width="0.75"/>
  <defs><path id="${id}" d="M 60 60 m -43 0 a 43 43 0 1 1 86 0"/></defs>
  <text font-family="'Courier Prime', monospace" font-size="7.2" letter-spacing="2.2" fill="${ring}">
    <textPath href="#${id}" startOffset="50%" text-anchor="middle">${arcText}</textPath>
  </text>
  <g stroke="${ring}" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M28 68 Q30 88 52 95"/>
    <path d="M92 68 Q90 88 68 95"/>
    <path d="M29 70 l-6 -4 M31 78 l-7 -2 M35 85 l-7 1 M41 90 l-6 4 M48 93 l-4 6"/>
    <path d="M91 70 l6 -4 M89 78 l7 -2 M85 85 l7 1 M79 90 l6 4 M72 93 l4 6"/>
  </g>
  <rect x="46" y="38" width="28" height="28" rx="2.5" fill="none" stroke="${ring}" stroke-width="2.4"/>
  <text x="60" y="82" font-family="'Courier Prime', monospace" font-size="6" letter-spacing="1.6" fill="${ring}" text-anchor="middle">EST. IN PERPETUITY</text>
</svg>`;
}

function cornerSVG() {
  return `<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.4">
    <path d="M2 32 V10 Q2 2 10 2 H32"/>
    <path d="M8 32 V14 Q8 8 14 8 H32" stroke-width="0.8"/>
    <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>
  </svg>`;
}

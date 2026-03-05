// ==============================
// Config / Constants
// ==============================

const SUPABASE_URL = "https://xaufdruiponnyncjmjew.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdWZkcnVpcG9ubnluY2ptamV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDA3MDcsImV4cCI6MjA4ODMxNjcwN30.JzhQqbSy3V6r1uSXk9r43vsAsO0ycCGjGhrimlY_zyw";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Goal schema
 * {
 *  id: string,
 *  title: string,
 *  type: "once"|"count"|"deadline",
 *  category: string,
 *  created_at: ISO string,
 *  done: boolean,
 *  // for count:
 *  current: number,
 *  target: number,
 *  // for deadline:
 *  due: "YYYY-MM-DD" | ""
 * }
 */

const DEFAULT_GOALS = [
  // Outdoors / Fitness
  { title: "Go fishing", type: "count", category: "Outdoors", done: false, current: 0, target: 1 },
  { title: "Run half marathon", type: "once", category: "Fitness", done: false },
  { title: "Hike Mission Peak 4x", type: "count", category: "Outdoors", done: false, current: 0, target: 4 },
  { title: "Run sub-2 hour half marathon", type: "once", category: "Fitness", done: false },

  // Certs / Learning
  { title: "Get Network+ certification", type: "once", category: "Cybersecurity", done: false },
  { title: "Get Security+ certification", type: "once", category: "Cybersecurity", done: false },
  { title: "Read 5 books (no audiobooks)", type: "count", category: "Other", done: false, current: 0, target: 5 },

  // Relationships
  { title: "Take Rachel on a date to a new restaurant", type: "count", category: "Relationships", done: false, current: 0, target: 1 },
  { title: "Take Rachel on a date to a new experience", type: "count", category: "Relationships", done: false, current: 0, target: 1 },
  { title: "Golf with Derek", type: "count", category: "Relationships", done: false, current: 0, target: 1 },

  // Life admin
  { title: "Schedule wisdom tooth extraction", type: "once", category: "Life Admin", done: false },
  { title: "Cancel gym membership", type: "deadline", category: "Life Admin", done: false, due: "" },

  // Creative / Maker / Career
  { title: "Photograph a wild animal", type: "once", category: "Outdoors", done: false },
  { title: "Hem 3 of Rachel’s pants", type: "count", category: "Life Admin", done: false, current: 0, target: 3 },
  { title: "Finish 150 TryHackMe labs/challenges", type: "count", category: "Cybersecurity", done: false, current: 0, target: 150 },
  { title: "Build and document 3 security projects", type: "count", category: "Cybersecurity", done: false, current: 0, target: 3 },
  { title: "Publish 6 cybersecurity write-ups", type: "count", category: "Cybersecurity", done: false, current: 0, target: 6 },
  { title: "Apply to/engage with 24 job listings", type: "count", category: "Career", done: false, current: 0, target: 24 },
  { title: "Design and 3D print 5 original functional objects", type: "count", category: "Maker", done: false, current: 0, target: 5 },
  { title: "Build HomeLab", type: "once", category: "Cybersecurity", done: false },
  { title: "Build 1 fully enclosed electronic device (no breadboard)", type: "once", category: "Maker", done: false },
  { title: "Build 5 working software projects", type: "count", category: "Coding", done: false, current: 0, target: 5 },
  { title: "30 commits to GitHub", type: "count", category: "Coding", done: false, current: 0, target: 30 },
  { title: "Solve 25 coding challenges", type: "count", category: "Coding", done: false, current: 0, target: 25 }
];

// ==============================
// DOM Helpers
// ==============================

const $ = (sel) => document.querySelector(sel);

const listEl = $("#list");
const statsEl = $("#stats");

const titleEl = $("#title");
const typeEl = $("#type");
const categoryEl = $("#category");
const targetEl = $("#target");
const dueEl = $("#due");

const addBtn = $("#addBtn");
const resetBtn = $("#resetBtn");
const exportBtn = $("#exportBtn");
const importBtn = $("#importBtn");
const toastEl = $("#toast");
const authForm = $("#authForm");
const authEmailEl = $("#authEmail");
const authPasswordEl = $("#authPassword");
const signInBtn = $("#signInBtn");
const signUpBtn = $("#signUpBtn");
const signOutBtn = $("#signOutBtn");
const authStatusEl = $("#authStatus");
const authStatusAppEl = $("#authStatusApp");
const authRequiredEl = $("#authRequired");
const authPageEl = $("#authPage");
const appPageEl = $("#appPage");

// ==============================
// Utilities
// ==============================

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function iconForType(type) {
  if (type === "once") return "✅";
  if (type === "count") return "🔢";
  if (type === "deadline") return "📅";
  return "•";
}

function labelForType(type) {
  if (type === "once") return "Once";
  if (type === "count") return "Count";
  if (type === "deadline") return "Deadline";
  return type;
}

function pct(g) {
  if (g.type !== "count") return g.done ? 100 : 0;
  const t = Math.max(1, Number(g.target || 1));
  const c = Math.max(0, Number(g.current || 0));
  return Math.min(100, Math.round((c / t) * 100));
}

function isOverdue(g) {
  if (g.type !== "deadline" || g.done) return false;
  if (!g.due) return false;
  return g.due < todayISODate();
}

function hydrateDefaultGoal(seed) {
  const g = {
    id: uid(),
    created_at: new Date().toISOString(),
    done: false,
    ...seed
  };

  sanitizeGoalForType(g);

  // Set your gym deadline default if blank
  if (g.title === "Cancel gym membership" && g.type === "deadline") {
    const year = new Date().getFullYear();
    g.due = g.due || `${year}-03-01`;
  }

  return g;
}

function sanitizeGoalForType(goal) {
  const g = goal;

  if (g.type === "count") {
    g.current = Number.isFinite(Number(g.current)) ? Number(g.current) : 0;
    g.target = Math.max(1, Number(g.target || 1));
    g.due = null;
    return g;
  }

  if (g.type === "deadline") {
    const due = typeof g.due === "string" ? g.due.trim() : "";
    g.due = /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null;
    g.current = null;
    g.target = null;
    return g;
  }

  g.current = null;
  g.target = null;
  g.due = null;
  return g;
}

function normalizeImportedGoal(raw) {
  // Accept only plain objects
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const title = String(raw.title || "").trim();
  if (!title) return null;

  const allowedTypes = new Set(["once", "count", "deadline"]);
  const type = allowedTypes.has(raw.type) ? raw.type : "once";

  const category = String(raw.category || "Other").trim() || "Other";

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : uid();

  const createdAtRaw = raw.created_at || raw.createdAt;
  const created_at =
    typeof createdAtRaw === "string" && !Number.isNaN(Date.parse(createdAtRaw))
      ? createdAtRaw
      : new Date().toISOString();

  // done is only meaningful for non-count goals in this app
  const done = Boolean(raw.done);

  const g = {
    id,
    title,
    type,
    category,
    created_at,
    done,
    current: raw.current,
    target: raw.target,
    due: raw.due
  };

  sanitizeGoalForType(g);

  if (g.type === "deadline" && !g.due) return null;
  if (g.type === "count" && (!Number.isFinite(g.current) || !Number.isFinite(g.target))) return null;

  return g;
}

// ==============================
// State
// ==============================

let goals = [];
let filter = "all";

let undoState = null; // { goal, index }
let undoTimerId = null;
let currentUser = null;

// ==============================
// Supabase
// ==============================

async function fetchGoals() {
  if (!currentUser) return [];
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: true });

  if (error) {
    alert(`Failed to load goals: ${error.message}`);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function insertGoal(goal) {
  const { data, error } = await supabase.from("goals").insert(goal).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateGoalRemote(id, payload) {
  const { data, error } = await supabase.from("goals").update(payload).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteGoalRemote(id) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ==============================
// Toast + Undo
// ==============================

function showToast(message, { actionText, onAction, durationMs = 8000 } = {}) {
  if (!toastEl) return;

  // Clear any previous timer
  if (undoTimerId) {
    clearTimeout(undoTimerId);
    undoTimerId = null;
  }

  toastEl.innerHTML = `
    <div class="msg">${escapeHtml(message)}</div>
    <div class="actions">
      ${actionText ? `<button id="toastAction" class="mini">${escapeHtml(actionText)}</button>` : ""}
      <button id="toastClose" class="mini btn-secondary">Close</button>
    </div>
  `;

  toastEl.style.display = "flex";

  const close = () => {
    toastEl.style.display = "none";
    toastEl.innerHTML = "";
    // If the user closes it, we still keep undoState until it expires by timer.
  };

  toastEl.querySelector("#toastClose")?.addEventListener("click", close);

  if (actionText && typeof onAction === "function") {
    toastEl.querySelector("#toastAction")?.addEventListener("click", () => {
      onAction();
      close();
    });
  }

  undoTimerId = setTimeout(() => {
    // When toast expires, undo no longer available
    undoState = null;
    close();
  }, durationMs);
}

// ==============================
// Auth
// ==============================

function setAuthUI(user) {
  const signedIn = !!user;
  if (authPageEl) authPageEl.style.display = signedIn ? "none" : "grid";
  if (appPageEl) appPageEl.style.display = signedIn ? "block" : "none";

  signOutBtn.style.display = signedIn ? "inline-flex" : "none";
  authStatusEl.textContent = signedIn ? `Signed in as ${user.email}` : "Not signed in.";
  if (authStatusAppEl) authStatusAppEl.textContent = signedIn ? `Signed in as ${user.email}` : "";
  authRequiredEl.style.display = signedIn ? "none" : "block";
}

async function loadAndRender() {
  goals = await fetchGoals();
  if (goals.length === 0 && currentUser) {
    const seeded = DEFAULT_GOALS.map(hydrateDefaultGoal).map((g) => ({
      ...g,
      user_id: currentUser.id
    }));
    try {
      const { data, error } = await supabase.from("goals").insert(seeded).select();
      if (error) throw new Error(error.message);
      goals = Array.isArray(data) ? data : [];
    } catch (err) {
      alert(`Failed to seed defaults: ${err.message}`);
    }
  }
  render();
}

async function initAuth() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  setAuthUI(currentUser);
  if (currentUser) await loadAndRender();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    setAuthUI(currentUser);
    if (currentUser) {
      await loadAndRender();
    } else {
      goals = [];
      render();
    }
  });
}

async function undoDelete() {
  if (!undoState) return;

  const { goal, index } = undoState;

  // If it somehow already exists, don't duplicate
  if (goals.some((g) => g.id === goal.id)) {
    undoState = null;
    return;
  }

  try {
    const restored = await insertGoal(goal);
    // Reinsert at original position (or end if out of range)
    const safeIndex = Math.min(Math.max(index, 0), goals.length);
    goals.splice(safeIndex, 0, restored);
  } catch (err) {
    alert(`Undo failed: ${err.message}`);
  }

  undoState = null;
  render();
}

// ==============================
// Rendering
// ==============================

function renderStats() {
  const total = goals.length;
  const done = goals.filter((g) => (g.type === "count" ? Number(g.current || 0) >= Number(g.target || 1) : g.done)).length;
  const active = total - done;

  const deadlines = goals.filter((g) => g.type === "deadline" && !g.done).length;
  const overdue = goals.filter((g) => isOverdue(g)).length;

  statsEl.innerHTML = `
    <span class="pill"><span class="good">●</span> Done: ${done}/${total}</span>
    <span class="pill">Active: ${active}</span>
    <span class="pill">Deadlines: ${deadlines}</span>
    <span class="pill">${overdue ? `<span class="danger">Overdue: ${overdue}</span>` : "Overdue: 0"}</span>
  `;
}

function passFilter(g) {
  const isDone = g.type === "count" ? Number(g.current || 0) >= Number(g.target || 1) : g.done;

  if (filter === "all") return true;
  if (filter === "active") return !isDone;
  if (filter === "done") return isDone;
  if (filter === "deadline") return g.type === "deadline";

  // category filter
  return g.category === filter;
}

function sortGoals(a, b) {
  // Overdue deadlines first, then deadlines by due date, then active before done, then title
  const aDone = a.type === "count" ? Number(a.current || 0) >= Number(a.target || 1) : a.done;
  const bDone = b.type === "count" ? Number(b.current || 0) >= Number(b.target || 1) : b.done;

  const aOver = isOverdue(a);
  const bOver = isOverdue(b);
  if (aOver !== bOver) return aOver ? -1 : 1;

  const aDead = a.type === "deadline";
  const bDead = b.type === "deadline";
  if (aDead !== bDead) return aDead ? -1 : 1;

  if (aDead && bDead) {
    const ad = a.due || "9999-12-31";
    const bd = b.due || "9999-12-31";
    if (ad !== bd) return ad < bd ? -1 : 1;
  }

  if (aDone !== bDone) return aDone ? 1 : -1;

  return a.title.localeCompare(b.title);
}

function render() {
  renderStats();

  const visible = goals.filter(passFilter).sort(sortGoals);

  listEl.innerHTML = "";
  for (const g of visible) {
    const isCount = g.type === "count";
    const t = isCount ? Math.max(1, Number(g.target || 1)) : 1;
    const c = isCount ? Math.max(0, Number(g.current || 0)) : 0;
    const progress = pct(g);

    const isDone = isCount ? c >= t : !!g.done;

    const dueBits =
      g.type === "deadline"
        ? `<span class="pill" data-action="editDue" data-id="${g.id}">
           ${isOverdue(g) ? `<span class="danger">⚠ Overdue</span>` : `📅 Due: ${g.due || "—"}`}
         </span>`
        : "";

    const progressBits = isCount ? `<span class="pill" data-action="editCount" data-id="${g.id}">🔢 ${c}/${t} (${progress}%)</span>` : "";

    const card = document.createElement("div");
    card.className = "goal";

    card.innerHTML = `
      <div>
        <div class="goal-title">
          <span data-action="editTitle" data-id="${g.id}">${escapeHtml(g.title)}</span>
        </div>
        <div class="goal-meta">
          <span class="pill">${escapeHtml(g.category)}</span>
          <span class="pill">${iconForType(g.type)} ${labelForType(g.type)}</span>
          ${dueBits}
          ${progressBits}
        </div>

        ${isCount ? `<div class="progressbar" aria-label="progress"><div style="width:${progress}%"></div></div>` : ""}
      </div>

      <div class="right">
        ${isCount ? `
          <button class="mini btn-secondary" data-action="dec" data-id="${g.id}">−</button>
          <button class="mini" data-action="inc" data-id="${g.id}">+</button>
        ` : `
          <div class="toggle" title="Mark complete">
            <input class="check" type="checkbox" data-action="toggle" data-id="${g.id}" ${isDone ? "checked" : ""} />
          </div>
        `}
        <button class="mini btn-danger" data-action="del" data-id="${g.id}">✕</button>
      </div>
    `;

    if (isDone) card.style.opacity = "0.75";
    listEl.appendChild(card);
  }
}

// ==============================
// Inline Editing
// ==============================

function startInlineTitleEdit(id, spanEl) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  const original = goal.title;

  const input = document.createElement("input");
  input.value = original;
  input.className = "mini";
  input.style.width = "100%";
  input.style.padding = "8px 10px";
  input.style.borderRadius = "12px";

  // Swap span -> input
  spanEl.replaceWith(input);
  input.focus();
  input.select();

  const cancel = () => {
    input.replaceWith(spanEl);
  };

  const save = () => {
    const next = input.value.trim();
    if (!next) {
      cancel();
      return;
    }
    updateGoal(id, (g) => {
      g.title = next;
      return g;
    });
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  });

  input.addEventListener("blur", save);
}

function startInlineCountEdit(id, pillEl) {
  const goal = goals.find((g) => g.id === id);
  if (!goal || goal.type !== "count") return;

  const wrap = document.createElement("span");
  wrap.className = "pill";
  wrap.style.gap = "6px";

  const current = document.createElement("input");
  current.type = "number";
  current.min = "0";
  current.value = String(Math.max(0, Number(goal.current || 0)));
  current.style.width = "72px";

  const slash = document.createElement("span");
  slash.textContent = "/";

  const target = document.createElement("input");
  target.type = "number";
  target.min = "1";
  target.value = String(Math.max(1, Number(goal.target || 1)));
  target.style.width = "72px";

  const saveBtn = document.createElement("button");
  saveBtn.className = "mini";
  saveBtn.style.width = "auto";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "mini btn-secondary";
  cancelBtn.style.width = "auto";
  cancelBtn.textContent = "Cancel";

  wrap.append("🔢 ", current, slash, target, saveBtn, cancelBtn);

  pillEl.replaceWith(wrap);
  current.focus();
  current.select();

  const cancel = () => render();

  const save = () => {
    const c = Math.max(0, Number(current.value || 0));
    const t = Math.max(1, Number(target.value || 1));
    updateGoal(id, (g) => {
      g.current = Math.min(c, t);
      g.target = t;
      return g;
    });
  };

  saveBtn.addEventListener("click", save);
  cancelBtn.addEventListener("click", cancel);

  wrap.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    },
    true
  );
}

function startInlineDueEdit(id, pillEl) {
  const goal = goals.find((g) => g.id === id);
  if (!goal || goal.type !== "deadline") return;

  const wrap = document.createElement("span");
  wrap.className = "pill";
  wrap.style.gap = "6px";

  const date = document.createElement("input");
  date.type = "date";
  date.value = goal.due || "";
  date.style.width = "160px";

  const saveBtn = document.createElement("button");
  saveBtn.className = "mini";
  saveBtn.style.width = "auto";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "mini btn-secondary";
  cancelBtn.style.width = "auto";
  cancelBtn.textContent = "Cancel";

  wrap.append("📅 ", date, saveBtn, cancelBtn);

  pillEl.replaceWith(wrap);
  date.focus();

  const cancel = () => render();

  const save = () => {
    if (!date.value) {
      alert("Please select a due date.");
      return;
    }
    updateGoal(id, (g) => {
      g.due = date.value || "";
      return g;
    });
  };

  saveBtn.addEventListener("click", save);
  cancelBtn.addEventListener("click", cancel);

  wrap.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") cancel();
    },
    true
  );
}

// ==============================
// Mutations
// ==============================

async function addGoal() {
  if (!currentUser) {
    alert("Please sign in to add goals.");
    return;
  }

  const title = titleEl.value.trim();
  const type = typeEl.value;
  const category = categoryEl.value;
  const target = Number(targetEl.value || 0);
  const due = dueEl.value;

  if (!title) {
    alert("Please enter a goal title.");
    return;
  }
  if (type === "deadline" && !due) {
    alert("Please select a due date for deadline goals.");
    return;
  }

  const g = {
    id: uid(),
    title,
    type,
    category,
    created_at: new Date().toISOString(),
    done: false,
    current: null,
    target: null,
    due: null
  };

  if (type === "count") {
    g.current = 0;
    g.target = target > 0 ? target : 1;
  }

  if (type === "deadline") {
    g.due = due || "";
    g.done = false;
  }

  sanitizeGoalForType(g);

  try {
    const inserted = await insertGoal({ ...g, user_id: currentUser.id });
    goals.push(inserted);
  } catch (err) {
    alert(`Failed to add goal: ${err.message}`);
  }

  titleEl.value = "";
  targetEl.value = "";
  dueEl.value = "";

  render();
}

async function updateGoal(id, updater) {
  const existing = goals.find((g) => g.id === id);
  if (!existing) return;
  const next = updater({ ...existing });
  sanitizeGoalForType(next);

  const payload = {
    title: next.title,
    type: next.type,
    category: next.category,
    done: next.done,
    current: next.current,
    target: next.target,
    due: next.due
  };

  try {
    const updated = await updateGoalRemote(id, payload);
    goals = goals.map((g) => (g.id === id ? updated : g));
    render();
  } catch (err) {
    alert(`Failed to update goal: ${err.message}`);
  }
}

async function deleteGoal(id) {
  const index = goals.findIndex((g) => g.id === id);
  if (index === -1) return;

  const deleted = goals[index];

  // Save undo state (single-step undo)
  undoState = { goal: deleted, index };

  // Remove it
  goals = goals.filter((g) => g.id !== id);
  render();

  try {
    await deleteGoalRemote(id);
  } catch (err) {
    alert(`Failed to delete goal: ${err.message}`);
    // Restore locally if delete failed
    goals.splice(index, 0, deleted);
    render();
    return;
  }

  showToast(`Deleted: ${deleted.title}`, {
    actionText: "Undo",
    onAction: () => undoDelete()
  });
}

// ==============================
// Event Listeners
// ==============================

function wireEvents() {
  addBtn.addEventListener("click", addGoal);

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmailEl.value.trim();
    const password = authPasswordEl.value;
    if (!email || !password) {
      alert("Please enter an email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Sign in failed: ${error.message}`);
    }
  });

  signUpBtn.addEventListener("click", async () => {
    const email = authEmailEl.value.trim();
    const password = authPasswordEl.value;
    if (!email || !password) {
      alert("Please enter an email and password.");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(`Sign up failed: ${error.message}`);
      return;
    }

    alert("Sign up successful. Please check your email to confirm your account.");
  });

  signOutBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(`Sign out failed: ${error.message}`);
  });

  // Click handlers
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    if (action === "editTitle") {
      startInlineTitleEdit(id, btn);
      return;
    }

    if (action === "editCount") {
      startInlineCountEdit(id, btn);
      return;
    }

    if (action === "editDue") {
      startInlineDueEdit(id, btn);
      return;
    }

    if (action === "inc") {
      updateGoal(id, (g) => {
        g.current = Math.min(Number(g.target || 1), Number(g.current || 0) + 1);
        return g;
      });
    }

    if (action === "dec") {
      updateGoal(id, (g) => {
        g.current = Math.max(0, Number(g.current || 0) - 1);
        return g;
      });
    }

    if (action === "del") {
      if (confirm("Delete this goal?")) deleteGoal(id);
    }
  });

  // Checkbox toggle (needs change event)
  listEl.addEventListener("change", (e) => {
    const cb = e.target.closest("[data-action='toggle']");
    if (!cb) return;
    const id = cb.getAttribute("data-id");

    updateGoal(id, (g) => {
      g.done = !!cb.checked;
      return g;
    });
  });

  // Filters
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filter = chip.getAttribute("data-filter");
      render();
    });
  });

  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all goals and progress? This cannot be undone.")) {
      (async () => {
        if (!currentUser) return;
        try {
          await supabase.from("goals").delete().eq("user_id", currentUser.id);
          await loadAndRender();
        } catch (err) {
          alert(`Reset failed: ${err.message}`);
        }
      })();
    }
  });

  exportBtn.addEventListener("click", () => {
    const exportGoals = goals.map((g) => ({
      id: g.id,
      title: g.title,
      type: g.type,
      category: g.category,
      created_at: g.created_at,
      done: g.done,
      current: g.current,
      target: g.target,
      due: g.due
    }));
    const data = JSON.stringify(exportGoals, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "goals-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("Invalid file");
        const normalized = parsed
          .map(normalizeImportedGoal)
          .filter(Boolean);

        if (normalized.length === 0) throw new Error("No valid goals");

        // Deduplicate by id (first one wins)
        const seen = new Set();
        const deduped = normalized.filter((g) => {
          if (seen.has(g.id)) return false;
          seen.add(g.id);
          return true;
        });

        if (!currentUser) throw new Error("Not signed in");

        await supabase.from("goals").delete().eq("user_id", currentUser.id);
        const rows = deduped.map((g) => ({
          ...g,
          user_id: currentUser.id
        }));
        const { data, error } = await supabase.from("goals").insert(rows).select();
        if (error) throw new Error(error.message);

        goals = Array.isArray(data) ? data : [];
        render();

        const skipped = parsed.length - deduped.length;
        alert(`Import complete. Imported ${goals.length} goal(s)${skipped ? ` (skipped ${skipped} invalid).` : "."}`);
      } catch {
        alert("Import failed. Make sure it's a valid goals-backup.json file (an array of goal objects).\nTip: Use the Export button to generate a compatible file.");
      }
    };

    input.click();
  });

  // Cmd/Ctrl+Z undo delete
  document.addEventListener("keydown", (e) => {
    const isCmdZ = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z";
    if (isCmdZ && undoState) {
      e.preventDefault();
      undoDelete();
    }
  });
}

// ==============================
// Boot
// ==============================

wireEvents();
initAuth();

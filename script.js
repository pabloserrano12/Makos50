/* ===== CONFIGURACIÓN: modifica aquí el escondite del regalo ===== */
const ESCONDITE = "[ESCRIBIR AQUÍ EL ESCONDITE]";
/* ================================================================= */

const KEY = "expediente-familiar-progreso";
const FASES = {
  1: { ok: v => v.trim().toUpperCase() === "NMP", err: "Autorización denegada. Revisa la clave.", good: "Autorización concedida.", flash: "AUTORIZACIÓN CONCEDIDA", next: 2 },
  2: { ok: v => /^0?7$/.test(v.trim()), err: "Cálculo incorrecto. Revisa las estadísticas.", good: "Datos verificados.", flash: "DATOS VERIFICADOS", next: 3 },
  3: { ok: v => v.trim() === "042", err: "Código rechazado. Revisa las pistas.", good: "Código aceptado.", flash: "CÓDIGO ACEPTADO · CASO CERRADO", next: 4 }
};
const ETIQUETAS = { 1: "01", 2: "02", 3: "03", 4: "FIN" };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let max = 0, current = 0;
try { max = Math.min(4, Math.max(0, parseInt(localStorage.getItem(KEY), 10) || 0)); } catch (e) { max = 0; }

function guardar() { try { localStorage.setItem(KEY, String(max)); } catch (e) {} }

function pintarNav() {
  const nav = $("#nav");
  nav.innerHTML = "";
  for (let s = 1; s <= 4; s++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ETIQUETAS[s];
    b.disabled = s > max;
    if (s < max || (s === 4 && max === 4)) b.classList.add("done");
    if (s === current) { b.classList.add("on"); b.setAttribute("aria-current", "step"); }
    b.setAttribute("aria-label", s === 4 ? "Expediente final" : "Expediente " + ETIQUETAS[s]);
    b.addEventListener("click", () => go(s));
    nav.appendChild(b);
  }
  $("#barFill").style.width = Math.min(100, Math.max(0, max - 1) / 3 * 100) + "%";
}

function go(n) {
  if (n > max) return;
  current = n;
  $$(".phase").forEach(sec => {
    const activa = Number(sec.dataset.step) === n;
    sec.hidden = !activa;
    sec.classList.remove("enter");
    if (activa) { void sec.offsetWidth; sec.classList.add("enter"); }
  });
  $$(".next").forEach(b => { b.hidden = !(max > Number(b.dataset.goto) - 1); });
  document.body.classList.toggle("warm", n === 4);
  $("#top").hidden = n === 0;
  const fin = $(".final");
  fin.classList.remove("show");
  if (n === 4) { void fin.offsetWidth; fin.classList.add("show"); }
  $("#hide").textContent = ESCONDITE;
  pintarNav();
  window.scrollTo(0, 0);
}

function destello(texto, despues) {
  $("#flashTxt").textContent = texto;
  $("#flash").classList.add("show");
  setTimeout(() => { $("#flash").classList.remove("show"); despues(); }, 1300);
}

$("#start").addEventListener("click", () => { max = Math.max(max, 1); guardar(); go(Math.max(1, Math.min(max, 1))); });

$$("form.check").forEach(form => {
  const fase = FASES[form.dataset.step];
  const input = $("input", form), msg = $(".msg", form);
  if (input.classList.contains("code") || form.dataset.step === "2") {
    input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, ""); });
  }
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (fase.ok(input.value)) {
      msg.className = "msg ok";
      msg.textContent = fase.good;
      input.blur();
      destello(fase.flash, () => {
        max = Math.max(max, fase.next);
        guardar();
        go(fase.next);
        msg.textContent = "";
      });
    } else {
      msg.className = "msg err";
      msg.textContent = fase.err;
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      input.focus();
      input.select();
    }
  });
});

$$(".next").forEach(b => b.addEventListener("click", () => go(Number(b.dataset.goto))));

/* Reinicio con confirmación */
$("#resetBtn").addEventListener("click", () => $("#confirm").classList.add("show"));
$("#cNo").addEventListener("click", () => $("#confirm").classList.remove("show"));
$("#cYes").addEventListener("click", () => {
  try { localStorage.removeItem(KEY); } catch (e) {}
  max = 0;
  $$("form.check").forEach(f => { $("input", f).value = ""; $(".msg", f).textContent = ""; });
  $("#confirm").classList.remove("show");
  go(0);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#confirm").classList.remove("show"); });

go(max === 0 ? 0 : max);

"use strict";
import { jsx, jsxs } from "preact/jsx-runtime";
import { useState, useMemo } from "preact/hooks";
const OPS = [
  { id: "add", label: "A + B" },
  { id: "sub", label: "A \u2212 B" },
  { id: "mul", label: "A \xD7 B" },
  { id: "mulBA", label: "B \xD7 A" },
  { id: "scale", label: "k \xD7 A" },
  { id: "transposeA", label: "A \u7684\u8F6C\u7F6E" },
  { id: "transposeB", label: "B \u7684\u8F6C\u7F6E" },
  { id: "detA", label: "A \u7684\u884C\u5217\u5F0F" },
  { id: "detB", label: "B \u7684\u884C\u5217\u5F0F" },
  { id: "invA", label: "A \u7684\u9006\u77E9\u9635" },
  { id: "invB", label: "B \u7684\u9006\u77E9\u9635" }
];
function round(x) {
  if (!Number.isFinite(x)) return x;
  return Number(x.toFixed(6));
}
function fmt(x) {
  if (!Number.isFinite(x)) return "\u6570\u503C\u8D85\u51FA\u53EF\u8868\u793A\u8303\u56F4";
  return String(Number(x.toFixed(4)));
}
function emptyCells(size, filler) {
  return Array.from(
    { length: size },
    (_, r) => Array.from({ length: size }, (_2, c) => r === c ? String(filler) : "0")
  );
}
function resize(cells, size) {
  return Array.from(
    { length: size },
    (_, r) => Array.from({ length: size }, (_2, c) => cells[r] && cells[r][c] !== void 0 ? cells[r][c] : "0")
  );
}
function parseMatrix(cells, name) {
  const size = cells.length;
  const m = [];
  for (let r = 0; r < size; r += 1) {
    const row = [];
    for (let c = 0; c < size; c += 1) {
      const raw = (cells[r][c] ?? "").trim();
      if (raw === "") {
        row.push(0);
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        if (raw.length > 0 && !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
          return { ok: false, error: `\u77E9\u9635 ${name} \u7B2C ${r + 1} \u884C\u7B2C ${c + 1} \u5217\u4E0D\u662F\u6709\u6548\u6570\u5B57\uFF0C\u8BF7\u586B\u5199\u6570\u5B57` };
        }
        return { ok: false, error: `\u77E9\u9635 ${name} \u7B2C ${r + 1} \u884C\u7B2C ${c + 1} \u5217\u7684\u6570\u503C\u8FC7\u5927\u6216\u65E0\u6CD5\u8BC6\u522B\uFF0C\u8BF7\u6362\u4E2A\u8303\u56F4` };
      }
      if (Math.abs(n) > 1e15) {
        return { ok: false, error: `\u77E9\u9635 ${name} \u7B2C ${r + 1} \u884C\u7B2C ${c + 1} \u5217\u6570\u503C\u8FC7\u5927\uFF0C\u4E3A\u907F\u514D\u8FD0\u7B97\u6EA2\u51FA\u8BF7\u63A7\u5236\u5728 1e15 \u4EE5\u5185` };
      }
      row.push(n);
    }
    m.push(row);
  }
  return { ok: true, m };
}
function det(m) {
  const n = m.length;
  if (n === 2) return round(m[0][0] * m[1][1] - m[0][1] * m[1][0]);
  const a = m[0][0];
  const b = m[0][1];
  const c = m[0][2];
  return round(
    a * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - b * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + c * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}
function transpose(m) {
  return m[0].map((_, c) => m.map((row) => round(row[c])));
}
function multiply(a, b) {
  const n = a.length;
  const out = [];
  for (let r = 0; r < n; r += 1) {
    const row = [];
    for (let c = 0; c < n; c += 1) {
      let sum = 0;
      for (let k = 0; k < n; k += 1) sum += a[r][k] * b[k][c];
      row.push(round(sum));
    }
    out.push(row);
  }
  return out;
}
function addOrSub(a, b, sign) {
  return a.map((row, r) => row.map((v, c) => round(v + sign * b[r][c])));
}
function scale(a, k) {
  return a.map((row) => row.map((v) => round(v * k)));
}
function inverse(m) {
  const d = det(m);
  if (Math.abs(d) < 1e-9) return null;
  const n = m.length;
  if (n === 2) {
    return [
      [round(m[1][1] / d), round(-m[0][1] / d)],
      [round(-m[1][0] / d), round(m[0][0] / d)]
    ];
  }
  const cof = [];
  for (let r = 0; r < 3; r += 1) {
    const row = [];
    for (let c = 0; c < 3; c += 1) {
      const rs = [0, 1, 2].filter((x) => x !== r);
      const cs = [0, 1, 2].filter((x) => x !== c);
      const minor = m[rs[0]][cs[0]] * m[rs[1]][cs[1]] - m[rs[0]][cs[1]] * m[rs[1]][cs[0]];
      row.push(round(((r + c) % 2 === 0 ? 1 : -1) * minor));
    }
    cof.push(row);
  }
  const adj = transpose(cof);
  return adj.map((row) => row.map((v) => round(v / d)));
}
export default function MatrixCalculator() {
  const [size, setSize] = useState(2);
  const [a, setA] = useState(() => emptyCells(2, 1));
  const [b, setB] = useState(() => emptyCells(2, 2));
  const [scalar, setScalar] = useState("2");
  const [op, setOp] = useState("mul");
  const changeSize = (next) => {
    setSize(next);
    setA((prev) => resize(prev, next));
    setB((prev) => resize(prev, next));
  };
  const result = useMemo(() => {
    const pa = parseMatrix(a, "A");
    if (!pa.ok) return { ok: false, error: pa.error };
    const pb = parseMatrix(b, "B");
    if (!pb.ok) return { ok: false, error: pb.error };
    const k = scalar.trim() === "" ? 1 : Number(scalar);
    if (!Number.isFinite(k)) return { ok: false, error: "\u6807\u91CF k \u4E0D\u662F\u6709\u6548\u6570\u5B57\uFF0C\u8BF7\u586B\u5199\u6570\u5B57" };
    if (Math.abs(k) > 1e15) return { ok: false, error: "\u6807\u91CF k \u6570\u503C\u8FC7\u5927\uFF0C\u8BF7\u63A7\u5236\u5728 1e15 \u4EE5\u5185" };
    const label = OPS.find((o) => o.id === op)?.label ?? "";
    switch (op) {
      case "add":
        return { ok: true, matrix: addOrSub(pa.m, pb.m, 1), scalar: null, label };
      case "sub":
        return { ok: true, matrix: addOrSub(pa.m, pb.m, -1), scalar: null, label };
      case "mul":
        return { ok: true, matrix: multiply(pa.m, pb.m), scalar: null, label };
      case "mulBA":
        return { ok: true, matrix: multiply(pb.m, pa.m), scalar: null, label };
      case "scale":
        return { ok: true, matrix: scale(pa.m, k), scalar: null, label };
      case "transposeA":
        return { ok: true, matrix: transpose(pa.m), scalar: null, label };
      case "transposeB":
        return { ok: true, matrix: transpose(pb.m), scalar: null, label };
      case "detA":
        return { ok: true, matrix: null, scalar: det(pa.m), label };
      case "detB":
        return { ok: true, matrix: null, scalar: det(pb.m), label };
      case "invA": {
        const inv = inverse(pa.m);
        if (!inv) return { ok: false, error: "\u8BE5\u77E9\u9635\u4E0D\u53EF\u9006\uFF08\u884C\u5217\u5F0F\u4E3A 0\uFF09\uFF0C\u77E9\u9635 A \u662F\u5947\u5F02\u77E9\u9635" };
        return { ok: true, matrix: inv, scalar: null, label };
      }
      case "invB": {
        const inv = inverse(pb.m);
        if (!inv) return { ok: false, error: "\u8BE5\u77E9\u9635\u4E0D\u53EF\u9006\uFF08\u884C\u5217\u5F0F\u4E3A 0\uFF09\uFF0C\u77E9\u9635 B \u662F\u5947\u5F02\u77E9\u9635" };
        return { ok: true, matrix: inv, scalar: null, label };
      }
      default:
        return { ok: false, error: "\u672A\u77E5\u8FD0\u7B97" };
    }
  }, [a, b, scalar, op]);
  const dets = useMemo(() => {
    const pa = parseMatrix(a, "A");
    const pb = parseMatrix(b, "B");
    return {
      detA: pa.ok ? det(pa.m) : null,
      detB: pb.ok ? det(pb.m) : null
    };
  }, [a, b]);
  const setCell = (which, r, c, v) => {
    const setter = which === "a" ? setA : setB;
    setter((prev) => prev.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? v : cell) : row));
  };
  const gridClass = size === 2 ? "grid-cols-2" : "grid-cols-3";
  const renderInput = (which, title) => {
    const cells = which === "a" ? a : b;
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { class: "text-sm font-medium", children: title }),
      /* @__PURE__ */ jsx("div", { class: `mt-1.5 grid gap-2 ${gridClass} max-w-xs`, children: cells.map(
        (row, r) => row.map((cell, c) => /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            inputmode: "decimal",
            autocomplete: "off",
            spellcheck: false,
            class: "input input-bordered input-sm w-full text-center font-mono",
            value: cell,
            onInput: (e) => setCell(which, r, c, e.target.value)
          },
          `${which}-${r}-${c}`
        ))
      ) })
    ] });
  };
  const renderMatrix = (m) => /* @__PURE__ */ jsx("div", { class: `grid gap-2 ${gridClass} max-w-xs`, children: m.map(
    (row, r) => row.map((v, c) => /* @__PURE__ */ jsx(
      "div",
      {
        class: "rounded-lg bg-base-100 px-2 py-2 text-center font-mono text-sm",
        children: fmt(v)
      },
      `res-${r}-${c}`
    ))
  ) });
  return /* @__PURE__ */ jsxs("div", { class: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u77E9\u9635\u89C4\u6A21" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: `btn btn-xs ${size === 2 ? "btn-primary" : "btn-outline"}`,
            onClick: () => changeSize(2),
            children: "2 \xD7 2"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: `btn btn-xs ${size === 3 ? "btn-primary" : "btn-outline"}`,
            onClick: () => changeSize(3),
            children: "3 \xD7 3"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-ghost",
            onClick: () => {
              setA(emptyCells(size, 1));
              setB(emptyCells(size, 2));
            },
            children: "\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u77E9\u9635"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { class: "mt-4 grid gap-4 sm:grid-cols-2", children: [
        renderInput("a", "\u77E9\u9635 A"),
        renderInput("b", "\u77E9\u9635 B")
      ] }),
      /* @__PURE__ */ jsxs("div", { class: "mt-4 grid gap-3 sm:grid-cols-[auto_1fr]", children: [
        /* @__PURE__ */ jsxs("label", { class: "block max-w-xs", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u6807\u91CF k" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputmode: "decimal",
              autocomplete: "off",
              class: "input input-bordered input-sm mt-1.5 w-full font-mono",
              placeholder: "\u4F8B\u5982 2",
              value: scalar,
              onInput: (e) => setScalar(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u9009\u62E9\u8FD0\u7B97" }),
          /* @__PURE__ */ jsx("div", { class: "mt-1.5 flex flex-wrap gap-2", children: OPS.map((o) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              class: `btn btn-xs ${op === o.id ? "btn-primary" : "btn-outline"}`,
              onClick: () => setOp(o.id),
              children: o.label
            }
          )) })
        ] })
      ] }),
      result && !result.ok && /* @__PURE__ */ jsx("div", { class: "alert alert-error mt-4", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: result.error }) }),
      result && result.ok && /* @__PURE__ */ jsxs("div", { class: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: result.label }),
          result.matrix ? /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
            size,
            " \xD7 ",
            size
          ] }) : /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: "\u6807\u91CF\u7ED3\u679C" })
        ] }),
        result.matrix && renderMatrix(result.matrix),
        result.scalar !== null && /* @__PURE__ */ jsx("p", { class: "font-mono text-2xl font-bold", children: fmt(result.scalar) }),
        /* @__PURE__ */ jsx("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsx("table", { class: "table table-sm", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "A \u7684\u884C\u5217\u5F0F" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: dets.detA === null ? "\u8F93\u5165\u6709\u8BEF" : fmt(dets.detA) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "B \u7684\u884C\u5217\u5F0F" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: dets.detB === null ? "\u8F93\u5165\u6709\u8BEF" : fmt(dets.detB) })
          ] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { class: "text-xs opacity-55 leading-relaxed", children: "\u77E9\u9635\u4E58\u6CD5\u53D6\u5DE6\u77E9\u9635\u884C\u4E0E\u53F3\u77E9\u9635\u5217\u9010\u9879\u76F8\u4E58\u6C42\u548C\uFF0C\u56E0\u6B64\u4E0D\u6EE1\u8DB3\u4EA4\u6362\u5F8B\uFF0C\u5DE5\u5177\u5355\u72EC\u5217\u51FA\u4E86 B \xD7 A\u3002\u6C42\u9006\u5148\u7B97\u884C\u5217\u5F0F\uFF0C\u884C\u5217\u5F0F\u4E3A 0 \u7684\u5947\u5F02\u77E9\u9635\u6CA1\u6709\u9006\u77E9\u9635\uFF0C\u4F1A\u76F4\u63A5\u62A5\u9519\u3002\u6BCF\u4E00\u6B65\u8FD0\u7B97\u540E\u90FD\u505A\u516D\u4F4D\u5C0F\u6570\u5F52\u4E00\u5316\u4EE5\u6D88\u9664\u6D6E\u70B9\u566A\u58F0\uFF0C\u5C55\u793A\u65F6\u6536\u655B\u5230\u56DB\u4F4D\u5C0F\u6570\u5E76\u53BB\u6389\u672B\u5C3E\u591A\u4F59\u7684 0\u3002\u6240\u6709\u8BA1\u7B97\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\u3002" })
  ] });
}

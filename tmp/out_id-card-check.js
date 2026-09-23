"use strict";
import { jsx, jsxs } from "preact/jsx-runtime";
import { useState, useMemo } from "preact/hooks";
const PROVINCES = {
  "11": "\u5317\u4EAC\u5E02",
  "12": "\u5929\u6D25\u5E02",
  "13": "\u6CB3\u5317\u7701",
  "14": "\u5C71\u897F\u7701",
  "15": "\u5185\u8499\u53E4\u81EA\u6CBB\u533A",
  "21": "\u8FBD\u5B81\u7701",
  "22": "\u5409\u6797\u7701",
  "23": "\u9ED1\u9F99\u6C5F\u7701",
  "31": "\u4E0A\u6D77\u5E02",
  "32": "\u6C5F\u82CF\u7701",
  "33": "\u6D59\u6C5F\u7701",
  "34": "\u5B89\u5FBD\u7701",
  "35": "\u798F\u5EFA\u7701",
  "36": "\u6C5F\u897F\u7701",
  "37": "\u5C71\u4E1C\u7701",
  "41": "\u6CB3\u5357\u7701",
  "42": "\u6E56\u5317\u7701",
  "43": "\u6E56\u5357\u7701",
  "44": "\u5E7F\u4E1C\u7701",
  "45": "\u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A",
  "46": "\u6D77\u5357\u7701",
  "50": "\u91CD\u5E86\u5E02",
  "51": "\u56DB\u5DDD\u7701",
  "52": "\u8D35\u5DDE\u7701",
  "53": "\u4E91\u5357\u7701",
  "54": "\u897F\u85CF\u81EA\u6CBB\u533A",
  "61": "\u9655\u897F\u7701",
  "62": "\u7518\u8083\u7701",
  "63": "\u9752\u6D77\u7701",
  "64": "\u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A",
  "65": "\u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A",
  "71": "\u53F0\u6E7E\u7701",
  "81": "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A",
  "82": "\u6FB3\u95E8\u7279\u522B\u884C\u653F\u533A",
  "91": "\u56FD\u5916"
};
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
function calcCheckCode(first17) {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) sum += Number(first17[i]) * WEIGHTS[i];
  return CHECK_CODES[sum % 11];
}
function toDate(text) {
  const y = Number(text.slice(0, 4));
  const m = Number(text.slice(4, 6));
  const d = Number(text.slice(6, 8));
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}
function ageOf(birth) {
  const now = /* @__PURE__ */ new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const before = now.getMonth() < birth.getMonth() || now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate();
  if (before) age -= 1;
  return age < 0 ? 0 : age;
}
function formatBirth(birth) {
  const m = String(birth.getMonth() + 1).padStart(2, "0");
  const d = String(birth.getDate()).padStart(2, "0");
  return `${birth.getFullYear()} \u5E74 ${m} \u6708 ${d} \u65E5`;
}
function parse(raw) {
  const id = raw.trim().toUpperCase();
  if (!id) return null;
  if (id.length !== 18 && id.length !== 15) {
    return {
      ok: false,
      error: `\u4F4D\u6570\u4E0D\u5BF9\uFF1A\u8EAB\u4EFD\u8BC1\u53F7\u5E94\u4E3A 18 \u4F4D\u6216 15 \u4F4D\uFF0C\u5F53\u524D\u662F ${id.length} \u4F4D`
    };
  }
  if (id.length === 18) {
    if (!/^\d{17}[\dX]$/.test(id)) {
      if (!/^[0-9X]+$/.test(id)) {
        return { ok: false, error: "\u542B\u975E\u6CD5\u5B57\u7B26\uFF1A18 \u4F4D\u8EAB\u4EFD\u8BC1\u524D 17 \u4F4D\u53EA\u80FD\u662F\u6570\u5B57\uFF0C\u6700\u540E\u4E00\u4F4D\u53EA\u80FD\u662F\u6570\u5B57\u6216\u5B57\u6BCD X" };
      }
      return { ok: false, error: "\u683C\u5F0F\u6709\u8BEF\uFF1A\u5B57\u6BCD X \u53EA\u80FD\u51FA\u73B0\u5728\u6700\u540E\u4E00\u4F4D\uFF0C\u524D 17 \u4F4D\u5FC5\u987B\u5168\u662F\u6570\u5B57" };
    }
    const birthText2 = id.slice(6, 14);
    const birth2 = toDate(birthText2);
    if (!birth2) {
      return { ok: false, error: `\u51FA\u751F\u65E5\u671F\u4E0D\u5408\u6CD5\uFF1A\u7B2C 7 \u5230 14 \u4F4D\u300C${birthText2}\u300D\u4E0D\u662F\u4E00\u4E2A\u771F\u5B9E\u5B58\u5728\u7684\u65E5\u671F` };
    }
    const now = /* @__PURE__ */ new Date();
    if (birth2.getTime() > now.getTime()) {
      return { ok: false, error: "\u51FA\u751F\u65E5\u671F\u4E0D\u5408\u6CD5\uFF1A\u51FA\u751F\u65E5\u671F\u665A\u4E8E\u4ECA\u5929\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u8F93\u9519" };
    }
    if (birth2.getFullYear() < 1900) {
      return { ok: false, error: "\u51FA\u751F\u65E5\u671F\u4E0D\u5408\u6CD5\uFF1A\u51FA\u751F\u5E74\u4EFD\u65E9\u4E8E 1900 \u5E74\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u8F93\u9519" };
    }
    const expect = calcCheckCode(id.slice(0, 17));
    if (expect !== id[17]) {
      return {
        ok: false,
        error: `\u6821\u9A8C\u4F4D\u9519\u8BEF\uFF1A\u6309 GB 11643-1999 \u8BA1\u7B97\u6700\u540E\u4E00\u4F4D\u5E94\u4E3A\u300C${expect}\u300D\uFF0C\u5B9E\u9645\u662F\u300C${id[17]}\u300D`
      };
    }
    const code22 = id.slice(0, 2);
    const genderDigit2 = Number(id[16]);
    return {
      ok: true,
      kind: "18",
      region: PROVINCES[code22] ?? "\u672A\u77E5\u5730\u533A\uFF08\u5730\u5740\u7801\u524D\u4E24\u4F4D\u672A\u767B\u8BB0\uFF09",
      regionCode: id.slice(0, 6),
      birthday: formatBirth(birth2),
      age: ageOf(birth2),
      gender: genderDigit2 % 2 === 1 ? "\u7537" : "\u5973"
    };
  }
  if (!/^\d{15}$/.test(id)) {
    return { ok: false, error: "\u542B\u975E\u6CD5\u5B57\u7B26\uFF1A15 \u4F4D\u8EAB\u4EFD\u8BC1\u5FC5\u987B\u5168\u90E8\u662F\u6570\u5B57" };
  }
  const birthText = `19${id.slice(6, 12)}`;
  const birth = toDate(birthText);
  if (!birth) {
    return { ok: false, error: `\u51FA\u751F\u65E5\u671F\u4E0D\u5408\u6CD5\uFF1A\u7B2C 7 \u5230 12 \u4F4D\u300C${id.slice(6, 12)}\u300D\u8865\u6210 ${birthText} \u540E\u4E0D\u662F\u4E00\u4E2A\u771F\u5B9E\u5B58\u5728\u7684\u65E5\u671F` };
  }
  const first17 = `${id.slice(0, 6)}19${id.slice(6)}`;
  const code2 = id.slice(0, 2);
  const genderDigit = Number(id[14]);
  return {
    ok: true,
    kind: "15",
    region: PROVINCES[code2] ?? "\u672A\u77E5\u5730\u533A\uFF08\u5730\u5740\u7801\u524D\u4E24\u4F4D\u672A\u767B\u8BB0\uFF09",
    regionCode: id.slice(0, 6),
    birthday: formatBirth(birth),
    age: ageOf(birth),
    gender: genderDigit % 2 === 1 ? "\u7537" : "\u5973",
    upgrade: `${first17}${calcCheckCode(first17)}`
  };
}
export default function IdCardCheck() {
  const [value, setValue] = useState("11010519491231002X");
  const result = useMemo(() => parse(value), [value]);
  return /* @__PURE__ */ jsxs("div", { class: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("label", { class: "block", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u8EAB\u4EFD\u8BC1\u53F7" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            inputmode: "text",
            autocomplete: "off",
            spellcheck: false,
            class: "input input-bordered input-sm mt-1.5 w-full font-mono",
            placeholder: "\u8BF7\u8F93\u5165 18 \u4F4D\u6216 15 \u4F4D\u8EAB\u4EFD\u8BC1\u53F7",
            value,
            onInput: (e) => setValue(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { class: "mt-3 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { class: "text-xs opacity-60", children: "\u793A\u4F8B" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-outline",
            onClick: () => setValue("11010519491231002X"),
            children: "18 \u4F4D\u793A\u4F8B"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-outline",
            onClick: () => setValue("110105491231002"),
            children: "15 \u4F4D\u793A\u4F8B"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", class: "btn btn-xs btn-ghost", onClick: () => setValue(""), children: "\u6E05\u7A7A" })
      ] }),
      !result && /* @__PURE__ */ jsx("p", { class: "mt-3 text-sm opacity-60", children: "\u8BF7\u8F93\u5165\u8EAB\u4EFD\u8BC1\u53F7\uFF0C\u7ED3\u679C\u4F1A\u5B9E\u65F6\u66F4\u65B0" }),
      result && !result.ok && /* @__PURE__ */ jsx("div", { class: "alert alert-error mt-3", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: result.error }) }),
      result && result.ok && /* @__PURE__ */ jsxs("div", { class: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { class: "badge badge-success", children: "\u6821\u9A8C\u901A\u8FC7" }),
          /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
            result.kind,
            " \u4F4D"
          ] }),
          /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: result.region }),
          /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: result.gender }),
          /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
            result.age,
            " \u5468\u5C81"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsx("table", { class: "table table-sm", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u53D1\u8BC1\u5730\u533A\uFF08\u5730\u5740\u7801\uFF09" }),
            /* @__PURE__ */ jsxs("td", { class: "text-right font-mono", children: [
              result.region,
              " ",
              result.regionCode
            ] })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u51FA\u751F\u65E5\u671F" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.birthday })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5F53\u524D\u5468\u5C81" }),
            /* @__PURE__ */ jsxs("td", { class: "text-right font-mono", children: [
              result.age,
              " \u5C81"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u6027\u522B" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.gender })
          ] }),
          result.upgrade && /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5347\u4F4D\u4E3A 18 \u4F4D" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.upgrade })
          ] })
        ] }) }) }),
        result.upgrade && /* @__PURE__ */ jsx("p", { class: "text-xs opacity-70", children: "\u8FD9\u662F 15 \u4F4D\u8001\u8EAB\u4EFD\u8BC1\uFF0C\u672C\u8EAB\u6CA1\u6709\u6821\u9A8C\u4F4D\uFF0C\u53EA\u80FD\u6821\u9A8C\u4F4D\u6570\u4E0E\u51FA\u751F\u65E5\u671F\u3002\u4E0A\u8868\u5DF2\u7ED9\u51FA\u6309\u89C4\u5219\u8865\u51FA\u7684 18 \u4F4D\u53F7\u7801\uFF0C\u4EC5\u4F9B\u53C2\u8003\u3002" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { class: "text-xs opacity-55 leading-relaxed", children: "18 \u4F4D\u6821\u9A8C\u7801\u91C7\u7528 GB 11643-1999\uFF08ISO 7064:1983 MOD 11-2\uFF09\uFF1A\u524D 17 \u4F4D\u6309\u56FA\u5B9A\u6743\u91CD\u52A0\u6743\u6C42\u548C\u540E\u5BF9 11 \u53D6\u4F59\uFF0C\u4F59\u6570 0 \u5230 10 \u4F9D\u6B21\u5BF9\u5E94 1\u30010\u3001X\u30019\u30018\u30017\u30016\u30015\u30014\u30013\u30012\u3002\u6027\u522B\u770B\u987A\u5E8F\u7801\u6700\u540E\u4E00\u4F4D\uFF0C\u5947\u6570\u7537\u5076\u6570\u5973\u3002\u6240\u6709\u8BA1\u7B97\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\uFF0C\u8F93\u5165\u4E0D\u4F1A\u4E0A\u4F20\u3002" })
  ] });
}

"use strict";
import { jsx, jsxs } from "preact/jsx-runtime";
import { useState, useMemo } from "preact/hooks";
const BRANDS = [
  { name: "\u94F6\u8054 UnionPay", lengths: [16, 17, 18, 19] },
  { name: "Visa", lengths: [13, 16, 19] },
  { name: "MasterCard \u4E07\u4E8B\u8FBE", lengths: [16] },
  { name: "JCB", lengths: [16, 17, 18, 19] },
  { name: "American Express \u7F8E\u56FD\u8FD0\u901A", lengths: [15] },
  { name: "Diners Club \u5927\u83B1", lengths: [14, 16] }
];
function detectBrand(digits) {
  if (!digits) return null;
  if (/^62/.test(digits)) return "\u94F6\u8054 UnionPay";
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5])/.test(digits)) return "MasterCard \u4E07\u4E8B\u8FBE";
  const mc2 = Number(digits.slice(0, 4).padEnd(4, "0"));
  if (digits.length >= 4 && mc2 >= 2221 && mc2 <= 2720) return "MasterCard \u4E07\u4E8B\u8FBE";
  if (/^35/.test(digits)) return "JCB";
  if (/^3[47]/.test(digits)) return "American Express \u7F8E\u56FD\u8FD0\u901A";
  if (/^3[068]/.test(digits)) return "Diners Club \u5927\u83B1";
  if (/^30[0-5]/.test(digits)) return "Diners Club \u5927\u83B1";
  return null;
}
function brandLengths(name) {
  if (!name) return null;
  const hit = BRANDS.find((b) => b.name === name);
  return hit ? hit.lengths : null;
}
function luhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}
function group(digits) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}
function parse(raw) {
  const digits = raw.replace(/[\s-]/g, "");
  if (!digits) return null;
  if (digits.length < 12 || digits.length > 19) {
    return {
      ok: false,
      error: `\u957F\u5EA6\u4E0D\u5BF9\uFF1A\u94F6\u884C\u5361\u53F7\u901A\u5E38\u4E3A 12 \u5230 19 \u4F4D\u6570\u5B57\uFF0C\u5F53\u524D\u53BB\u6389\u7A7A\u683C\u4E0E\u6A2A\u7EBF\u540E\u662F ${digits.length} \u4F4D`
    };
  }
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "\u542B\u975E\u6CD5\u5B57\u7B26\uFF1A\u94F6\u884C\u5361\u53F7\u53EA\u80FD\u7531\u6570\u5B57\u7EC4\u6210\uFF0C\u53EF\u5E26\u7A7A\u683C\u6216\u6A2A\u7EBF\u4F5C\u5206\u9694" };
  }
  const brand = detectBrand(digits);
  const lengths = brandLengths(brand);
  const lengthOk = lengths ? lengths.includes(digits.length) : null;
  let lengthHint = "\u672A\u5339\u914D\u5230\u5DF2\u77E5\u5361\u7EC4\u7EC7\u53F7\u6BB5\uFF0C\u65E0\u6CD5\u6838\u5BF9\u957F\u5EA6\u89C4\u8303";
  if (lengths) {
    lengthHint = lengthOk ? `\u7B26\u5408 ${brand} \u7684\u89C4\u8303\u957F\u5EA6\uFF08${lengths.join(" / ")} \u4F4D\uFF09` : `\u4E0D\u7B26\u5408 ${brand} \u7684\u89C4\u8303\u957F\u5EA6\uFF0C\u8BE5\u7EC4\u7EC7\u5E38\u89C1\u4E3A ${lengths.join(" / ")} \u4F4D\uFF0C\u5F53\u524D ${digits.length} \u4F4D`;
  }
  return {
    ok: true,
    digits,
    formatted: group(digits),
    brand,
    lengthOk,
    lengthHint,
    luhnOk: luhn(digits)
  };
}
export default function BankCardValidator() {
  const [value, setValue] = useState("6222 0212 3456 7890 011");
  const result = useMemo(() => parse(value), [value]);
  return /* @__PURE__ */ jsxs("div", { class: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("label", { class: "block", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u94F6\u884C\u5361\u53F7" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            inputmode: "numeric",
            autocomplete: "off",
            spellcheck: false,
            class: "input input-bordered input-sm mt-1.5 w-full font-mono",
            placeholder: "\u8BF7\u8F93\u5165\u94F6\u884C\u5361\u53F7\uFF0C\u53EF\u5E26\u7A7A\u683C\u6216\u6A2A\u7EBF",
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
            onClick: () => setValue("6222 0212 3456 7890 011"),
            children: "\u94F6\u8054 19 \u4F4D"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-outline",
            onClick: () => setValue("4111 1111 1111 1111"),
            children: "Visa 16 \u4F4D"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-outline",
            onClick: () => setValue("3782 822463 10005"),
            children: "\u8FD0\u901A 15 \u4F4D"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", class: "btn btn-xs btn-ghost", onClick: () => setValue(""), children: "\u6E05\u7A7A" })
      ] }),
      !result && /* @__PURE__ */ jsx("p", { class: "mt-3 text-sm opacity-60", children: "\u8BF7\u8F93\u5165\u94F6\u884C\u5361\u53F7\uFF0C\u7ED3\u679C\u4F1A\u5B9E\u65F6\u66F4\u65B0" }),
      result && !result.ok && /* @__PURE__ */ jsx("div", { class: "alert alert-error mt-3", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: result.error }) }),
      result && result.ok && /* @__PURE__ */ jsxs("div", { class: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { class: `badge ${result.luhnOk ? "badge-success" : "badge-error"}`, children: [
            "Luhn ",
            result.luhnOk ? "\u901A\u8FC7" : "\u672A\u901A\u8FC7"
          ] }),
          /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: result.brand ?? "\u672A\u77E5\u5361\u7EC4\u7EC7" }),
          /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
            result.digits.length,
            " \u4F4D"
          ] }),
          result.lengthOk !== null && /* @__PURE__ */ jsxs("span", { class: `badge ${result.lengthOk ? "badge-outline" : "badge-warning"}`, children: [
            "\u957F\u5EA6",
            result.lengthOk ? "\u7B26\u5408\u89C4\u8303" : "\u5F02\u5E38"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsx("table", { class: "table table-sm", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u53BB\u683C\u5F0F\u5316\u5361\u53F7" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.digits })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5206\u7EC4\u663E\u793A" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.formatted })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5361\u7EC4\u7EC7" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.brand ?? "\u672A\u8BC6\u522B\uFF08\u53F7\u6BB5\u4E0D\u5728\u5DF2\u77E5\u8303\u56F4\uFF09" })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u957F\u5EA6\u89C4\u8303" }),
            /* @__PURE__ */ jsx("td", { class: "text-right", children: result.lengthHint })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "Luhn \u6821\u9A8C" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.luhnOk ? "\u6C42\u548C\u80FD\u88AB 10 \u6574\u9664\uFF0C\u7F16\u53F7\u89C4\u5219\u81EA\u6D3D" : "\u6C42\u548C\u4E0D\u80FD\u88AB 10 \u6574\u9664\uFF0C\u53EF\u80FD\u8F93\u9519\u4E86\u4E00\u4F4D" })
          ] })
        ] }) }) }),
        !result.luhnOk && /* @__PURE__ */ jsx("div", { class: "alert alert-warning", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: "Luhn \u6821\u9A8C\u672A\u901A\u8FC7\uFF0C\u6700\u5E38\u89C1\u7684\u539F\u56E0\u662F\u67D0\u4E00\u4F4D\u6570\u5B57\u8F93\u9519\u6216\u76F8\u90BB\u4E24\u4F4D\u987A\u5E8F\u98A0\u5012\uFF0C\u8BF7\u5BF9\u7167\u5B9E\u4F53\u5361\u518D\u6838\u4E00\u904D\u3002" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { class: "text-xs opacity-55 leading-relaxed", children: "Luhn \u7B97\u6CD5\u4ECE\u6821\u9A8C\u4F4D\u5F00\u59CB\u5012\u5E8F\u5904\u7406\uFF1A\u5947\u6570\u4F4D\u53D6\u539F\u503C\u3001\u5076\u6570\u4F4D\u4E58 2\uFF08\u5927\u4E8E 9 \u5219\u51CF 9\uFF09\uFF0C\u5168\u90E8\u6C42\u548C\u540E\u80FD\u88AB 10 \u6574\u9664\u5373\u4E3A\u901A\u8FC7\u3002\u5361\u7EC4\u7EC7\u6309\u5F00\u5934\u53F7\u6BB5\u5224\u65AD\uFF1A62 \u94F6\u8054\u30014 \u5F00\u5934 Visa\u300151 \u5230 55 \u6216 2221 \u5230 2720 \u4E07\u4E8B\u8FBE\u300135 JCB\u300134 \u4E0E 37 \u7F8E\u56FD\u8FD0\u901A\u300130 \u4E0E 36 \u4E0E 38 \u5927\u83B1\u3002\u8F93\u5165\u4F1A\u81EA\u52A8\u53BB\u6389\u7A7A\u683C\u4E0E\u6A2A\u7EBF\uFF0C\u6240\u6709\u8BA1\u7B97\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\u3002" })
  ] });
}

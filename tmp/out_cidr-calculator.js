"use strict";
import { jsx, jsxs } from "preact/jsx-runtime";
import { useState, useMemo } from "preact/hooks";
function ipToInt(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (!Number.isFinite(n) || n < 0 || n > 255) return null;
    value = value << 8 | n;
  }
  return value >>> 0;
}
function intToIp(n) {
  const v = n >>> 0;
  return `${v >>> 24 & 255}.${v >>> 16 & 255}.${v >>> 8 & 255}.${v & 255}`;
}
function maskOf(prefix) {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 4294967295;
  return 4294967295 << 32 - prefix >>> 0;
}
function prefixOfMask(mask) {
  const m = mask >>> 0;
  const inv = ~m >>> 0;
  if ((inv + 1 & inv) !== 0) return null;
  let bits = 0;
  let rest = inv;
  while (rest > 0) {
    bits += rest & 1;
    rest = rest >>> 1;
  }
  return 32 - bits;
}
function binaryOf(mask) {
  const m = mask >>> 0;
  return [m >>> 24 & 255, m >>> 16 & 255, m >>> 8 & 255, m & 255].map((n) => n.toString(2).padStart(8, "0")).join(".");
}
function parse(raw, maskRaw) {
  const text = raw.trim();
  const maskText = maskRaw.trim();
  if (!text && !maskText) return null;
  if (!text) return { ok: false, error: "\u8BF7\u586B\u5199 IP \u5730\u5740\u6216 CIDR \u7F51\u6BB5\uFF0C\u4F8B\u5982 192.168.1.0/24" };
  let prefix = null;
  let ipText = text;
  const slash = text.indexOf("/");
  if (slash >= 0) {
    ipText = text.slice(0, slash);
    const p = text.slice(slash + 1).trim();
    if (!/^\d{1,2}$/.test(p)) {
      return { ok: false, error: "\u524D\u7F00\u957F\u5EA6\u4E0D\u5408\u6CD5\uFF1A\u659C\u6760\u540E\u9762\u5FC5\u987B\u662F 0 \u5230 32 \u4E4B\u95F4\u7684\u6574\u6570" };
    }
    prefix = Number(p);
    if (prefix < 0 || prefix > 32) {
      return { ok: false, error: "\u524D\u7F00\u957F\u5EA6\u8D8A\u754C\uFF1ACIDR \u524D\u7F00\u53EA\u80FD\u662F 0 \u5230 32 \u4E4B\u95F4\u7684\u6574\u6570" };
    }
  }
  const ip = ipToInt(ipText.trim());
  if (ip === null) {
    return { ok: false, error: "IP \u5730\u5740\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u56DB\u6BB5\u70B9\u5206\u5341\u8FDB\u5236\uFF0C\u6BCF\u6BB5 0 \u5230 255\uFF0C\u4F8B\u5982 192.168.1.0" };
  }
  if (maskText) {
    if (prefix !== null) {
      return { ok: false, error: "\u8BF7\u52FF\u540C\u65F6\u586B\u5199\u659C\u6760\u524D\u7F00\u548C\u5B50\u7F51\u63A9\u7801\uFF0C\u4E8C\u9009\u4E00\u5373\u53EF" };
    }
    const mask = ipToInt(maskText);
    if (mask === null) {
      return { ok: false, error: "\u5B50\u7F51\u63A9\u7801\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u56DB\u6BB5\u70B9\u5206\u5341\u8FDB\u5236\uFF0C\u6BCF\u6BB5 0 \u5230 255\uFF0C\u4F8B\u5982 255.255.255.0" };
    }
    const p = prefixOfMask(mask);
    if (p === null) {
      return { ok: false, error: "\u5B50\u7F51\u63A9\u7801\u4E0D\u5408\u6CD5\uFF1A\u63A9\u7801\u4E2D\u8FDE\u7EED\u7684 1 \u5FC5\u987B\u6392\u5728\u524D\u30010 \u6392\u5728\u540E\uFF0C\u4F8B\u5982 255.255.255.0 \u5408\u6CD5\u800C 255.0.255.0 \u4E0D\u5408\u6CD5" };
    }
    prefix = p;
  }
  if (prefix === null) {
    return { ok: false, error: "\u7F3A\u5C11\u524D\u7F00\u957F\u5EA6\uFF1A\u8BF7\u5199\u6210 192.168.1.0/24\uFF0C\u6216\u5728\u4E0B\u65B9\u586B\u5199\u5B50\u7F51\u63A9\u7801\u5982 255.255.255.0" };
  }
  const m = maskOf(prefix);
  const network = (ip & m) >>> 0;
  const broadcast = (network | ~m >>> 0) >>> 0;
  const total = prefix >= 32 ? 1 : 2 ** (32 - prefix);
  const usable = prefix >= 31 ? total : total - 2;
  let firstUsable = intToIp(network + 1 >>> 0);
  let lastUsable = intToIp(broadcast - 1 >>> 0);
  let rangeText = `${firstUsable} - ${lastUsable}`;
  let note = "\u6807\u51C6\u5B50\u7F51\uFF1A\u7F51\u7EDC\u5730\u5740\u4E0E\u5E7F\u64AD\u5730\u5740\u4E0D\u53EF\u5206\u914D\u7ED9\u4E3B\u673A\uFF0C\u56E0\u6B64\u53EF\u7528\u4E3B\u673A\u6570\u4E3A\u603B\u5730\u5740\u6570\u51CF 2\u3002";
  if (prefix === 32) {
    firstUsable = intToIp(network);
    lastUsable = intToIp(network);
    rangeText = intToIp(network);
    note = "/32 \u662F\u5355\u4E3B\u673A\u8DEF\u7531\uFF1A\u7F51\u6BB5\u5185\u53EA\u6709\u4E00\u4E2A\u5730\u5740\uFF0C\u6CA1\u6709\u5E7F\u64AD\u5730\u5740\uFF0C\u5E38\u7528\u4E8E\u56DE\u73AF\u5730\u5740\u3001\u4E3B\u673A\u8DEF\u7531\u6216\u5B89\u5168\u7EC4\u7CBE\u786E\u5339\u914D\u3002";
  } else if (prefix === 31) {
    firstUsable = intToIp(network);
    lastUsable = intToIp(broadcast);
    rangeText = `${firstUsable} - ${lastUsable}`;
    note = "/31 \u6309 RFC 3021 \u7528\u4E8E\u70B9\u5BF9\u70B9\u94FE\u8DEF\uFF1A\u4E24\u4E2A\u5730\u5740\u90FD\u5206\u914D\u7ED9\u94FE\u8DEF\u4E24\u7AEF\uFF0C\u53EF\u7528\u4E3B\u673A\u6570\u4E3A 2\uFF0C\u4E0D\u518D\u4FDD\u7559\u7F51\u7EDC\u5730\u5740\u4E0E\u5E7F\u64AD\u5730\u5740\u3002";
  } else if (prefix === 0) {
    note = "/0 \u8986\u76D6\u6574\u4E2A IPv4 \u5730\u5740\u7A7A\u95F4\uFF0C\u53EF\u7528\u4E3B\u673A\u6570\u4E3A 2 \u7684 32 \u6B21\u65B9\u51CF 2\uFF0C\u5B9E\u9645\u7F51\u7EDC\u4E2D\u4E00\u822C\u53EA\u51FA\u73B0\u5728\u9ED8\u8BA4\u8DEF\u7531\u91CC\u3002";
  }
  return {
    ok: true,
    prefix,
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    mask: intToIp(m),
    wildcard: intToIp(~m >>> 0),
    maskBinary: binaryOf(m),
    cidr: `${intToIp(network)}/${prefix}`,
    total,
    usable,
    firstUsable,
    lastUsable,
    rangeText,
    note
  };
}
function count(n) {
  return n.toLocaleString("en-US");
}
export default function CidrCalculator() {
  const [value, setValue] = useState("192.168.1.0/24");
  const [mask, setMask] = useState("");
  const result = useMemo(() => parse(value, mask), [value, mask]);
  return /* @__PURE__ */ jsxs("div", { class: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("div", { class: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "IP \u5730\u5740 / CIDR \u7F51\u6BB5" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputmode: "text",
              autocomplete: "off",
              spellcheck: false,
              class: "input input-bordered input-sm mt-1.5 w-full font-mono",
              placeholder: "\u4F8B\u5982 192.168.1.0/24 \u6216 10.0.0.1",
              value,
              onInput: (e) => setValue(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u5B50\u7F51\u63A9\u7801\uFF08\u9009\u586B\uFF0C\u7528\u4E8E\u53CD\u7B97 CIDR\uFF09" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputmode: "text",
              autocomplete: "off",
              spellcheck: false,
              class: "input input-bordered input-sm mt-1.5 w-full font-mono",
              placeholder: "\u4F8B\u5982 255.255.255.0",
              value: mask,
              onInput: (e) => setMask(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { class: "mt-3 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { class: "text-xs opacity-60", children: "\u5FEB\u6377\u793A\u4F8B" }),
        ["192.168.1.0/24", "10.0.0.0/8", "172.16.0.0/12", "192.168.1.1/32"].map((v) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: `btn btn-xs ${value === v && !mask ? "btn-primary" : "btn-outline"}`,
            onClick: () => {
              setValue(v);
              setMask("");
            },
            children: v
          }
        )),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: "btn btn-xs btn-outline",
            onClick: () => {
              setValue("192.168.1.0");
              setMask("255.255.255.0");
            },
            children: "IP + \u63A9\u7801"
          }
        )
      ] }),
      !result && /* @__PURE__ */ jsx("p", { class: "mt-3 text-sm opacity-60", children: "\u8BF7\u8F93\u5165\u7F51\u6BB5\uFF0C\u7ED3\u679C\u4F1A\u5B9E\u65F6\u66F4\u65B0" }),
      result && !result.ok && /* @__PURE__ */ jsx("div", { class: "alert alert-error mt-3", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: result.error }) }),
      result && result.ok && /* @__PURE__ */ jsxs("div", { class: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { class: "badge badge-primary", children: [
            "/",
            result.prefix
          ] }),
          /* @__PURE__ */ jsx("span", { class: "badge badge-outline", children: result.cidr }),
          /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
            "\u53EF\u7528\u4E3B\u673A ",
            count(result.usable)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsx("table", { class: "table table-sm", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u7F51\u7EDC\u5730\u5740" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.network })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5E7F\u64AD\u5730\u5740" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.broadcast })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u5B50\u7F51\u63A9\u7801" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.mask })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u901A\u914D\u7B26\u63A9\u7801" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.wildcard })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u4E8C\u8FDB\u5236\u63A9\u7801" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.maskBinary })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u53EF\u7528\u4E3B\u673A\u8303\u56F4" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.rangeText })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u53EF\u7528\u4E3B\u673A\u6570" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: count(result.usable) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "\u603B\u5730\u5740\u6570" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: count(result.total) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { class: "opacity-60", children: "CIDR \u8868\u793A" }),
            /* @__PURE__ */ jsx("td", { class: "text-right font-mono", children: result.cidr })
          ] })
        ] }) }) }),
        result.prefix >= 31 || result.prefix === 0 ? /* @__PURE__ */ jsx("div", { class: "alert alert-warning", children: /* @__PURE__ */ jsx("span", { class: "text-sm", children: result.note }) }) : /* @__PURE__ */ jsx("p", { class: "text-xs opacity-70", children: result.note })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { class: "text-xs opacity-55 leading-relaxed", children: "\u7F51\u7EDC\u5730\u5740 = IP \u4E0E\u5B50\u7F51\u63A9\u7801\u6309\u4F4D\u4E0E\uFF0C\u5E7F\u64AD\u5730\u5740 = \u7F51\u7EDC\u5730\u5740\u6216\u4E0A\u901A\u914D\u7B26\u63A9\u7801\u3002IPv4 \u5730\u5740\u5728 JavaScript \u4E2D\u6309\u65E0\u7B26\u53F7 32 \u4F4D\u5904\u7406\uFF08\u4F4D\u8FD0\u7B97\u540E\u7EDF\u4E00\u53D6\u65E0\u7B26\u53F7\u53F3\u79FB 0\uFF09\uFF0C\u907F\u514D\u51FA\u73B0\u8D1F\u6570\u7ED3\u679C\u3002\u53EF\u7528\u4E3B\u673A\u6570\u5728 /0 \u5230 /30 \u4E4B\u95F4\u4E3A\u603B\u5730\u5740\u6570\u51CF 2\uFF0C/31 \u6309 RFC 3021 \u4E3A 2\uFF0C/32 \u4E3A 1\u3002\u6240\u6709\u8BA1\u7B97\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\u3002" })
  ] });
}

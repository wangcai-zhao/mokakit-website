"use strict";
import { jsx, jsxs } from "preact/jsx-runtime";
import { useState, useMemo, useRef } from "preact/hooks";
import { copyText } from "@/tools/_shared/copy";
const TWITTER_CARDS = ["summary", "summary_large_image", "app", "player"];
function esc(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function buildCode(f) {
  const title = f.title.trim();
  const desc = f.desc.trim();
  const keywords = f.keywords.trim();
  const canonical = f.canonical.trim();
  const ogTitle = f.ogTitle.trim() || title;
  const ogDesc = f.ogDesc.trim() || desc;
  const ogImage = f.ogImage.trim();
  const ogUrl = canonical;
  const lines = [];
  lines.push(`<title>${esc(title)}</title>`);
  if (desc) lines.push(`<meta name="description" content="${esc(desc)}" />`);
  if (keywords) lines.push(`<meta name="keywords" content="${esc(keywords)}" />`);
  if (canonical) lines.push(`<link rel="canonical" href="${esc(canonical)}" />`);
  lines.push(`<meta property="og:type" content="${f.pageType === "article" ? "article" : "website"}" />`);
  if (ogTitle) lines.push(`<meta property="og:title" content="${esc(ogTitle)}" />`);
  if (ogDesc) lines.push(`<meta property="og:description" content="${esc(ogDesc)}" />`);
  if (ogImage) lines.push(`<meta property="og:image" content="${esc(ogImage)}" />`);
  if (ogUrl) lines.push(`<meta property="og:url" content="${esc(ogUrl)}" />`);
  lines.push(`<meta name="twitter:card" content="${esc(f.twitter)}" />`);
  if (ogTitle) lines.push(`<meta name="twitter:title" content="${esc(ogTitle)}" />`);
  if (ogDesc) lines.push(`<meta name="twitter:description" content="${esc(ogDesc)}" />`);
  if (ogImage) lines.push(`<meta name="twitter:image" content="${esc(ogImage)}" />`);
  const jsonLd = f.pageType === "article" ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    keywords,
    image: ogImage,
    url: canonical
  } : {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: title,
    description: desc,
    url: canonical
  };
  const cleaned = {};
  for (const [k, v] of Object.entries(jsonLd)) {
    if (typeof v === "string" && v !== "") cleaned[k] = v;
    if (typeof v !== "string") cleaned[k] = v;
  }
  lines.push(`<script type="application/ld+json">`);
  lines.push(JSON.stringify(cleaned, null, 2));
  lines.push(`<\/script>`);
  return lines.join("\n");
}
export default function MetaTagsGenerator() {
  const [title, setTitle] = useState("MokaKit \u6469\u5361\u5DE5\u5177\u7BB1 \xB7 \u5728\u7EBF\u5C0F\u5DE5\u5177\u96C6\u5408");
  const [desc, setDesc] = useState(
    "MokaKit \u6469\u5361\u5DE5\u5177\u7BB1\u63D0\u4F9B\u8EAB\u4EFD\u8BC1\u6821\u9A8C\u3001\u94F6\u884C\u5361\u6821\u9A8C\u3001CIDR \u8BA1\u7B97\u3001\u77E9\u9635\u8BA1\u7B97\u7B49\u4E0A\u767E\u4E2A\u5728\u7EBF\u5C0F\u5DE5\u5177\uFF0C\u5168\u90E8\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\u8BA1\u7B97\uFF0C\u4E0D\u4E0A\u4F20\u6570\u636E\uFF0C\u6253\u5F00\u5373\u7528\u3002"
  );
  const [keywords, setKeywords] = useState("\u5728\u7EBF\u5DE5\u5177,\u6469\u5361\u5DE5\u5177\u7BB1,MokaKit,\u5B9E\u7528\u5DE5\u5177");
  const [canonical, setCanonical] = useState("https://mokakit.com/");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [ogImage, setOgImage] = useState("https://mokakit.com/og.png");
  const [twitter, setTwitter] = useState("summary_large_image");
  const [pageType, setPageType] = useState("website");
  const [copied, setCopied] = useState(false);
  const timer = useRef(void 0);
  const code = useMemo(
    () => buildCode({
      title,
      desc,
      keywords,
      canonical,
      ogTitle,
      ogDesc,
      ogImage,
      twitter,
      pageType
    }),
    [title, desc, keywords, canonical, ogTitle, ogDesc, ogImage, twitter, pageType]
  );
  const checks = useMemo(() => {
    const t = title.trim();
    const d = desc.trim();
    const c = canonical.trim();
    const img = ogImage.trim();
    const out = [];
    if (!t) {
      out.push({ name: "\u9875\u9762\u6807\u9898", ok: false, hint: "\u6807\u9898\u4E3A\u7A7A\uFF0C\u641C\u7D22\u5F15\u64CE\u7ED3\u679C\u91CC\u5C06\u6CA1\u6709\u53EF\u70B9\u51FB\u7684\u4E3B\u6807\u9898" });
    } else if (t.length > 60) {
      out.push({ name: "\u9875\u9762\u6807\u9898", ok: false, hint: `\u6807\u9898 ${t.length} \u4E2A\u5B57\u7B26\uFF0C\u8D85\u8FC7 60 \u5B57\u7B26\u4F1A\u5728\u641C\u7D22\u7ED3\u679C\u4E2D\u88AB\u622A\u65AD` });
    } else {
      out.push({ name: "\u9875\u9762\u6807\u9898", ok: true, hint: `\u6807\u9898 ${t.length} \u4E2A\u5B57\u7B26\uFF0C\u957F\u5EA6\u5408\u9002` });
    }
    if (!d) {
      out.push({ name: "\u9875\u9762\u63CF\u8FF0", ok: false, hint: "\u63CF\u8FF0\u4E3A\u7A7A\uFF0C\u5EFA\u8BAE\u8865\u4E00\u6BB5 80 \u5230 160 \u5B57\u7B26\u7684\u6458\u8981" });
    } else if (d.length < 80) {
      out.push({ name: "\u9875\u9762\u63CF\u8FF0", ok: false, hint: `\u63CF\u8FF0\u4EC5 ${d.length} \u4E2A\u5B57\u7B26\uFF0C\u504F\u77ED\uFF0C\u5EFA\u8BAE\u8865\u5230 80 \u5230 160 \u5B57\u7B26` });
    } else if (d.length > 160) {
      out.push({ name: "\u9875\u9762\u63CF\u8FF0", ok: false, hint: `\u63CF\u8FF0 ${d.length} \u4E2A\u5B57\u7B26\uFF0C\u8D85\u8FC7 160 \u5B57\u7B26\u4F1A\u88AB\u622A\u65AD` });
    } else {
      out.push({ name: "\u9875\u9762\u63CF\u8FF0", ok: true, hint: `\u63CF\u8FF0 ${d.length} \u4E2A\u5B57\u7B26\uFF0C\u843D\u5728 80 \u5230 160 \u7684\u6700\u4F73\u533A\u95F4` });
    }
    if (!c) {
      out.push({ name: "canonical", ok: false, hint: "\u7F3A\u5931 canonical\uFF0C\u91CD\u590D\u5185\u5BB9\u53EF\u80FD\u5206\u6563\u6743\u91CD" });
    } else if (!/^https?:\/\//i.test(c)) {
      out.push({ name: "canonical", ok: false, hint: "canonical \u5E94\u4F7F\u7528\u5E26 https \u5F00\u5934\u7684\u5B8C\u6574\u7EDD\u5BF9\u5730\u5740" });
    } else {
      out.push({ name: "canonical", ok: true, hint: "\u5DF2\u8BBE\u7F6E\u89C4\u8303\u94FE\u63A5" });
    }
    if (!img) {
      out.push({ name: "OG \u56FE\u7247", ok: false, hint: "\u7F3A\u5931 OG \u56FE\uFF0C\u5206\u4EAB\u5230\u793E\u4EA4\u5E73\u53F0\u65F6\u4E0D\u4F1A\u663E\u793A\u7F29\u7565\u56FE" });
    } else if (!/^https?:\/\//i.test(img)) {
      out.push({ name: "OG \u56FE\u7247", ok: false, hint: "OG \u56FE\u5E94\u4F7F\u7528\u5E26 https \u5F00\u5934\u7684\u5B8C\u6574\u7EDD\u5BF9\u5730\u5740\uFF0C\u76F8\u5BF9\u8DEF\u5F84\u6293\u53D6\u4F1A\u5931\u8D25" });
    } else {
      out.push({ name: "OG \u56FE\u7247", ok: true, hint: "\u5DF2\u8BBE\u7F6E\u5206\u4EAB\u7F29\u7565\u56FE" });
    }
    if (!keywords.trim()) {
      out.push({ name: "\u5173\u952E\u8BCD", ok: false, hint: "\u672A\u586B\u5173\u952E\u8BCD\uFF0C\u53EF\u8865\u5145 3 \u5230 5 \u4E2A\u4E2D\u6587\u5173\u952E\u8BCD" });
    } else {
      out.push({ name: "\u5173\u952E\u8BCD", ok: true, hint: `\u5DF2\u586B ${keywords.split(",").filter((x) => x.trim()).length} \u4E2A\u5173\u952E\u8BCD` });
    }
    return out;
  }, [title, desc, canonical, ogImage, keywords]);
  const copy = async () => {
    await copyText(code);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };
  const warnCount = checks.filter((c) => !c.ok).length;
  return /* @__PURE__ */ jsxs("div", { class: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("div", { class: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u9875\u9762\u6807\u9898 title" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              autocomplete: "off",
              class: "input input-bordered input-sm mt-1.5 w-full",
              placeholder: "\u5EFA\u8BAE 60 \u5B57\u7B26\u4EE5\u5185",
              value: title,
              onInput: (e) => setTitle(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u89C4\u8303\u94FE\u63A5 canonical" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputmode: "url",
              autocomplete: "off",
              spellcheck: false,
              class: "input input-bordered input-sm mt-1.5 w-full font-mono",
              placeholder: "https://example.com/page",
              value: canonical,
              onInput: (e) => setCanonical(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { class: "mt-3 block", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u9875\u9762\u63CF\u8FF0 description" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            class: "textarea textarea-bordered mt-1.5 w-full text-sm",
            rows: 2,
            placeholder: "\u5EFA\u8BAE 80 \u5230 160 \u4E2A\u5B57\u7B26",
            value: desc,
            onInput: (e) => setDesc(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { class: "mt-3 grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u5173\u952E\u8BCD keywords\uFF08\u9017\u53F7\u5206\u9694\uFF09" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              autocomplete: "off",
              class: "input input-bordered input-sm mt-1.5 w-full",
              placeholder: "\u5DE5\u5177,\u5728\u7EBF\u5DE5\u5177,\u5B9E\u7528\u5DE5\u5177",
              value: keywords,
              onInput: (e) => setKeywords(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "OG \u56FE\u7247 URL" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputmode: "url",
              autocomplete: "off",
              spellcheck: false,
              class: "input input-bordered input-sm mt-1.5 w-full font-mono",
              placeholder: "https://example.com/og.png",
              value: ogImage,
              onInput: (e) => setOgImage(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "OG \u6807\u9898\uFF08\u7559\u7A7A\u5219\u7528\u9875\u9762\u6807\u9898\uFF09" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              autocomplete: "off",
              class: "input input-bordered input-sm mt-1.5 w-full",
              placeholder: "\u5206\u4EAB\u65F6\u663E\u793A\u7684\u6807\u9898",
              value: ogTitle,
              onInput: (e) => setOgTitle(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "OG \u63CF\u8FF0\uFF08\u7559\u7A7A\u5219\u7528\u9875\u9762\u63CF\u8FF0\uFF09" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              autocomplete: "off",
              class: "input input-bordered input-sm mt-1.5 w-full",
              placeholder: "\u5206\u4EAB\u65F6\u663E\u793A\u7684\u6458\u8981",
              value: ogDesc,
              onInput: (e) => setOgDesc(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "twitter card \u7C7B\u578B" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              class: "select select-bordered select-sm mt-1.5 w-full",
              value: twitter,
              onChange: (e) => setTwitter(e.target.value),
              children: TWITTER_CARDS.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { class: "block", children: [
          /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "JSON-LD \u7ED3\u6784\u5316\u6570\u636E\u7C7B\u578B" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              class: "select select-bordered select-sm mt-1.5 w-full",
              value: pageType,
              onChange: (e) => setPageType(e.target.value),
              children: [
                /* @__PURE__ */ jsx("option", { value: "website", children: "WebSite\uFF08\u7AD9\u70B9\u9996\u9875\uFF09" }),
                /* @__PURE__ */ jsx("option", { value: "article", children: "Article\uFF08\u6587\u7AE0\u9875\uFF09" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "SEO \u4F53\u68C0" }),
        warnCount === 0 ? /* @__PURE__ */ jsx("span", { class: "badge badge-success", children: "\u5168\u90E8\u901A\u8FC7" }) : /* @__PURE__ */ jsxs("span", { class: "badge badge-warning", children: [
          warnCount,
          " \u9879\u5F85\u4F18\u5316"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { class: "mt-3 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { class: "table table-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "\u68C0\u67E5\u9879" }),
          /* @__PURE__ */ jsx("th", { children: "\u72B6\u6001" }),
          /* @__PURE__ */ jsx("th", { class: "text-right", children: "\u8BF4\u660E" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: checks.map((c) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { class: "font-medium", children: c.name }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { class: `badge badge-sm ${c.ok ? "badge-success" : "badge-warning"}`, children: c.ok ? "\u901A\u8FC7" : "\u8B66\u544A" }) }),
          /* @__PURE__ */ jsx("td", { class: "text-right", children: c.hint })
        ] })) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { class: "rounded-xl bg-base-200 p-3 sm:p-4", children: [
      /* @__PURE__ */ jsxs("div", { class: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { class: "text-sm font-medium", children: "\u751F\u6210\u7684 HTML \u4EE3\u7801\u7247\u6BB5" }),
        /* @__PURE__ */ jsxs("span", { class: "badge badge-outline", children: [
          code.split("\n").length,
          " \u884C"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: `btn btn-xs ml-auto ${copied ? "btn-success" : "btn-primary"}`,
            onClick: copy,
            children: copied ? "\u5DF2\u590D\u5236" : "\u590D\u5236\u4EE3\u7801"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          class: "textarea textarea-bordered mt-3 w-full font-mono text-xs",
          rows: 14,
          readonly: true,
          value: code
        }
      ),
      /* @__PURE__ */ jsx("p", { class: "mt-2 text-xs opacity-70", children: "\u628A\u8FD9\u6BB5\u4EE3\u7801\u653E\u8FDB\u9875\u9762\u7684 head \u533A\u57DF\u5373\u53EF\u751F\u6548\uFF0COG \u6807\u9898\u4E0E\u63CF\u8FF0\u7559\u7A7A\u65F6\u4F1A\u81EA\u52A8\u56DE\u9000\u4F7F\u7528\u9875\u9762\u6807\u9898\u4E0E\u63CF\u8FF0\u3002" })
    ] }),
    /* @__PURE__ */ jsx("p", { class: "text-xs opacity-55 leading-relaxed", children: "\u6240\u6709\u6807\u7B7E\u7684 content \u5C5E\u6027\u90FD\u4F1A\u505A HTML \u5B9E\u4F53\u8F6C\u4E49\uFF0C\u907F\u514D\u5F15\u53F7\u63D0\u524D\u95ED\u5408\u5BFC\u81F4\u6807\u7B7E\u7834\u635F\uFF1BJSON-LD \u7528\u6807\u51C6 JSON \u5E8F\u5217\u5316\u751F\u6210\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u8BED\u6CD5\u9519\u8BEF\u3002\u6574\u4E2A\u751F\u6210\u8FC7\u7A0B\u5728\u6D4F\u89C8\u5668\u672C\u5730\u5B8C\u6210\uFF0C\u586B\u5199\u7684\u5185\u5BB9\u4E0D\u4F1A\u4E0A\u4F20\u5230\u4EFB\u4F55\u670D\u52A1\u5668\u3002" })
  ] });
}

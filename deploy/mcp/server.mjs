// mcp/server.mjs
import http from "node:http";
import crypto2 from "node:crypto";
import { existsSync, readFileSync as readFileSync2 } from "node:fs";

// mcp/meta-loader.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
var TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "tools");
function evalMeta(src) {
  const stripped = src.replace(/^\s*import\s.*$/gm, "").replace(/export\s+default\s+defineTool\s*\(/, "const __m = (").replace(/\);\s*$/, ");");
  const fn = new Function(stripped + "\nreturn __m;");
  return fn();
}
function extractString(src, key) {
  const m = src.match(new RegExp(`\\b${key}\\s*:\\s*'([^']*)'`, "s"));
  return m ? m[1] : void 0;
}
function extractArray(src, key) {
  const m = src.match(new RegExp(`\\b${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "s"));
  if (!m) return [];
  const items = m[1].match(/'([^']*)'|"([^"]*)"/g) || [];
  return items.map((x) => x.replace(/^['"]|['"]$/g, ""));
}
function loadAllMeta() {
  const dirs = readdirSync(TOOLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "_shared").map((d) => d.name);
  const tools = [];
  const errors = [];
  for (const id of dirs) {
    const file = join(TOOLS_DIR, id, "meta.ts");
    let raw;
    try {
      raw = readFileSync(file, "utf8");
    } catch (e) {
      errors.push({ id, error: `read failed: ${String(e)}` });
      continue;
    }
    let meta;
    try {
      meta = evalMeta(raw);
    } catch {
      meta = {
        id,
        name: extractString(raw, "name"),
        description: extractString(raw, "description"),
        keywords: extractArray(raw, "keywords"),
        tags: extractArray(raw, "tags"),
        category: extractString(raw, "category"),
        icon: extractString(raw, "icon"),
        tagline: extractString(raw, "tagline")
      };
    }
    meta = meta || {};
    tools.push({
      id,
      name: meta.name || id,
      description: meta.description || "",
      keywords: meta.keywords || [],
      tags: meta.tags || [],
      category: meta.category || "",
      icon: meta.icon || "",
      tagline: meta.tagline || "",
      url: `/tools/${id}/`
    });
  }
  return { tools, errors };
}

// node_modules/decimal.js/decimal.mjs
var EXP_LIMIT = 9e15;
var MAX_DIGITS = 1e9;
var NUMERALS = "0123456789abcdef";
var LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
var PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
var DEFAULTS = {
  // These values must be integers within the stated ranges (inclusive).
  // Most of these values can be changed at run-time using the `Decimal.config` method.
  // The maximum number of significant digits of the result of a calculation or base conversion.
  // E.g. `Decimal.config({ precision: 20 });`
  precision: 20,
  // 1 to MAX_DIGITS
  // The rounding mode used when rounding to `precision`.
  //
  // ROUND_UP         0 Away from zero.
  // ROUND_DOWN       1 Towards zero.
  // ROUND_CEIL       2 Towards +Infinity.
  // ROUND_FLOOR      3 Towards -Infinity.
  // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
  // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
  // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
  // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
  // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
  //
  // E.g.
  // `Decimal.rounding = 4;`
  // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
  rounding: 4,
  // 0 to 8
  // The modulo mode used when calculating the modulus: a mod n.
  // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
  // The remainder (r) is calculated as: r = a - n * q.
  //
  // UP         0 The remainder is positive if the dividend is negative, else is negative.
  // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
  // FLOOR      3 The remainder has the same sign as the divisor (Python %).
  // HALF_EVEN  6 The IEEE 754 remainder function.
  // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
  //
  // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
  // division (9) are commonly used for the modulus operation. The other rounding modes can also
  // be used, but they may not give useful results.
  modulo: 1,
  // 0 to 9
  // The exponent value at and beneath which `toString` returns exponential notation.
  // JavaScript numbers: -7
  toExpNeg: -7,
  // 0 to -EXP_LIMIT
  // The exponent value at and above which `toString` returns exponential notation.
  // JavaScript numbers: 21
  toExpPos: 21,
  // 0 to EXP_LIMIT
  // The minimum exponent value, beneath which underflow to zero occurs.
  // JavaScript numbers: -324  (5e-324)
  minE: -EXP_LIMIT,
  // -1 to -EXP_LIMIT
  // The maximum exponent value, above which overflow to Infinity occurs.
  // JavaScript numbers: 308  (1.7976931348623157e+308)
  maxE: EXP_LIMIT,
  // 1 to EXP_LIMIT
  // Whether to use cryptographically-secure random number generation, if available.
  crypto: false
  // true/false
};
var inexact;
var quadrant;
var external = true;
var decimalError = "[DecimalError] ";
var invalidArgument = decimalError + "Invalid argument: ";
var precisionLimitExceeded = decimalError + "Precision limit exceeded";
var cryptoUnavailable = decimalError + "crypto unavailable";
var tag = "[object Decimal]";
var mathfloor = Math.floor;
var mathpow = Math.pow;
var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
var BASE = 1e7;
var LOG_BASE = 7;
var MAX_SAFE_INTEGER = 9007199254740991;
var LN10_PRECISION = LN10.length - 1;
var PI_PRECISION = PI.length - 1;
var P = { toStringTag: tag };
P.absoluteValue = P.abs = function() {
  var x = new this.constructor(this);
  if (x.s < 0) x.s = 1;
  return finalise(x);
};
P.ceil = function() {
  return finalise(new this.constructor(this), this.e + 1, 2);
};
P.clampedTo = P.clamp = function(min2, max2) {
  var k, x = this, Ctor = x.constructor;
  min2 = new Ctor(min2);
  max2 = new Ctor(max2);
  if (!min2.s || !max2.s) return new Ctor(NaN);
  if (min2.gt(max2)) throw Error(invalidArgument + max2);
  k = x.cmp(min2);
  return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x);
};
P.comparedTo = P.cmp = function(y) {
  var i, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
  if (!xd || !yd) {
    return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
  }
  if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
  if (xs !== ys) return xs;
  if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
  xdL = xd.length;
  ydL = yd.length;
  for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
    if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
  }
  return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
};
P.cosine = P.cos = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (!x.d) return new Ctor(NaN);
  if (!x.d[0]) return new Ctor(1);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
  Ctor.rounding = 1;
  x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
};
P.cubeRoot = P.cbrt = function() {
  var e, m, n, r, rep, s, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
  if (!x.isFinite() || x.isZero()) return new Ctor(x);
  external = false;
  s = x.s * mathpow(x.s * x, 1 / 3);
  if (!s || Math.abs(s) == 1 / 0) {
    n = digitsToString(x.d);
    e = x.e;
    if (s = (e - n.length + 1) % 3) n += s == 1 || s == -2 ? "0" : "00";
    s = mathpow(n, 1 / 3);
    e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
    if (s == 1 / 0) {
      n = "5e" + e;
    } else {
      n = s.toExponential();
      n = n.slice(0, n.indexOf("e") + 1) + e;
    }
    r = new Ctor(n);
    r.s = x.s;
  } else {
    r = new Ctor(s.toString());
  }
  sd = (e = Ctor.precision) + 3;
  for (; ; ) {
    t = r;
    t3 = t.times(t).times(t);
    t3plusx = t3.plus(x);
    r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
    if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
      n = n.slice(sd - 3, sd + 1);
      if (n == "9999" || !rep && n == "4999") {
        if (!rep) {
          finalise(t, e + 1, 0);
          if (t.times(t).times(t).eq(x)) {
            r = t;
            break;
          }
        }
        sd += 4;
        rep = 1;
      } else {
        if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
          finalise(r, e + 1, 1);
          m = !r.times(r).times(r).eq(x);
        }
        break;
      }
    }
  }
  external = true;
  return finalise(r, e, Ctor.rounding, m);
};
P.decimalPlaces = P.dp = function() {
  var w, d = this.d, n = NaN;
  if (d) {
    w = d.length - 1;
    n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
    w = d[w];
    if (w) for (; w % 10 == 0; w /= 10) n--;
    if (n < 0) n = 0;
  }
  return n;
};
P.dividedBy = P.div = function(y) {
  return divide(this, new this.constructor(y));
};
P.dividedToIntegerBy = P.divToInt = function(y) {
  var x = this, Ctor = x.constructor;
  return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
};
P.equals = P.eq = function(y) {
  return this.cmp(y) === 0;
};
P.floor = function() {
  return finalise(new this.constructor(this), this.e + 1, 3);
};
P.greaterThan = P.gt = function(y) {
  return this.cmp(y) > 0;
};
P.greaterThanOrEqualTo = P.gte = function(y) {
  var k = this.cmp(y);
  return k == 1 || k === 0;
};
P.hyperbolicCosine = P.cosh = function() {
  var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
  if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
  if (x.isZero()) return one;
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
  Ctor.rounding = 1;
  len = x.d.length;
  if (len < 32) {
    k = Math.ceil(len / 3);
    n = (1 / tinyPow(4, k)).toString();
  } else {
    k = 16;
    n = "2.3283064365386962890625e-10";
  }
  x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
  var cosh2_x, i = k, d8 = new Ctor(8);
  for (; i--; ) {
    cosh2_x = x.times(x);
    x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
  }
  return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.hyperbolicSine = P.sinh = function() {
  var k, pr, rm, len, x = this, Ctor = x.constructor;
  if (!x.isFinite() || x.isZero()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
  Ctor.rounding = 1;
  len = x.d.length;
  if (len < 3) {
    x = taylorSeries(Ctor, 2, x, x, true);
  } else {
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;
    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x, true);
    var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
    for (; k--; ) {
      sinh2_x = x.times(x);
      x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
    }
  }
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return finalise(x, pr, rm, true);
};
P.hyperbolicTangent = P.tanh = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (!x.isFinite()) return new Ctor(x.s);
  if (x.isZero()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 7;
  Ctor.rounding = 1;
  return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
};
P.inverseCosine = P.acos = function() {
  var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
  if (k !== -1) {
    return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
  }
  if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);
  Ctor.precision = pr + 6;
  Ctor.rounding = 1;
  x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return x.times(2);
};
P.inverseHyperbolicCosine = P.acosh = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
  if (!x.isFinite()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
  Ctor.rounding = 1;
  external = false;
  x = x.times(x).minus(1).sqrt().plus(x);
  external = true;
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return x.ln();
};
P.inverseHyperbolicSine = P.asinh = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (!x.isFinite() || x.isZero()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
  Ctor.rounding = 1;
  external = false;
  x = x.times(x).plus(1).sqrt().plus(x);
  external = true;
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return x.ln();
};
P.inverseHyperbolicTangent = P.atanh = function() {
  var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
  if (!x.isFinite()) return new Ctor(NaN);
  if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  xsd = x.sd();
  if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
  Ctor.precision = wpr = xsd - x.e;
  x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
  Ctor.precision = pr + 4;
  Ctor.rounding = 1;
  x = x.ln();
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return x.times(0.5);
};
P.inverseSine = P.asin = function() {
  var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
  if (x.isZero()) return new Ctor(x);
  k = x.abs().cmp(1);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  if (k !== -1) {
    if (k === 0) {
      halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
      halfPi.s = x.s;
      return halfPi;
    }
    return new Ctor(NaN);
  }
  Ctor.precision = pr + 6;
  Ctor.rounding = 1;
  x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return x.times(2);
};
P.inverseTangent = P.atan = function() {
  var i, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
  if (!x.isFinite()) {
    if (!x.s) return new Ctor(NaN);
    if (pr + 4 <= PI_PRECISION) {
      r = getPi(Ctor, pr + 4, rm).times(0.5);
      r.s = x.s;
      return r;
    }
  } else if (x.isZero()) {
    return new Ctor(x);
  } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
    r = getPi(Ctor, pr + 4, rm).times(0.25);
    r.s = x.s;
    return r;
  }
  Ctor.precision = wpr = pr + 10;
  Ctor.rounding = 1;
  k = Math.min(28, wpr / LOG_BASE + 2 | 0);
  for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));
  external = false;
  j = Math.ceil(wpr / LOG_BASE);
  n = 1;
  x2 = x.times(x);
  r = new Ctor(x);
  px = x;
  for (; i !== -1; ) {
    px = px.times(x2);
    t = r.minus(px.div(n += 2));
    px = px.times(x2);
    r = t.plus(px.div(n += 2));
    if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--; ) ;
  }
  if (k) r = r.times(2 << k - 1);
  external = true;
  return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
};
P.isFinite = function() {
  return !!this.d;
};
P.isInteger = P.isInt = function() {
  return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
};
P.isNaN = function() {
  return !this.s;
};
P.isNegative = P.isNeg = function() {
  return this.s < 0;
};
P.isPositive = P.isPos = function() {
  return this.s > 0;
};
P.isZero = function() {
  return !!this.d && this.d[0] === 0;
};
P.lessThan = P.lt = function(y) {
  return this.cmp(y) < 0;
};
P.lessThanOrEqualTo = P.lte = function(y) {
  return this.cmp(y) < 1;
};
P.logarithm = P.log = function(base) {
  var isBase10, d, denominator, k, inf, num2, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
  if (base == null) {
    base = new Ctor(10);
    isBase10 = true;
  } else {
    base = new Ctor(base);
    d = base.d;
    if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);
    isBase10 = base.eq(10);
  }
  d = arg.d;
  if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
    return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
  }
  if (isBase10) {
    if (d.length > 1) {
      inf = true;
    } else {
      for (k = d[0]; k % 10 === 0; ) k /= 10;
      inf = k !== 1;
    }
  }
  external = false;
  sd = pr + guard;
  num2 = naturalLogarithm(arg, sd);
  denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
  r = divide(num2, denominator, sd, 1);
  if (checkRoundingDigits(r.d, k = pr, rm)) {
    do {
      sd += 10;
      num2 = naturalLogarithm(arg, sd);
      denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
      r = divide(num2, denominator, sd, 1);
      if (!inf) {
        if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
          r = finalise(r, pr + 1, 0);
        }
        break;
      }
    } while (checkRoundingDigits(r.d, k += 10, rm));
  }
  external = true;
  return finalise(r, pr, rm);
};
P.minus = P.sub = function(y) {
  var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
  y = new Ctor(y);
  if (!x.d || !y.d) {
    if (!x.s || !y.s) y = new Ctor(NaN);
    else if (x.d) y.s = -y.s;
    else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
    return y;
  }
  if (x.s != y.s) {
    y.s = -y.s;
    return x.plus(y);
  }
  xd = x.d;
  yd = y.d;
  pr = Ctor.precision;
  rm = Ctor.rounding;
  if (!xd[0] || !yd[0]) {
    if (yd[0]) y.s = -y.s;
    else if (xd[0]) y = new Ctor(x);
    else return new Ctor(rm === 3 ? -0 : 0);
    return external ? finalise(y, pr, rm) : y;
  }
  e = mathfloor(y.e / LOG_BASE);
  xe = mathfloor(x.e / LOG_BASE);
  xd = xd.slice();
  k = xe - e;
  if (k) {
    xLTy = k < 0;
    if (xLTy) {
      d = xd;
      k = -k;
      len = yd.length;
    } else {
      d = yd;
      e = xe;
      len = xd.length;
    }
    i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
    if (k > i) {
      k = i;
      d.length = 1;
    }
    d.reverse();
    for (i = k; i--; ) d.push(0);
    d.reverse();
  } else {
    i = xd.length;
    len = yd.length;
    xLTy = i < len;
    if (xLTy) len = i;
    for (i = 0; i < len; i++) {
      if (xd[i] != yd[i]) {
        xLTy = xd[i] < yd[i];
        break;
      }
    }
    k = 0;
  }
  if (xLTy) {
    d = xd;
    xd = yd;
    yd = d;
    y.s = -y.s;
  }
  len = xd.length;
  for (i = yd.length - len; i > 0; --i) xd[len++] = 0;
  for (i = yd.length; i > k; ) {
    if (xd[--i] < yd[i]) {
      for (j = i; j && xd[--j] === 0; ) xd[j] = BASE - 1;
      --xd[j];
      xd[i] += BASE;
    }
    xd[i] -= yd[i];
  }
  for (; xd[--len] === 0; ) xd.pop();
  for (; xd[0] === 0; xd.shift()) --e;
  if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
  y.d = xd;
  y.e = getBase10Exponent(xd, e);
  return external ? finalise(y, pr, rm) : y;
};
P.modulo = P.mod = function(y) {
  var q, x = this, Ctor = x.constructor;
  y = new Ctor(y);
  if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
  if (!y.d || x.d && !x.d[0]) {
    return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
  }
  external = false;
  if (Ctor.modulo == 9) {
    q = divide(x, y.abs(), 0, 3, 1);
    q.s *= y.s;
  } else {
    q = divide(x, y, 0, Ctor.modulo, 1);
  }
  q = q.times(y);
  external = true;
  return x.minus(q);
};
P.naturalExponential = P.exp = function() {
  return naturalExponential(this);
};
P.naturalLogarithm = P.ln = function() {
  return naturalLogarithm(this);
};
P.negated = P.neg = function() {
  var x = new this.constructor(this);
  x.s = -x.s;
  return finalise(x);
};
P.plus = P.add = function(y) {
  var carry, d, e, i, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
  y = new Ctor(y);
  if (!x.d || !y.d) {
    if (!x.s || !y.s) y = new Ctor(NaN);
    else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
    return y;
  }
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }
  xd = x.d;
  yd = y.d;
  pr = Ctor.precision;
  rm = Ctor.rounding;
  if (!xd[0] || !yd[0]) {
    if (!yd[0]) y = new Ctor(x);
    return external ? finalise(y, pr, rm) : y;
  }
  k = mathfloor(x.e / LOG_BASE);
  e = mathfloor(y.e / LOG_BASE);
  xd = xd.slice();
  i = k - e;
  if (i) {
    if (i < 0) {
      d = xd;
      i = -i;
      len = yd.length;
    } else {
      d = yd;
      e = k;
      len = xd.length;
    }
    k = Math.ceil(pr / LOG_BASE);
    len = k > len ? k + 1 : len + 1;
    if (i > len) {
      i = len;
      d.length = 1;
    }
    d.reverse();
    for (; i--; ) d.push(0);
    d.reverse();
  }
  len = xd.length;
  i = yd.length;
  if (len - i < 0) {
    i = len;
    d = yd;
    yd = xd;
    xd = d;
  }
  for (carry = 0; i; ) {
    carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
    xd[i] %= BASE;
  }
  if (carry) {
    xd.unshift(carry);
    ++e;
  }
  for (len = xd.length; xd[--len] == 0; ) xd.pop();
  y.d = xd;
  y.e = getBase10Exponent(xd, e);
  return external ? finalise(y, pr, rm) : y;
};
P.precision = P.sd = function(z) {
  var k, x = this;
  if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
  if (x.d) {
    k = getPrecision(x.d);
    if (z && x.e + 1 > k) k = x.e + 1;
  } else {
    k = NaN;
  }
  return k;
};
P.round = function() {
  var x = this, Ctor = x.constructor;
  return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
};
P.sine = P.sin = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (!x.isFinite()) return new Ctor(NaN);
  if (x.isZero()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
  Ctor.rounding = 1;
  x = sine(Ctor, toLessThanHalfPi(Ctor, x));
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
};
P.squareRoot = P.sqrt = function() {
  var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s = x.s, Ctor = x.constructor;
  if (s !== 1 || !d || !d[0]) {
    return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
  }
  external = false;
  s = Math.sqrt(+x);
  if (s == 0 || s == 1 / 0) {
    n = digitsToString(d);
    if ((n.length + e) % 2 == 0) n += "0";
    s = Math.sqrt(n);
    e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
    if (s == 1 / 0) {
      n = "5e" + e;
    } else {
      n = s.toExponential();
      n = n.slice(0, n.indexOf("e") + 1) + e;
    }
    r = new Ctor(n);
  } else {
    r = new Ctor(s.toString());
  }
  sd = (e = Ctor.precision) + 3;
  for (; ; ) {
    t = r;
    r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);
    if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
      n = n.slice(sd - 3, sd + 1);
      if (n == "9999" || !rep && n == "4999") {
        if (!rep) {
          finalise(t, e + 1, 0);
          if (t.times(t).eq(x)) {
            r = t;
            break;
          }
        }
        sd += 4;
        rep = 1;
      } else {
        if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
          finalise(r, e + 1, 1);
          m = !r.times(r).eq(x);
        }
        break;
      }
    }
  }
  external = true;
  return finalise(r, e, Ctor.rounding, m);
};
P.tangent = P.tan = function() {
  var pr, rm, x = this, Ctor = x.constructor;
  if (!x.isFinite()) return new Ctor(NaN);
  if (x.isZero()) return new Ctor(x);
  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 10;
  Ctor.rounding = 1;
  x = x.sin();
  x.s = 1;
  x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
  Ctor.precision = pr;
  Ctor.rounding = rm;
  return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
};
P.times = P.mul = function(y) {
  var carry, e, i, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
  y.s *= x.s;
  if (!xd || !xd[0] || !yd || !yd[0]) {
    return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
  }
  e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
  xdL = xd.length;
  ydL = yd.length;
  if (xdL < ydL) {
    r = xd;
    xd = yd;
    yd = r;
    rL = xdL;
    xdL = ydL;
    ydL = rL;
  }
  r = [];
  rL = xdL + ydL;
  for (i = rL; i--; ) r.push(0);
  for (i = ydL; --i >= 0; ) {
    carry = 0;
    for (k = xdL + i; k > i; ) {
      t = r[k] + yd[i] * xd[k - i - 1] + carry;
      r[k--] = t % BASE | 0;
      carry = t / BASE | 0;
    }
    r[k] = (r[k] + carry) % BASE | 0;
  }
  for (; !r[--rL]; ) r.pop();
  if (carry) ++e;
  else r.shift();
  y.d = r;
  y.e = getBase10Exponent(r, e);
  return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
};
P.toBinary = function(sd, rm) {
  return toStringBinary(this, 2, sd, rm);
};
P.toDecimalPlaces = P.toDP = function(dp, rm) {
  var x = this, Ctor = x.constructor;
  x = new Ctor(x);
  if (dp === void 0) return x;
  checkInt32(dp, 0, MAX_DIGITS);
  if (rm === void 0) rm = Ctor.rounding;
  else checkInt32(rm, 0, 8);
  return finalise(x, dp + x.e + 1, rm);
};
P.toExponential = function(dp, rm) {
  var str, x = this, Ctor = x.constructor;
  if (dp === void 0) {
    str = finiteToString(x, true);
  } else {
    checkInt32(dp, 0, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    x = finalise(new Ctor(x), dp + 1, rm);
    str = finiteToString(x, true, dp + 1);
  }
  return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFixed = function(dp, rm) {
  var str, y, x = this, Ctor = x.constructor;
  if (dp === void 0) {
    str = finiteToString(x);
  } else {
    checkInt32(dp, 0, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    y = finalise(new Ctor(x), dp + x.e + 1, rm);
    str = finiteToString(y, false, dp + y.e + 1);
  }
  return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toFraction = function(maxD) {
  var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r, x = this, xd = x.d, Ctor = x.constructor;
  if (!xd) return new Ctor(x);
  n1 = d0 = new Ctor(1);
  d1 = n0 = new Ctor(0);
  d = new Ctor(d1);
  e = d.e = getPrecision(xd) - x.e - 1;
  k = e % LOG_BASE;
  d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
  if (maxD == null) {
    maxD = e > 0 ? d : n1;
  } else {
    n = new Ctor(maxD);
    if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
    maxD = n.gt(d) ? e > 0 ? d : n1 : n;
  }
  external = false;
  n = new Ctor(digitsToString(xd));
  pr = Ctor.precision;
  Ctor.precision = e = xd.length * LOG_BASE * 2;
  for (; ; ) {
    q = divide(n, d, 0, 1, 1);
    d2 = d0.plus(q.times(d1));
    if (d2.cmp(maxD) == 1) break;
    d0 = d1;
    d1 = d2;
    d2 = n1;
    n1 = n0.plus(q.times(d2));
    n0 = d2;
    d2 = d;
    d = n.minus(q.times(d2));
    n = d2;
  }
  d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
  n0 = n0.plus(d2.times(n1));
  d0 = d0.plus(d2.times(d1));
  n0.s = n1.s = x.s;
  r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
  Ctor.precision = pr;
  external = true;
  return r;
};
P.toHexadecimal = P.toHex = function(sd, rm) {
  return toStringBinary(this, 16, sd, rm);
};
P.toNearest = function(y, rm) {
  var x = this, Ctor = x.constructor;
  x = new Ctor(x);
  if (y == null) {
    if (!x.d) return x;
    y = new Ctor(1);
    rm = Ctor.rounding;
  } else {
    y = new Ctor(y);
    if (rm === void 0) {
      rm = Ctor.rounding;
    } else {
      checkInt32(rm, 0, 8);
    }
    if (!x.d) return y.s ? x : y;
    if (!y.d) {
      if (y.s) y.s = x.s;
      return y;
    }
  }
  if (y.d[0]) {
    external = false;
    x = divide(x, y, 0, rm, 1).times(y);
    external = true;
    finalise(x);
  } else {
    y.s = x.s;
    x = y;
  }
  return x;
};
P.toNumber = function() {
  return +this;
};
P.toOctal = function(sd, rm) {
  return toStringBinary(this, 8, sd, rm);
};
P.toPower = P.pow = function(y) {
  var e, k, pr, r, rm, s, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
  if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
  x = new Ctor(x);
  if (x.eq(1)) return x;
  pr = Ctor.precision;
  rm = Ctor.rounding;
  if (y.eq(1)) return finalise(x, pr, rm);
  e = mathfloor(y.e / LOG_BASE);
  if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
    r = intPow(Ctor, x, k, pr);
    return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
  }
  s = x.s;
  if (s < 0) {
    if (e < y.d.length - 1) return new Ctor(NaN);
    if ((y.d[e] & 1) == 0) s = 1;
    if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
      x.s = s;
      return x;
    }
  }
  k = mathpow(+x, yn);
  e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
  if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);
  external = false;
  Ctor.rounding = x.s = 1;
  k = Math.min(12, (e + "").length);
  r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
  if (r.d) {
    r = finalise(r, pr + 5, 1);
    if (checkRoundingDigits(r.d, pr, rm)) {
      e = pr + 10;
      r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
      if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
        r = finalise(r, pr + 1, 0);
      }
    }
  }
  r.s = s;
  external = true;
  Ctor.rounding = rm;
  return finalise(r, pr, rm);
};
P.toPrecision = function(sd, rm) {
  var str, x = this, Ctor = x.constructor;
  if (sd === void 0) {
    str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
  } else {
    checkInt32(sd, 1, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    x = finalise(new Ctor(x), sd, rm);
    str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
  }
  return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.toSignificantDigits = P.toSD = function(sd, rm) {
  var x = this, Ctor = x.constructor;
  if (sd === void 0) {
    sd = Ctor.precision;
    rm = Ctor.rounding;
  } else {
    checkInt32(sd, 1, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
  }
  return finalise(new Ctor(x), sd, rm);
};
P.toString = function() {
  var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
  return x.isNeg() && !x.isZero() ? "-" + str : str;
};
P.truncated = P.trunc = function() {
  return finalise(new this.constructor(this), this.e + 1, 1);
};
P.valueOf = P.toJSON = function() {
  var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
  return x.isNeg() ? "-" + str : str;
};
function digitsToString(d) {
  var i, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
  if (indexOfLastWord > 0) {
    str += w;
    for (i = 1; i < indexOfLastWord; i++) {
      ws = d[i] + "";
      k = LOG_BASE - ws.length;
      if (k) str += getZeroString(k);
      str += ws;
    }
    w = d[i];
    ws = w + "";
    k = LOG_BASE - ws.length;
    if (k) str += getZeroString(k);
  } else if (w === 0) {
    return "0";
  }
  for (; w % 10 === 0; ) w /= 10;
  return str + w;
}
function checkInt32(i, min2, max2) {
  if (i !== ~~i || i < min2 || i > max2) {
    throw Error(invalidArgument + i);
  }
}
function checkRoundingDigits(d, i, rm, repeating) {
  var di, k, r, rd;
  for (k = d[0]; k >= 10; k /= 10) --i;
  if (--i < 0) {
    i += LOG_BASE;
    di = 0;
  } else {
    di = Math.ceil((i + 1) / LOG_BASE);
    i %= LOG_BASE;
  }
  k = mathpow(10, LOG_BASE - i);
  rd = d[di] % k | 0;
  if (repeating == null) {
    if (i < 3) {
      if (i == 0) rd = rd / 100 | 0;
      else if (i == 1) rd = rd / 10 | 0;
      r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
    } else {
      r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
    }
  } else {
    if (i < 4) {
      if (i == 0) rd = rd / 1e3 | 0;
      else if (i == 1) rd = rd / 100 | 0;
      else if (i == 2) rd = rd / 10 | 0;
      r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
    } else {
      r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i - 3) - 1;
    }
  }
  return r;
}
function convertBase(str, baseIn, baseOut) {
  var j, arr = [0], arrL, i = 0, strL = str.length;
  for (; i < strL; ) {
    for (arrL = arr.length; arrL--; ) arr[arrL] *= baseIn;
    arr[0] += NUMERALS.indexOf(str.charAt(i++));
    for (j = 0; j < arr.length; j++) {
      if (arr[j] > baseOut - 1) {
        if (arr[j + 1] === void 0) arr[j + 1] = 0;
        arr[j + 1] += arr[j] / baseOut | 0;
        arr[j] %= baseOut;
      }
    }
  }
  return arr.reverse();
}
function cosine(Ctor, x) {
  var k, len, y;
  if (x.isZero()) return x;
  len = x.d.length;
  if (len < 32) {
    k = Math.ceil(len / 3);
    y = (1 / tinyPow(4, k)).toString();
  } else {
    k = 16;
    y = "2.3283064365386962890625e-10";
  }
  Ctor.precision += k;
  x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
  for (var i = k; i--; ) {
    var cos2x = x.times(x);
    x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
  }
  Ctor.precision -= k;
  return x;
}
var divide = /* @__PURE__ */ (function() {
  function multiplyInteger(x, k, base) {
    var temp, carry = 0, i = x.length;
    for (x = x.slice(); i--; ) {
      temp = x[i] * k + carry;
      x[i] = temp % base | 0;
      carry = temp / base | 0;
    }
    if (carry) x.unshift(carry);
    return x;
  }
  function compare(a, b, aL, bL) {
    var i, r;
    if (aL != bL) {
      r = aL > bL ? 1 : -1;
    } else {
      for (i = r = 0; i < aL; i++) {
        if (a[i] != b[i]) {
          r = a[i] > b[i] ? 1 : -1;
          break;
        }
      }
    }
    return r;
  }
  function subtract(a, b, aL, base) {
    var i = 0;
    for (; aL--; ) {
      a[aL] -= i;
      i = a[aL] < b[aL] ? 1 : 0;
      a[aL] = i * base + a[aL] - b[aL];
    }
    for (; !a[0] && a.length > 1; ) a.shift();
  }
  return function(x, y, pr, rm, dp, base) {
    var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign2 = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
    if (!xd || !xd[0] || !yd || !yd[0]) {
      return new Ctor(
        // Return NaN if either NaN, or both Infinity or 0.
        !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : (
          // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
          xd && xd[0] == 0 || !yd ? sign2 * 0 : sign2 / 0
        )
      );
    }
    if (base) {
      logBase = 1;
      e = x.e - y.e;
    } else {
      base = BASE;
      logBase = LOG_BASE;
      e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
    }
    yL = yd.length;
    xL = xd.length;
    q = new Ctor(sign2);
    qd = q.d = [];
    for (i = 0; yd[i] == (xd[i] || 0); i++) ;
    if (yd[i] > (xd[i] || 0)) e--;
    if (pr == null) {
      sd = pr = Ctor.precision;
      rm = Ctor.rounding;
    } else if (dp) {
      sd = pr + (x.e - y.e) + 1;
    } else {
      sd = pr;
    }
    if (sd < 0) {
      qd.push(1);
      more = true;
    } else {
      sd = sd / logBase + 2 | 0;
      i = 0;
      if (yL == 1) {
        k = 0;
        yd = yd[0];
        sd++;
        for (; (i < xL || k) && sd--; i++) {
          t = k * base + (xd[i] || 0);
          qd[i] = t / yd | 0;
          k = t % yd | 0;
        }
        more = k || i < xL;
      } else {
        k = base / (yd[0] + 1) | 0;
        if (k > 1) {
          yd = multiplyInteger(yd, k, base);
          xd = multiplyInteger(xd, k, base);
          yL = yd.length;
          xL = xd.length;
        }
        xi = yL;
        rem = xd.slice(0, yL);
        remL = rem.length;
        for (; remL < yL; ) rem[remL++] = 0;
        yz = yd.slice();
        yz.unshift(0);
        yd0 = yd[0];
        if (yd[1] >= base / 2) ++yd0;
        do {
          k = 0;
          cmp = compare(yd, rem, yL, remL);
          if (cmp < 0) {
            rem0 = rem[0];
            if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
            k = rem0 / yd0 | 0;
            if (k > 1) {
              if (k >= base) k = base - 1;
              prod = multiplyInteger(yd, k, base);
              prodL = prod.length;
              remL = rem.length;
              cmp = compare(prod, rem, prodL, remL);
              if (cmp == 1) {
                k--;
                subtract(prod, yL < prodL ? yz : yd, prodL, base);
              }
            } else {
              if (k == 0) cmp = k = 1;
              prod = yd.slice();
            }
            prodL = prod.length;
            if (prodL < remL) prod.unshift(0);
            subtract(rem, prod, remL, base);
            if (cmp == -1) {
              remL = rem.length;
              cmp = compare(yd, rem, yL, remL);
              if (cmp < 1) {
                k++;
                subtract(rem, yL < remL ? yz : yd, remL, base);
              }
            }
            remL = rem.length;
          } else if (cmp === 0) {
            k++;
            rem = [0];
          }
          qd[i++] = k;
          if (cmp && rem[0]) {
            rem[remL++] = xd[xi] || 0;
          } else {
            rem = [xd[xi]];
            remL = 1;
          }
        } while ((xi++ < xL || rem[0] !== void 0) && sd--);
        more = rem[0] !== void 0;
      }
      if (!qd[0]) qd.shift();
    }
    if (logBase == 1) {
      q.e = e;
      inexact = more;
    } else {
      for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
      q.e = i + e * logBase - 1;
      finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
    }
    return q;
  };
})();
function finalise(x, sd, rm, isTruncated) {
  var digits, i, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
  out: if (sd != null) {
    xd = x.d;
    if (!xd) return x;
    for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
    i = sd - digits;
    if (i < 0) {
      i += LOG_BASE;
      j = sd;
      w = xd[xdi = 0];
      rd = w / mathpow(10, digits - j - 1) % 10 | 0;
    } else {
      xdi = Math.ceil((i + 1) / LOG_BASE);
      k = xd.length;
      if (xdi >= k) {
        if (isTruncated) {
          for (; k++ <= xdi; ) xd.push(0);
          w = rd = 0;
          digits = 1;
          i %= LOG_BASE;
          j = i - LOG_BASE + 1;
        } else {
          break out;
        }
      } else {
        w = k = xd[xdi];
        for (digits = 1; k >= 10; k /= 10) digits++;
        i %= LOG_BASE;
        j = i - LOG_BASE + digits;
        rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
      }
    }
    isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
    roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
    (i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
    if (sd < 1 || !xd[0]) {
      xd.length = 0;
      if (roundUp) {
        sd -= x.e + 1;
        xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
        x.e = -sd || 0;
      } else {
        xd[0] = x.e = 0;
      }
      return x;
    }
    if (i == 0) {
      xd.length = xdi;
      k = 1;
      xdi--;
    } else {
      xd.length = xdi + 1;
      k = mathpow(10, LOG_BASE - i);
      xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
    }
    if (roundUp) {
      for (; ; ) {
        if (xdi == 0) {
          for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
          j = xd[0] += k;
          for (k = 1; j >= 10; j /= 10) k++;
          if (i != k) {
            x.e++;
            if (xd[0] == BASE) xd[0] = 1;
          }
          break;
        } else {
          xd[xdi] += k;
          if (xd[xdi] != BASE) break;
          xd[xdi--] = 0;
          k = 1;
        }
      }
    }
    for (i = xd.length; xd[--i] === 0; ) xd.pop();
  }
  if (external) {
    if (x.e > Ctor.maxE) {
      x.d = null;
      x.e = NaN;
    } else if (x.e < Ctor.minE) {
      x.e = 0;
      x.d = [0];
    }
  }
  return x;
}
function finiteToString(x, isExp, sd) {
  if (!x.isFinite()) return nonFiniteToString(x);
  var k, e = x.e, str = digitsToString(x.d), len = str.length;
  if (isExp) {
    if (sd && (k = sd - len) > 0) {
      str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
    } else if (len > 1) {
      str = str.charAt(0) + "." + str.slice(1);
    }
    str = str + (x.e < 0 ? "e" : "e+") + x.e;
  } else if (e < 0) {
    str = "0." + getZeroString(-e - 1) + str;
    if (sd && (k = sd - len) > 0) str += getZeroString(k);
  } else if (e >= len) {
    str += getZeroString(e + 1 - len);
    if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
  } else {
    if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
    if (sd && (k = sd - len) > 0) {
      if (e + 1 === len) str += ".";
      str += getZeroString(k);
    }
  }
  return str;
}
function getBase10Exponent(digits, e) {
  var w = digits[0];
  for (e *= LOG_BASE; w >= 10; w /= 10) e++;
  return e;
}
function getLn10(Ctor, sd, pr) {
  if (sd > LN10_PRECISION) {
    external = true;
    if (pr) Ctor.precision = pr;
    throw Error(precisionLimitExceeded);
  }
  return finalise(new Ctor(LN10), sd, 1, true);
}
function getPi(Ctor, sd, rm) {
  if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
  return finalise(new Ctor(PI), sd, rm, true);
}
function getPrecision(digits) {
  var w = digits.length - 1, len = w * LOG_BASE + 1;
  w = digits[w];
  if (w) {
    for (; w % 10 == 0; w /= 10) len--;
    for (w = digits[0]; w >= 10; w /= 10) len++;
  }
  return len;
}
function getZeroString(k) {
  var zs = "";
  for (; k--; ) zs += "0";
  return zs;
}
function intPow(Ctor, x, n, pr) {
  var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
  external = false;
  for (; ; ) {
    if (n % 2) {
      r = r.times(x);
      if (truncate(r.d, k)) isTruncated = true;
    }
    n = mathfloor(n / 2);
    if (n === 0) {
      n = r.d.length - 1;
      if (isTruncated && r.d[n] === 0) ++r.d[n];
      break;
    }
    x = x.times(x);
    truncate(x.d, k);
  }
  external = true;
  return r;
}
function isOdd(n) {
  return n.d[n.d.length - 1] & 1;
}
function maxOrMin(Ctor, args, n) {
  var k, y, x = new Ctor(args[0]), i = 0;
  for (; ++i < args.length; ) {
    y = new Ctor(args[i]);
    if (!y.s) {
      x = y;
      break;
    }
    k = x.cmp(y);
    if (k === n || k === 0 && x.s === n) {
      x = y;
    }
  }
  return x;
}
function naturalExponential(x, sd) {
  var denominator, guard, j, pow2, sum2, t, wpr, rep = 0, i = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
  if (!x.d || !x.d[0] || x.e > 17) {
    return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
  }
  if (sd == null) {
    external = false;
    wpr = pr;
  } else {
    wpr = sd;
  }
  t = new Ctor(0.03125);
  while (x.e > -2) {
    x = x.times(t);
    k += 5;
  }
  guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
  wpr += guard;
  denominator = pow2 = sum2 = new Ctor(1);
  Ctor.precision = wpr;
  for (; ; ) {
    pow2 = finalise(pow2.times(x), wpr, 1);
    denominator = denominator.times(++i);
    t = sum2.plus(divide(pow2, denominator, wpr, 1));
    if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
      j = k;
      while (j--) sum2 = finalise(sum2.times(sum2), wpr, 1);
      if (sd == null) {
        if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
          Ctor.precision = wpr += 10;
          denominator = pow2 = t = new Ctor(1);
          i = 0;
          rep++;
        } else {
          return finalise(sum2, Ctor.precision = pr, rm, external = true);
        }
      } else {
        Ctor.precision = pr;
        return sum2;
      }
    }
    sum2 = t;
  }
}
function naturalLogarithm(y, sd) {
  var c, c0, denominator, e, numerator, rep, sum2, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
  if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
    return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
  }
  if (sd == null) {
    external = false;
    wpr = pr;
  } else {
    wpr = sd;
  }
  Ctor.precision = wpr += guard;
  c = digitsToString(xd);
  c0 = c.charAt(0);
  if (Math.abs(e = x.e) < 15e14) {
    while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
      x = x.times(y);
      c = digitsToString(x.d);
      c0 = c.charAt(0);
      n++;
    }
    e = x.e;
    if (c0 > 1) {
      x = new Ctor("0." + c);
      e++;
    } else {
      x = new Ctor(c0 + "." + c.slice(1));
    }
  } else {
    t = getLn10(Ctor, wpr + 2, pr).times(e + "");
    x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
    Ctor.precision = pr;
    return sd == null ? finalise(x, pr, rm, external = true) : x;
  }
  x1 = x;
  sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
  x2 = finalise(x.times(x), wpr, 1);
  denominator = 3;
  for (; ; ) {
    numerator = finalise(numerator.times(x2), wpr, 1);
    t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1));
    if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
      sum2 = sum2.times(2);
      if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
      sum2 = divide(sum2, new Ctor(n), wpr, 1);
      if (sd == null) {
        if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
          Ctor.precision = wpr += guard;
          t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
          x2 = finalise(x.times(x), wpr, 1);
          denominator = rep = 1;
        } else {
          return finalise(sum2, Ctor.precision = pr, rm, external = true);
        }
      } else {
        Ctor.precision = pr;
        return sum2;
      }
    }
    sum2 = t;
    denominator += 2;
  }
}
function nonFiniteToString(x) {
  return String(x.s * x.s / 0);
}
function parseDecimal(x, str) {
  var e, i, len;
  if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
  if ((i = str.search(/e/i)) > 0) {
    if (e < 0) e = i;
    e += +str.slice(i + 1);
    str = str.substring(0, i);
  } else if (e < 0) {
    e = str.length;
  }
  for (i = 0; str.charCodeAt(i) === 48; i++) ;
  for (len = str.length; str.charCodeAt(len - 1) === 48; --len) ;
  str = str.slice(i, len);
  if (str) {
    len -= i;
    x.e = e = e - i - 1;
    x.d = [];
    i = (e + 1) % LOG_BASE;
    if (e < 0) i += LOG_BASE;
    if (i < len) {
      if (i) x.d.push(+str.slice(0, i));
      for (len -= LOG_BASE; i < len; ) x.d.push(+str.slice(i, i += LOG_BASE));
      str = str.slice(i);
      i = LOG_BASE - str.length;
    } else {
      i -= len;
    }
    for (; i--; ) str += "0";
    x.d.push(+str);
    if (external) {
      if (x.e > x.constructor.maxE) {
        x.d = null;
        x.e = NaN;
      } else if (x.e < x.constructor.minE) {
        x.e = 0;
        x.d = [0];
      }
    }
  } else {
    x.e = 0;
    x.d = [0];
  }
  return x;
}
function parseOther(x, str) {
  var base, Ctor, divisor, i, isFloat, len, p, xd, xe;
  if (str.indexOf("_") > -1) {
    str = str.replace(/(\d)_(?=\d)/g, "$1");
    if (isDecimal.test(str)) return parseDecimal(x, str);
  } else if (str === "Infinity" || str === "NaN") {
    if (!+str) x.s = NaN;
    x.e = NaN;
    x.d = null;
    return x;
  }
  if (isHex.test(str)) {
    base = 16;
    str = str.toLowerCase();
  } else if (isBinary.test(str)) {
    base = 2;
  } else if (isOctal.test(str)) {
    base = 8;
  } else {
    throw Error(invalidArgument + str);
  }
  i = str.search(/p/i);
  if (i > 0) {
    p = +str.slice(i + 1);
    str = str.substring(2, i);
  } else {
    str = str.slice(2);
  }
  i = str.indexOf(".");
  isFloat = i >= 0;
  Ctor = x.constructor;
  if (isFloat) {
    str = str.replace(".", "");
    len = str.length;
    i = len - i;
    divisor = intPow(Ctor, new Ctor(base), i, i * 2);
  }
  xd = convertBase(str, base, BASE);
  xe = xd.length - 1;
  for (i = xe; xd[i] === 0; --i) xd.pop();
  if (i < 0) return new Ctor(x.s * 0);
  x.e = getBase10Exponent(xd, xe);
  x.d = xd;
  external = false;
  if (isFloat) x = divide(x, divisor, len * 4);
  if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
  external = true;
  return x;
}
function sine(Ctor, x) {
  var k, len = x.d.length;
  if (len < 3) {
    return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
  }
  k = 1.4 * Math.sqrt(len);
  k = k > 16 ? 16 : k | 0;
  x = x.times(1 / tinyPow(5, k));
  x = taylorSeries(Ctor, 2, x, x);
  var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
  for (; k--; ) {
    sin2_x = x.times(x);
    x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
  }
  return x;
}
function taylorSeries(Ctor, n, x, y, isHyperbolic) {
  var j, t, u, x2, i = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
  external = false;
  x2 = x.times(x);
  u = new Ctor(y);
  for (; ; ) {
    t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
    u = isHyperbolic ? y.plus(t) : y.minus(t);
    y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
    t = u.plus(y);
    if (t.d[k] !== void 0) {
      for (j = k; t.d[j] === u.d[j] && j--; ) ;
      if (j == -1) break;
    }
    j = u;
    u = y;
    y = t;
    t = j;
    i++;
  }
  external = true;
  t.d.length = k + 1;
  return t;
}
function tinyPow(b, e) {
  var n = b;
  while (--e) n *= b;
  return n;
}
function toLessThanHalfPi(Ctor, x) {
  var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(0.5);
  x = x.abs();
  if (x.lte(halfPi)) {
    quadrant = isNeg ? 4 : 1;
    return x;
  }
  t = x.divToInt(pi);
  if (t.isZero()) {
    quadrant = isNeg ? 3 : 2;
  } else {
    x = x.minus(t.times(pi));
    if (x.lte(halfPi)) {
      quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
      return x;
    }
    quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
  }
  return x.minus(pi).abs();
}
function toStringBinary(x, baseOut, sd, rm) {
  var base, e, i, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
  if (isExp) {
    checkInt32(sd, 1, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
  } else {
    sd = Ctor.precision;
    rm = Ctor.rounding;
  }
  if (!x.isFinite()) {
    str = nonFiniteToString(x);
  } else {
    str = finiteToString(x);
    i = str.indexOf(".");
    if (isExp) {
      base = 2;
      if (baseOut == 16) {
        sd = sd * 4 - 3;
      } else if (baseOut == 8) {
        sd = sd * 3 - 2;
      }
    } else {
      base = baseOut;
    }
    if (i >= 0) {
      str = str.replace(".", "");
      y = new Ctor(1);
      y.e = str.length - i;
      y.d = convertBase(finiteToString(y), 10, base);
      y.e = y.d.length;
    }
    xd = convertBase(str, 10, base);
    e = len = xd.length;
    for (; xd[--len] == 0; ) xd.pop();
    if (!xd[0]) {
      str = isExp ? "0p+0" : "0";
    } else {
      if (i < 0) {
        e--;
      } else {
        x = new Ctor(x);
        x.d = xd;
        x.e = e;
        x = divide(x, y, sd, rm, 0, base);
        xd = x.d;
        e = x.e;
        roundUp = inexact;
      }
      i = xd[sd];
      k = base / 2;
      roundUp = roundUp || xd[sd + 1] !== void 0;
      roundUp = rm < 4 ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
      xd.length = sd;
      if (roundUp) {
        for (; ++xd[--sd] > base - 1; ) {
          xd[sd] = 0;
          if (!sd) {
            ++e;
            xd.unshift(1);
          }
        }
      }
      for (len = xd.length; !xd[len - 1]; --len) ;
      for (i = 0, str = ""; i < len; i++) str += NUMERALS.charAt(xd[i]);
      if (isExp) {
        if (len > 1) {
          if (baseOut == 16 || baseOut == 8) {
            i = baseOut == 16 ? 4 : 3;
            for (--len; len % i; len++) str += "0";
            xd = convertBase(str, base, baseOut);
            for (len = xd.length; !xd[len - 1]; --len) ;
            for (i = 1, str = "1."; i < len; i++) str += NUMERALS.charAt(xd[i]);
          } else {
            str = str.charAt(0) + "." + str.slice(1);
          }
        }
        str = str + (e < 0 ? "p" : "p+") + e;
      } else if (e < 0) {
        for (; ++e; ) str = "0" + str;
        str = "0." + str;
      } else {
        if (++e > len) for (e -= len; e--; ) str += "0";
        else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
      }
    }
    str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
  }
  return x.s < 0 ? "-" + str : str;
}
function truncate(arr, len) {
  if (arr.length > len) {
    arr.length = len;
    return true;
  }
}
function abs(x) {
  return new this(x).abs();
}
function acos(x) {
  return new this(x).acos();
}
function acosh(x) {
  return new this(x).acosh();
}
function add(x, y) {
  return new this(x).plus(y);
}
function asin(x) {
  return new this(x).asin();
}
function asinh(x) {
  return new this(x).asinh();
}
function atan(x) {
  return new this(x).atan();
}
function atanh(x) {
  return new this(x).atanh();
}
function atan2(y, x) {
  y = new this(y);
  x = new this(x);
  var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
  if (!y.s || !x.s) {
    r = new this(NaN);
  } else if (!y.d && !x.d) {
    r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
    r.s = y.s;
  } else if (!x.d || y.isZero()) {
    r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
    r.s = y.s;
  } else if (!y.d || x.isZero()) {
    r = getPi(this, wpr, 1).times(0.5);
    r.s = y.s;
  } else if (x.s < 0) {
    this.precision = wpr;
    this.rounding = 1;
    r = this.atan(divide(y, x, wpr, 1));
    x = getPi(this, wpr, 1);
    this.precision = pr;
    this.rounding = rm;
    r = y.s < 0 ? r.minus(x) : r.plus(x);
  } else {
    r = this.atan(divide(y, x, wpr, 1));
  }
  return r;
}
function cbrt(x) {
  return new this(x).cbrt();
}
function ceil(x) {
  return finalise(x = new this(x), x.e + 1, 2);
}
function clamp(x, min2, max2) {
  return new this(x).clamp(min2, max2);
}
function config(obj) {
  if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
  var i, p, v, useDefaults = obj.defaults === true, ps = [
    "precision",
    1,
    MAX_DIGITS,
    "rounding",
    0,
    8,
    "toExpNeg",
    -EXP_LIMIT,
    0,
    "toExpPos",
    0,
    EXP_LIMIT,
    "maxE",
    0,
    EXP_LIMIT,
    "minE",
    -EXP_LIMIT,
    0,
    "modulo",
    0,
    9
  ];
  for (i = 0; i < ps.length; i += 3) {
    if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
    if ((v = obj[p]) !== void 0) {
      if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
      else throw Error(invalidArgument + p + ": " + v);
    }
  }
  if (p = "crypto", useDefaults) this[p] = DEFAULTS[p];
  if ((v = obj[p]) !== void 0) {
    if (v === true || v === false || v === 0 || v === 1) {
      if (v) {
        if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
          this[p] = true;
        } else {
          throw Error(cryptoUnavailable);
        }
      } else {
        this[p] = false;
      }
    } else {
      throw Error(invalidArgument + p + ": " + v);
    }
  }
  return this;
}
function cos(x) {
  return new this(x).cos();
}
function cosh(x) {
  return new this(x).cosh();
}
function clone(obj) {
  var i, p, ps;
  function Decimal2(v) {
    var e, i2, t, x = this;
    if (!(x instanceof Decimal2)) return new Decimal2(v);
    x.constructor = Decimal2;
    if (isDecimalInstance(v)) {
      x.s = v.s;
      if (external) {
        if (!v.d || v.e > Decimal2.maxE) {
          x.e = NaN;
          x.d = null;
        } else if (v.e < Decimal2.minE) {
          x.e = 0;
          x.d = [0];
        } else {
          x.e = v.e;
          x.d = v.d.slice();
        }
      } else {
        x.e = v.e;
        x.d = v.d ? v.d.slice() : v.d;
      }
      return;
    }
    t = typeof v;
    if (t === "number") {
      if (v === 0) {
        x.s = 1 / v < 0 ? -1 : 1;
        x.e = 0;
        x.d = [0];
        return;
      }
      if (v < 0) {
        v = -v;
        x.s = -1;
      } else {
        x.s = 1;
      }
      if (v === ~~v && v < 1e7) {
        for (e = 0, i2 = v; i2 >= 10; i2 /= 10) e++;
        if (external) {
          if (e > Decimal2.maxE) {
            x.e = NaN;
            x.d = null;
          } else if (e < Decimal2.minE) {
            x.e = 0;
            x.d = [0];
          } else {
            x.e = e;
            x.d = [v];
          }
        } else {
          x.e = e;
          x.d = [v];
        }
        return;
      }
      if (v * 0 !== 0) {
        if (!v) x.s = NaN;
        x.e = NaN;
        x.d = null;
        return;
      }
      return parseDecimal(x, v.toString());
    }
    if (t === "string") {
      if ((i2 = v.charCodeAt(0)) === 45) {
        v = v.slice(1);
        x.s = -1;
      } else {
        if (i2 === 43) v = v.slice(1);
        x.s = 1;
      }
      return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
    }
    if (t === "bigint") {
      if (v < 0) {
        v = -v;
        x.s = -1;
      } else {
        x.s = 1;
      }
      return parseDecimal(x, v.toString());
    }
    throw Error(invalidArgument + v);
  }
  Decimal2.prototype = P;
  Decimal2.ROUND_UP = 0;
  Decimal2.ROUND_DOWN = 1;
  Decimal2.ROUND_CEIL = 2;
  Decimal2.ROUND_FLOOR = 3;
  Decimal2.ROUND_HALF_UP = 4;
  Decimal2.ROUND_HALF_DOWN = 5;
  Decimal2.ROUND_HALF_EVEN = 6;
  Decimal2.ROUND_HALF_CEIL = 7;
  Decimal2.ROUND_HALF_FLOOR = 8;
  Decimal2.EUCLID = 9;
  Decimal2.config = Decimal2.set = config;
  Decimal2.clone = clone;
  Decimal2.isDecimal = isDecimalInstance;
  Decimal2.abs = abs;
  Decimal2.acos = acos;
  Decimal2.acosh = acosh;
  Decimal2.add = add;
  Decimal2.asin = asin;
  Decimal2.asinh = asinh;
  Decimal2.atan = atan;
  Decimal2.atanh = atanh;
  Decimal2.atan2 = atan2;
  Decimal2.cbrt = cbrt;
  Decimal2.ceil = ceil;
  Decimal2.clamp = clamp;
  Decimal2.cos = cos;
  Decimal2.cosh = cosh;
  Decimal2.div = div;
  Decimal2.exp = exp;
  Decimal2.floor = floor;
  Decimal2.hypot = hypot;
  Decimal2.ln = ln;
  Decimal2.log = log;
  Decimal2.log10 = log10;
  Decimal2.log2 = log2;
  Decimal2.max = max;
  Decimal2.min = min;
  Decimal2.mod = mod;
  Decimal2.mul = mul;
  Decimal2.pow = pow;
  Decimal2.random = random;
  Decimal2.round = round;
  Decimal2.sign = sign;
  Decimal2.sin = sin;
  Decimal2.sinh = sinh;
  Decimal2.sqrt = sqrt;
  Decimal2.sub = sub;
  Decimal2.sum = sum;
  Decimal2.tan = tan;
  Decimal2.tanh = tanh;
  Decimal2.trunc = trunc;
  if (obj === void 0) obj = {};
  if (obj) {
    if (obj.defaults !== true) {
      ps = ["precision", "rounding", "toExpNeg", "toExpPos", "maxE", "minE", "modulo", "crypto"];
      for (i = 0; i < ps.length; ) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
    }
  }
  Decimal2.config(obj);
  return Decimal2;
}
function div(x, y) {
  return new this(x).div(y);
}
function exp(x) {
  return new this(x).exp();
}
function floor(x) {
  return finalise(x = new this(x), x.e + 1, 3);
}
function hypot() {
  var i, n, t = new this(0);
  external = false;
  for (i = 0; i < arguments.length; ) {
    n = new this(arguments[i++]);
    if (!n.d) {
      if (n.s) {
        external = true;
        return new this(1 / 0);
      }
      t = n;
    } else if (t.d) {
      t = t.plus(n.times(n));
    }
  }
  external = true;
  return t.sqrt();
}
function isDecimalInstance(obj) {
  return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
}
function ln(x) {
  return new this(x).ln();
}
function log(x, y) {
  return new this(x).log(y);
}
function log2(x) {
  return new this(x).log(2);
}
function log10(x) {
  return new this(x).log(10);
}
function max() {
  return maxOrMin(this, arguments, -1);
}
function min() {
  return maxOrMin(this, arguments, 1);
}
function mod(x, y) {
  return new this(x).mod(y);
}
function mul(x, y) {
  return new this(x).mul(y);
}
function pow(x, y) {
  return new this(x).pow(y);
}
function random(sd) {
  var d, e, k, n, i = 0, r = new this(1), rd = [];
  if (sd === void 0) sd = this.precision;
  else checkInt32(sd, 1, MAX_DIGITS);
  k = Math.ceil(sd / LOG_BASE);
  if (!this.crypto) {
    for (; i < k; ) rd[i++] = Math.random() * 1e7 | 0;
  } else if (crypto.getRandomValues) {
    d = crypto.getRandomValues(new Uint32Array(k));
    for (; i < k; ) {
      n = d[i];
      if (n >= 429e7) {
        d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
      } else {
        rd[i++] = n % 1e7;
      }
    }
  } else if (crypto.randomBytes) {
    d = crypto.randomBytes(k *= 4);
    for (; i < k; ) {
      n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 127) << 24);
      if (n >= 214e7) {
        crypto.randomBytes(4).copy(d, i);
      } else {
        rd.push(n % 1e7);
        i += 4;
      }
    }
    i = k / 4;
  } else {
    throw Error(cryptoUnavailable);
  }
  k = rd[--i];
  sd %= LOG_BASE;
  if (k && sd) {
    n = mathpow(10, LOG_BASE - sd);
    rd[i] = (k / n | 0) * n;
  }
  for (; rd[i] === 0; i--) rd.pop();
  if (i < 0) {
    e = 0;
    rd = [0];
  } else {
    e = -1;
    for (; rd[0] === 0; e -= LOG_BASE) rd.shift();
    for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;
    if (k < LOG_BASE) e -= LOG_BASE - k;
  }
  r.e = e;
  r.d = rd;
  return r;
}
function round(x) {
  return finalise(x = new this(x), x.e + 1, this.rounding);
}
function sign(x) {
  x = new this(x);
  return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
}
function sin(x) {
  return new this(x).sin();
}
function sinh(x) {
  return new this(x).sinh();
}
function sqrt(x) {
  return new this(x).sqrt();
}
function sub(x, y) {
  return new this(x).sub(y);
}
function sum() {
  var i = 0, args = arguments, x = new this(args[i]);
  external = false;
  for (; x.s && ++i < args.length; ) x = x.plus(args[i]);
  external = true;
  return finalise(x, this.precision, this.rounding);
}
function tan(x) {
  return new this(x).tan();
}
function tanh(x) {
  return new this(x).tanh();
}
function trunc(x) {
  return finalise(x = new this(x), x.e + 1, 1);
}
P[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = P.toString;
P[Symbol.toStringTag] = "Decimal";
var Decimal = P.constructor = clone(DEFAULTS);
LN10 = new Decimal(LN10);
PI = new Decimal(PI);
var decimal_default = Decimal;

// src/lib/china-tax.ts
var ANNUAL_BRACKETS = [
  { threshold: 0, rate: 0.03, quickDeduction: 0 },
  { threshold: 36e3, rate: 0.1, quickDeduction: 2520 },
  { threshold: 144e3, rate: 0.2, quickDeduction: 16920 },
  { threshold: 3e5, rate: 0.25, quickDeduction: 31920 },
  { threshold: 42e4, rate: 0.3, quickDeduction: 52920 },
  { threshold: 66e4, rate: 0.35, quickDeduction: 85920 },
  { threshold: 96e4, rate: 0.45, quickDeduction: 181920 }
];
var MONTHLY_BONUS_BRACKETS = [
  { threshold: 0, rate: 0.03, quickDeduction: 0 },
  { threshold: 3e3, rate: 0.1, quickDeduction: 210 },
  { threshold: 12e3, rate: 0.2, quickDeduction: 1410 },
  { threshold: 25e3, rate: 0.25, quickDeduction: 2660 },
  { threshold: 35e3, rate: 0.3, quickDeduction: 4410 },
  { threshold: 55e3, rate: 0.35, quickDeduction: 7160 },
  { threshold: 8e4, rate: 0.45, quickDeduction: 15160 }
];
var BASIC_DEDUCTION_ANNUAL = 6e4;
var BONUS_BLIND_THRESHOLDS = [36e3, 144e3, 3e5, 42e4, 66e4, 96e4];
function bracketFor(taxable, brackets) {
  let b = brackets[0];
  for (const x of brackets) {
    if (taxable > x.threshold) b = x;
  }
  return b;
}
function progressiveTax(taxable, brackets) {
  if (!(taxable > 0)) {
    return { tax: 0, rate: 0, quickDeduction: 0 };
  }
  const b = bracketFor(taxable, brackets);
  const raw = new decimal_default(taxable).times(b.rate).minus(b.quickDeduction).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  return {
    tax: Math.max(0, raw),
    rate: b.rate,
    quickDeduction: b.quickDeduction
  };
}
function calcIncomeTaxAnnual(input) {
  const taxable = new decimal_default(input.annualGross).minus(BASIC_DEDUCTION_ANNUAL).minus(input.annualSocialInsurance || 0).minus(input.annualSpecialAddition || 0).minus(input.annualOtherDeduction || 0).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  const { tax, rate, quickDeduction } = progressiveTax(taxable, ANNUAL_BRACKETS);
  const afterTaxAnnual = new decimal_default(input.annualGross).minus(input.annualSocialInsurance || 0).minus(tax).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  const afterTaxMonthly = new decimal_default(afterTaxAnnual).div(12).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  const effectiveRate = input.annualGross > 0 ? new decimal_default(tax).div(input.annualGross).toNumber() : 0;
  return {
    taxableIncome: Math.max(0, taxable),
    tax,
    rate,
    quickDeduction,
    afterTaxAnnual,
    afterTaxMonthly,
    effectiveRate
  };
}
function calcBonusTaxSeparate(bonus) {
  const monthly = new decimal_default(bonus).div(12).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  const b = bracketFor(monthly, MONTHLY_BONUS_BRACKETS);
  const tax = Math.max(
    0,
    new decimal_default(bonus).times(b.rate).minus(b.quickDeduction).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber()
  );
  const rate = b.rate;
  const quickDeduction = b.quickDeduction;
  const net = new decimal_default(bonus).minus(tax).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  const monthlyNet = new decimal_default(net).div(12).toDecimalPlaces(2, decimal_default.ROUND_HALF_UP).toNumber();
  let blindSpot = false;
  let blindNote;
  for (const t of BONUS_BLIND_THRESHOLDS) {
    if (bonus > t && bonus <= t + 1) {
      blindSpot = true;
      blindNote = `\u5956\u91D1 ${t.toLocaleString("zh-CN")} \u5143\u662F\u7A0E\u7387\u8DF3\u6863\u4E34\u754C\u70B9\uFF1A\u591A\u53D1 1 \u5143\uFF08${(t + 1).toLocaleString("zh-CN")} \u5143\uFF09\u56E0\u7A0E\u7387\u8DF3\u6863\uFF0C\u5230\u624B\u53CD\u800C\u66F4\u5C11\u3002\u5EFA\u8BAE\u5361\u5728\u4E34\u754C\u503C\u6216\u53D1\u8DB3\u4E0B\u4E00\u6863\u3002`;
      break;
    }
  }
  return { tax, rate, quickDeduction, net, monthlyNet, blindSpot, blindNote };
}
function compareBonus(bonus, comprehensiveTaxable) {
  const separateTax = calcBonusTaxSeparate(bonus).tax;
  const baseTax = progressiveTax(comprehensiveTaxable, ANNUAL_BRACKETS).tax;
  const mergedTotalTax = progressiveTax(comprehensiveTaxable + bonus, ANNUAL_BRACKETS).tax;
  const mergedIncrementalTax = Math.max(0, mergedTotalTax - baseTax);
  let better = "equal";
  if (Math.abs(separateTax - mergedIncrementalTax) < 5e-3) better = "equal";
  else if (separateTax < mergedIncrementalTax) better = "separate";
  else better = "merged";
  return {
    separateTax,
    mergedIncrementalTax,
    better,
    diff: Math.abs(separateTax - mergedIncrementalTax)
  };
}
var CHINA_TAX_META = {
  basicDeductionMonthly: BASIC_DEDUCTION_ANNUAL / 12,
  basicDeductionAnnual: BASIC_DEDUCTION_ANNUAL,
  note: "\u53E3\u5F84\u622A\u81F3 2026 \u5E74\uFF1A\u7EFC\u5408\u6240\u5F97\u57FA\u672C\u51CF\u9664 6 \u4E07/\u5E74\uFF1B\u5168\u5E74\u4E00\u6B21\u6027\u5956\u91D1\u5355\u72EC\u8BA1\u7A0E\u653F\u7B56\u5EF6\u7EED\u81F3 2027-12-31\u3002\u672C\u5DE5\u5177\u4E3A\u4F30\u7B97\u53C2\u8003\uFF0C\u5B9E\u9645\u4EE5\u7A0E\u52A1\u673A\u5173\u6C47\u7B97\u4E3A\u51C6\u3002"
};

// src/lib/china-social-security.ts
var DEFAULT_SS_RATES = {
  pension: { personal: 8, employer: 16 },
  medical: { personal: 2, employer: 8 },
  unemployment: { personal: 0.5, employer: 0.5 },
  injury: { personal: 0, employer: 0.4 },
  maternity: { personal: 0, employer: 0.8 },
  housingFund: { personal: 12, employer: 12 }
};
var SS_LABELS = {
  pension: "\u517B\u8001\u4FDD\u9669",
  medical: "\u533B\u7597\u4FDD\u9669",
  unemployment: "\u5931\u4E1A\u4FDD\u9669",
  injury: "\u5DE5\u4F24\u4FDD\u9669",
  maternity: "\u751F\u80B2\u4FDD\u9669",
  housingFund: "\u4F4F\u623F\u516C\u79EF\u91D1"
};
var ROUND = decimal_default.ROUND_HALF_UP;
function round2(n) {
  return n.toDecimalPlaces(2, ROUND).toNumber();
}
function calcSocialSecurity(input) {
  const rates = input.rates ?? DEFAULT_SS_RATES;
  const housingEnabled = input.housingFundEnabled ?? true;
  let applied = new decimal_default(input.base || 0);
  const floor2 = input.baseFloor ?? 0;
  const ceil2 = input.baseCeil ?? Infinity;
  let clamped = false;
  if (applied.lt(floor2)) {
    applied = new decimal_default(floor2);
    clamped = true;
  }
  if (ceil2 !== Infinity && applied.gt(ceil2)) {
    applied = new decimal_default(ceil2);
    clamped = true;
  }
  const baseApplied = round2(applied);
  const keys = [
    "pension",
    "medical",
    "unemployment",
    "injury",
    "maternity",
    "housingFund"
  ];
  const items = [];
  let personalTotal = new decimal_default(0);
  let employerTotal = new decimal_default(0);
  for (const k of keys) {
    if (k === "housingFund" && !housingEnabled) continue;
    const r = rates[k];
    const p = applied.times(r.personal).div(100);
    const e = applied.times(r.employer).div(100);
    personalTotal = personalTotal.plus(p);
    employerTotal = employerTotal.plus(e);
    items.push({
      key: k,
      label: SS_LABELS[k],
      personal: round2(p),
      employer: round2(e)
    });
  }
  const personalTotalN = round2(personalTotal);
  const employerTotalN = round2(employerTotal);
  const combined = round2(personalTotal.plus(employerTotal));
  const personalRatePct = baseApplied > 0 ? round2(personalTotal.div(baseApplied).times(100)) : 0;
  return {
    baseApplied,
    clamped,
    items,
    personalTotal: personalTotalN,
    employerTotal: employerTotalN,
    combined,
    personalRatePct
  };
}

// src/lib/china-vat.ts
var ROUND2 = decimal_default.ROUND_HALF_UP;
function r2(n) {
  return n.toDecimalPlaces(2, ROUND2).toNumber();
}
function calcGeneralVat(i) {
  const output = new decimal_default(i.salesAmount || 0).times(i.salesRate || 0).div(100);
  const input = new decimal_default(i.purchaseAmount || 0).times(i.purchaseRate || 0).div(100);
  const net = output.minus(input);
  const payable = net.gt(0) ? r2(net) : 0;
  const carryForward = net.lt(0) ? r2(net.negated()) : 0;
  return {
    outputTax: r2(output),
    inputTax: r2(input),
    net: r2(net),
    payable,
    carryForward
  };
}
function calcSimpleVat(i) {
  const tax = new decimal_default(i.salesAmount || 0).times(i.levyRate || 0).div(100);
  return { tax: r2(tax) };
}

// src/lib/mortgage.ts
var ROUND3 = decimal_default.ROUND_HALF_UP;
function r22(n) {
  return n.toDecimalPlaces(2, ROUND3).toNumber();
}
function equalPaymentMonthly(principal, annualRatePct, periods) {
  const P2 = new decimal_default(principal);
  const m = new decimal_default(annualRatePct).div(100).div(12);
  if (m.eq(0)) return r22(P2.div(periods));
  const f = m.plus(1).pow(periods);
  const M = P2.times(m).times(f).div(f.minus(1));
  return r22(M);
}
function buildSchedule(principal, annualRatePct, periods, method) {
  const P2 = new decimal_default(principal);
  const m = new decimal_default(annualRatePct).div(100).div(12);
  const schedule = [];
  let balance = P2;
  let totalInterest = new decimal_default(0);
  let totalPayment = new decimal_default(0);
  if (method === "equal-payment") {
    const M = new decimal_default(equalPaymentMonthly(principal, annualRatePct, periods));
    for (let k = 1; k <= periods; k++) {
      const interest = balance.times(m);
      let principalPart = M.minus(interest);
      if (k === periods) principalPart = balance;
      const payment = principalPart.plus(interest);
      balance = balance.minus(principalPart);
      if (balance.lt(0)) balance = new decimal_default(0);
      totalInterest = totalInterest.plus(interest);
      totalPayment = totalPayment.plus(payment);
      schedule.push({
        period: k,
        payment: r22(payment),
        principalPart: r22(principalPart),
        interestPart: r22(interest),
        balance: r22(balance)
      });
    }
    return {
      method,
      monthly: r22(M),
      totalInterest: r22(totalInterest),
      totalPayment: r22(totalPayment),
      schedule
    };
  }
  const perPrincipal = P2.div(periods);
  let firstMonthly = null;
  let monthlyDecrease = null;
  for (let k = 1; k <= periods; k++) {
    let principalPart = perPrincipal;
    if (k === periods) principalPart = balance;
    const interest = balance.times(m);
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new decimal_default(0);
    if (firstMonthly === null) firstMonthly = payment;
    else if (monthlyDecrease === null && k === 2) monthlyDecrease = firstMonthly.minus(payment);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r22(payment),
      principalPart: r22(principalPart),
      interestPart: r22(interest),
      balance: r22(balance)
    });
  }
  return {
    method,
    firstMonthly: firstMonthly ? r22(firstMonthly) : 0,
    monthlyDecrease: monthlyDecrease ? r22(monthlyDecrease) : 0,
    totalInterest: r22(totalInterest),
    totalPayment: r22(totalPayment),
    schedule
  };
}
function buildKeepPayment(principal, annualRatePct, monthlyPayment) {
  const m = new decimal_default(annualRatePct).div(100).div(12);
  const M = new decimal_default(monthlyPayment);
  let balance = new decimal_default(principal);
  const schedule = [];
  let totalInterest = new decimal_default(0);
  let totalPayment = new decimal_default(0);
  let k = 0;
  while (balance.gt(0) && k < 12e3) {
    k++;
    const interest = balance.times(m);
    let principalPart = M.minus(interest);
    if (principalPart.gte(balance)) principalPart = balance;
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new decimal_default(0);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r22(payment),
      principalPart: r22(principalPart),
      interestPart: r22(interest),
      balance: r22(balance)
    });
  }
  return {
    method: "equal-payment",
    monthly: r22(M),
    totalInterest: r22(totalInterest),
    totalPayment: r22(totalPayment),
    schedule
  };
}
function buildKeepPrincipal(principal, annualRatePct, perPrincipal) {
  const m = new decimal_default(annualRatePct).div(100).div(12);
  const pp = new decimal_default(perPrincipal);
  let balance = new decimal_default(principal);
  const schedule = [];
  let totalInterest = new decimal_default(0);
  let totalPayment = new decimal_default(0);
  let firstMonthly = null;
  let monthlyDecrease = null;
  let k = 0;
  while (balance.gt(0) && k < 12e3) {
    k++;
    let principalPart = pp;
    if (principalPart.gte(balance)) principalPart = balance;
    const interest = balance.times(m);
    const payment = principalPart.plus(interest);
    balance = balance.minus(principalPart);
    if (balance.lt(0)) balance = new decimal_default(0);
    if (firstMonthly === null) firstMonthly = payment;
    else if (monthlyDecrease === null && k === 2) monthlyDecrease = firstMonthly.minus(payment);
    totalInterest = totalInterest.plus(interest);
    totalPayment = totalPayment.plus(payment);
    schedule.push({
      period: k,
      payment: r22(payment),
      principalPart: r22(principalPart),
      interestPart: r22(interest),
      balance: r22(balance)
    });
  }
  return {
    method: "equal-principal",
    firstMonthly: firstMonthly ? r22(firstMonthly) : 0,
    monthlyDecrease: monthlyDecrease ? r22(monthlyDecrease) : 0,
    totalInterest: r22(totalInterest),
    totalPayment: r22(totalPayment),
    schedule
  };
}
function calcEarlyRepayment(i) {
  const full = buildSchedule(i.principal, i.annualRatePct, i.periods, i.method);
  const k = Math.min(Math.max(0, Math.floor(i.paidPeriods)), i.periods);
  let paidPrincipal = new decimal_default(0);
  let paidInterest = new decimal_default(0);
  for (let p = 0; p < k; p++) {
    paidPrincipal = paidPrincipal.plus(full.schedule[p].principalPart);
    paidInterest = paidInterest.plus(full.schedule[p].interestPart);
  }
  const remainingBefore = k > 0 ? new decimal_default(full.schedule[k - 1].balance) : new decimal_default(i.principal);
  const newPrincipal = remainingBefore.minus(i.prepayAmount);
  if (newPrincipal.lt(0)) {
    throw new Error("\u63D0\u524D\u8FD8\u6B3E\u91D1\u989D\u8D85\u8FC7\u5269\u4F59\u672C\u91D1");
  }
  const remainingPeriods = Math.max(1, i.periods - k);
  let originalRemainingInterest = new decimal_default(0);
  for (let p = k; p < full.schedule.length; p++) {
    originalRemainingInterest = originalRemainingInterest.plus(full.schedule[p].interestPart);
  }
  let newSchedule;
  let newPeriods;
  if (i.mode === "reduce") {
    newSchedule = buildSchedule(newPrincipal.toNumber(), i.annualRatePct, remainingPeriods, i.method);
    newPeriods = remainingPeriods;
  } else {
    if (i.method === "equal-payment") {
      const M = new decimal_default(equalPaymentMonthly(i.principal, i.annualRatePct, i.periods));
      newSchedule = buildKeepPayment(newPrincipal.toNumber(), i.annualRatePct, M.toNumber());
    } else {
      const perPrincipal = new decimal_default(i.principal).div(i.periods);
      newSchedule = buildKeepPrincipal(newPrincipal.toNumber(), i.annualRatePct, perPrincipal.toNumber());
    }
    newPeriods = newSchedule.schedule.length;
  }
  const savedInterest = originalRemainingInterest.minus(newSchedule.totalInterest);
  return {
    originalMonthly: full.monthly,
    originalFirstMonthly: full.firstMonthly,
    paidPrincipal: r22(paidPrincipal),
    paidInterest: r22(paidInterest),
    remainingBeforePrepay: r22(remainingBefore),
    newPrincipal: r22(newPrincipal),
    prepayAmount: i.prepayAmount,
    newMonthly: newSchedule.monthly,
    newFirstMonthly: newSchedule.firstMonthly,
    newPeriods,
    newTotalInterest: newSchedule.totalInterest,
    originalRemainingInterest: r22(originalRemainingInterest),
    savedInterest: r22(savedInterest),
    newTotalPayment: newSchedule.totalPayment
  };
}

// src/lib/china-calc-extra.ts
var RETIREMENT_RULES = {
  male: { baseAge: 60, targetAge: 63, baselineY: 1965, baselineM: 1, stepMonths: 4 },
  "female-cadre": { baseAge: 55, targetAge: 58, baselineY: 1970, baselineM: 1, stepMonths: 4 },
  "female-worker": { baseAge: 50, targetAge: 55, baselineY: 1975, baselineM: 1, stepMonths: 2 }
};
function monthNum(y, m) {
  return y * 12 + (m - 1);
}
function calcRetirementAge(birthYear, birthMonth, category = "male") {
  if (birthYear < 1940 || birthYear > 2010)
    return { error: "\u51FA\u751F\u5E74\u4EFD\u9700\u5728 1940\u20132010 \u4E4B\u95F4" };
  if (birthMonth < 1 || birthMonth > 12)
    return { error: "\u6708\u4EFD\u9700\u5728 1\u201312 \u4E4B\u95F4" };
  const rule = RETIREMENT_RULES[category];
  const birth = monthNum(birthYear, birthMonth);
  const base = monthNum(rule.baselineY, rule.baselineM);
  const diff = birth - base;
  let delayMonths = 0;
  if (diff > 0) delayMonths = Math.floor(diff / rule.stepMonths);
  const maxDelay = (rule.targetAge - rule.baseAge) * 12;
  delayMonths = Math.min(delayMonths, maxDelay);
  const retireAgeMonths = rule.baseAge * 12 + delayMonths;
  const retireAgeYears = Math.floor(retireAgeMonths / 12);
  const retireAgeExtra = retireAgeMonths % 12;
  const retireTotal = birth + retireAgeMonths;
  const ry = Math.floor(retireTotal / 12);
  const rm = retireTotal % 12 + 1;
  return {
    category,
    baseAge: rule.baseAge,
    targetAge: rule.targetAge,
    retireAgeYears,
    retireAgeExtra,
    delayMonths,
    retireYear: ry,
    retireMonth: rm,
    changed: delayMonths > 0
  };
}
var SALARY_BRACKETS = [
  { upper: 36e3, rate: 0.03, quick: 0 },
  { upper: 144e3, rate: 0.1, quick: 2520 },
  { upper: 3e5, rate: 0.2, quick: 16920 },
  { upper: 42e4, rate: 0.25, quick: 31920 },
  { upper: 66e4, rate: 0.3, quick: 52920 },
  { upper: 96e4, rate: 0.35, quick: 85920 },
  { upper: Infinity, rate: 0.45, quick: 181920 }
];
function taxOf(taxable) {
  if (taxable <= 0) return { tax: 0, rate: 0, quick: 0 };
  for (const b of SALARY_BRACKETS) {
    if (taxable <= b.upper) return { tax: taxable * b.rate - b.quick, rate: b.rate, quick: b.quick };
  }
  return { tax: 0, rate: 0, quick: 0 };
}
function fromGross(monthlyGross, monthlySocial, monthlySpecial) {
  const annualGross = monthlyGross * 12;
  const annualSocial = monthlySocial * 12;
  const annualSpecial = monthlySpecial * 12;
  const taxable = annualGross - 6e4 - annualSocial - annualSpecial;
  const { tax, rate } = taxOf(taxable);
  const finalTax = Math.max(0, tax);
  const afterTaxAnnual = annualGross - annualSocial - finalTax;
  return {
    annualGross,
    annualSocial,
    taxable,
    rate,
    annualTax: finalTax,
    monthlyTax: finalTax / 12,
    afterTaxMonthly: afterTaxAnnual / 12,
    afterTaxAnnual
  };
}
function reverseGross(targetNet, monthlySocial, monthlySpecial) {
  let lo = Math.max(0, targetNet - monthlySocial);
  let hi = targetNet * 4 + 1e5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const net = fromGross(mid, monthlySocial, monthlySpecial).afterTaxMonthly;
    if (net < targetNet) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
function calcAfterTaxSalary(params) {
  const { mode } = params;
  const social = params.monthlySocial ?? 0;
  const special = params.monthlySpecial ?? 0;
  if (social < 0 || special < 0)
    return { error: "\u4E09\u9669\u4E00\u91D1 / \u4E13\u9879\u9644\u52A0\u4E0D\u80FD\u4E3A\u8D1F" };
  if (mode === "forward") {
    const g2 = params.monthlyGross ?? 0;
    if (g2 < 0) return { error: "\u7A0E\u524D\u5DE5\u8D44\u4E0D\u80FD\u4E3A\u8D1F" };
    return { ...fromGross(g2, social, special), mode: "forward" };
  }
  const n = params.monthlyNet ?? 0;
  if (n < 0) return { error: "\u7A0E\u540E\u5DE5\u8D44\u4E0D\u80FD\u4E3A\u8D1F" };
  const g = reverseGross(n, social, special);
  const fwd = fromGross(g, social, special);
  return { ...fwd, mode: "reverse", netTarget: n };
}
function calcDepositInterest(params) {
  const { principal: p, annualRatePct: r, years: y } = params;
  const mode = params.mode ?? "compound";
  if (p < 0) return { error: "\u672C\u91D1\u4E0D\u80FD\u4E3A\u8D1F" };
  if (r < 0) return { error: "\u5229\u7387\u4E0D\u80FD\u4E3A\u8D1F" };
  if (y <= 0) return { error: "\u5B58\u671F\u9700\u5927\u4E8E 0" };
  const annualRate = r / 100;
  let interest;
  let monthly = 0;
  if (mode === "once") {
    interest = p * annualRate * y;
  } else if (mode === "compound") {
    interest = p * (Math.pow(1 + annualRate, y) - 1);
  } else {
    monthly = p * annualRate / 12;
    interest = monthly * y * 12;
  }
  const total = p + interest;
  return { principal: p, annualRatePct: r, years: y, mode, interest, total, monthlyInterest: monthly };
}
function calcDeedTax(params) {
  const { priceWan, area, tier } = params;
  const inclusive = params.vatInclusive ?? false;
  if (priceWan <= 0) return { error: "\u6210\u4EA4\u4EF7\u683C\u9700\u5927\u4E8E 0" };
  if (area <= 0) return { error: "\u9762\u79EF\u9700\u5927\u4E8E 0" };
  const totalPrice = priceWan * 1e4;
  const base = inclusive ? totalPrice / 1.05 : totalPrice;
  const small = area <= 90;
  let rate;
  if (tier === "first") rate = small ? 0.01 : 0.015;
  else if (tier === "second") rate = small ? 0.01 : 0.02;
  else rate = 0.03;
  const tax = base * rate;
  return { totalPrice, taxableBase: base, rate, tax, area, tier, vatInclusive: inclusive };
}
function calcOvertimePay(params) {
  const { monthlySalary: s } = params;
  const wd = params.weekdayHours ?? 0;
  const rs = params.restDayHours ?? 0;
  const hd = params.holidayHours ?? 0;
  if (s <= 0) return { error: "\u6708\u5DE5\u8D44\u9700\u5927\u4E8E 0" };
  if (wd < 0 || rs < 0 || hd < 0) return { error: "\u52A0\u73ED\u5C0F\u65F6\u4E0D\u80FD\u4E3A\u8D1F" };
  const dayWage = s / 21.75;
  const hourWage = dayWage / 8;
  const weekdayPay = hourWage * 1.5 * wd;
  const restPay = hourWage * 2 * rs;
  const holidayPay = hourWage * 3 * hd;
  const total = weekdayPay + restPay + holidayPay;
  return {
    monthlySalary: s,
    dayWage,
    hourWage,
    weekdayHours: wd,
    restDayHours: rs,
    holidayHours: hd,
    weekdayPay,
    restPay,
    holidayPay,
    overtimeTotal: total,
    totalWithSalary: s + total
  };
}
var PENSION_MONTHS = {
  "50": 195,
  "55": 170,
  "60": 139,
  "65": 101
};
function calcPensionEstimate(params) {
  const { retireAge, avgWage: w, index: idx, years: y, personalBalance: b } = params;
  if (w <= 0 || idx <= 0 || y <= 0)
    return { error: "\u793E\u5E73\u5DE5\u8D44\u3001\u7F34\u8D39\u6307\u6570\u3001\u7F34\u8D39\u5E74\u9650\u9700\u5927\u4E8E 0" };
  if (b < 0) return { error: "\u4E2A\u4EBA\u8D26\u6237\u50A8\u5B58\u989D\u4E0D\u5C0F\u4E8E 0" };
  const months = PENSION_MONTHS[retireAge];
  const basePension = w * ((1 + idx) / 2) * y * 0.01;
  const personalPension = b / months;
  const monthly = basePension + personalPension;
  const annual = monthly * 12;
  const replacement = monthly / (w * idx || 1);
  return {
    retireAge,
    months,
    avgWage: w,
    index: idx,
    years: y,
    personalBalance: b,
    basePension,
    personalPension,
    monthlyPension: monthly,
    annualPension: annual,
    replacementRate: replacement
  };
}

// mcp/server.mjs
var PORT = Number(process.env.MCP_PORT || 18700);
var SERVER_NAME = "mokakit-mcp";
var SERVER_VERSION = "0.1.0";
var API_VERSION = "v1";
var SUPPORTED_PROTOCOLS = ["2025-06-18", "2024-11-05"];
var REQUIRED_TOKEN = process.env.MCP_TOKEN || "";
function getCatalog() {
  try {
    const p = new URL("./catalog.json", import.meta.url);
    if (existsSync(p)) return JSON.parse(readFileSync2(p, "utf8"));
  } catch {
  }
  return loadAllMeta();
}
var { tools: CATALOG, errors: META_ERRORS } = getCatalog();
var META_BY_ID = new Map(CATALOG.map((t) => [t.id, t]));
var CONCRETE_BY_ID = {
  "income-tax-cn": "income_tax_cn",
  "bonus-tax-cn": "bonus_tax_cn",
  "social-security-cn": "social_security_cn",
  "vat-calc": "vat_general_cn",
  "mortgage-early-repayment": "mortgage_early_repayment_cn",
  "fund-loan-calc": "mortgage_schedule_cn",
  "retirement-age": "retirement_age_cn",
  "after-tax-salary": "after_tax_salary_cn",
  "deposit-interest": "deposit_interest_cn",
  "deed-tax": "deed_tax_cn",
  "overtime-pay": "overtime_pay_cn",
  "pension-estimate": "pension_estimate_cn"
};
function desc(id, fallback) {
  const m = META_BY_ID.get(id);
  return m && m.description ? m.description : fallback;
}
function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function searchCatalog(query, limit = 8) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return CATALOG.map((t) => {
    const hay = [t.name, t.description, t.tagline, ...t.keywords, ...t.tags, t.id, t.category].join(" ").toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      if (t.name.toLowerCase().includes(tk)) score += 5;
      if (t.id.toLowerCase().includes(tk)) score += 3;
      if (hay.includes(tk)) score += 1;
    }
    return { t, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => ({
    id: x.t.id,
    name: x.t.name,
    description: x.t.description,
    category: x.t.category,
    url: x.t.url,
    mcpTool: CONCRETE_BY_ID[x.t.id] || null
  }));
}
var COMPUTE_TOOLS = [
  {
    name: "income_tax_cn",
    description: desc(
      "income-tax-cn",
      "\u4E2D\u56FD\u7EFC\u5408\u6240\u5F97\uFF08\u5DE5\u8D44\u85AA\u91D1\uFF09\u5E74\u5EA6\u4E2A\u7A0E\u8BA1\u7B97\u3002\u8F93\u5165\u5E74\u7A0E\u524D\u6536\u5165\u3001\u4E09\u9669\u4E00\u91D1\u3001\u4E13\u9879\u9644\u52A0\u6263\u9664\u3001\u5176\u4ED6\u6263\u9664\uFF0C\u8F93\u51FA\u5E94\u7EB3\u7A0E\u6240\u5F97\u989D\u3001\u7A0E\u989D\u3001\u7A0E\u7387\u3001\u5230\u624B\u5E74\u6536\u5165/\u6708\u6536\u5165\u3001\u5B9E\u9645\u7A0E\u8D1F\u7387\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        annualGross: { type: "number", description: "\u5E74\u7A0E\u524D\u6536\u5165\uFF08\u5143\uFF09" },
        annualSocialInsurance: { type: "number", description: "\u5168\u5E74\u4E09\u9669\u4E00\u91D1\u4E2A\u4EBA\u7F34\u7EB3\u5408\u8BA1\uFF08\u5143\uFF09", default: 0 },
        annualSpecialAddition: { type: "number", description: "\u5168\u5E74\u4E13\u9879\u9644\u52A0\u6263\u9664\u5408\u8BA1\uFF08\u5143\uFF09", default: 0 },
        annualOtherDeduction: { type: "number", description: "\u5168\u5E74\u5176\u4ED6\u4F9D\u6CD5\u6263\u9664\uFF08\u5143\uFF09", default: 0 }
      },
      required: ["annualGross"]
    },
    handler: (a) => calcIncomeTaxAnnual({
      annualGross: num(a.annualGross),
      annualSocialInsurance: num(a.annualSocialInsurance, 0),
      annualSpecialAddition: num(a.annualSpecialAddition, 0),
      annualOtherDeduction: num(a.annualOtherDeduction, 0)
    })
  },
  {
    name: "bonus_tax_cn",
    description: desc(
      "bonus-tax-cn",
      "\u4E2D\u56FD\u5168\u5E74\u4E00\u6B21\u6027\u5956\u91D1\u5355\u72EC\u8BA1\u7A0E\uFF082024-2027 \u5EF6\u7EED\u653F\u7B56\uFF09\u3002\u8F93\u5165\u5956\u91D1\u91D1\u989D\uFF0C\u8F93\u51FA\u7A0E\u989D\u3001\u7A0E\u7387\u3001\u5230\u624B\u91D1\u989D\uFF0C\u5E76\u63D0\u793A\u7A0E\u7387\u8DF3\u6863\u76F2\u533A\uFF08\u591A\u53D1 1 \u5143\u5230\u624B\u53CD\u800C\u66F4\u5C11\uFF09\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        bonus: { type: "number", description: "\u5168\u5E74\u4E00\u6B21\u6027\u5956\u91D1\u91D1\u989D\uFF08\u5143\uFF09" }
      },
      required: ["bonus"]
    },
    handler: (a) => calcBonusTaxSeparate(num(a.bonus))
  },
  {
    name: "bonus_compare_cn",
    description: desc(
      "bonus-tax-cn",
      "\u5E74\u7EC8\u5956\u300C\u5355\u72EC\u8BA1\u7A0E vs \u5E76\u5165\u7EFC\u5408\u6240\u5F97\u300D\u5BF9\u6BD4\u3002\u8F93\u5165\u5956\u91D1\u91D1\u989D\u4E0E\u5F53\u5E74\u7EFC\u5408\u6240\u5F97\u5E94\u7EB3\u7A0E\u6240\u5F97\u989D\uFF0C\u8F93\u51FA\u4E24\u79CD\u65B9\u6848\u7A0E\u989D\u4E0E\u66F4\u4F18\u65B9\u6848\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        bonus: { type: "number", description: "\u5168\u5E74\u4E00\u6B21\u6027\u5956\u91D1\u91D1\u989D\uFF08\u5143\uFF09" },
        comprehensiveTaxable: {
          type: "number",
          description: "\u5F53\u5E74\u7EFC\u5408\u6240\u5F97\u5E94\u7EB3\u7A0E\u6240\u5F97\u989D\uFF08\u5DF2\u6263\u57FA\u672C\u51CF\u9664/\u4E09\u9669\u4E00\u91D1/\u4E13\u9879\u9644\u52A0\u540E\u7684\u91D1\u989D\uFF0C\u5143\uFF09"
        }
      },
      required: ["bonus", "comprehensiveTaxable"]
    },
    handler: (a) => compareBonus(num(a.bonus), num(a.comprehensiveTaxable))
  },
  {
    name: "social_security_cn",
    description: desc(
      "social-security-cn",
      "\u4E2D\u56FD\u4E94\u9669\u4E00\u91D1\u8BA1\u7B97\u3002\u8F93\u5165\u7F34\u8D39\u57FA\u6570\uFF08\u53EF\u542B\u4E0A\u4E0B\u9650\u5939\u53D6\u4E0E\u81EA\u5B9A\u4E49\u8D39\u7387\uFF09\uFF0C\u8F93\u51FA\u5404\u9879\u4E2A\u4EBA/\u5355\u4F4D\u7F34\u7EB3\u989D\u53CA\u5408\u8BA1\u3002\u9ED8\u8BA4\u91C7\u7528\u5168\u56FD\u901A\u7528\u53C2\u8003\u8D39\u7387\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        base: { type: "number", description: "\u7F34\u8D39\u57FA\u6570\uFF08\u5143/\u6708\uFF09" },
        baseFloor: { type: "number", description: "\u57FA\u6570\u4E0B\u9650\uFF08\u5143/\u6708\uFF09\uFF0C\u4E0D\u4F20\u8868\u793A\u4E0D\u9650\u5236" },
        baseCeil: { type: "number", description: "\u57FA\u6570\u4E0A\u9650\uFF08\u5143/\u6708\uFF09\uFF0C\u4E0D\u4F20\u8868\u793A\u4E0D\u9650\u5236" },
        housingFundEnabled: { type: "boolean", description: "\u662F\u5426\u8BA1\u7B97\u4F4F\u623F\u516C\u79EF\u91D1\uFF0C\u9ED8\u8BA4 true" },
        rates: {
          type: "object",
          description: "\u81EA\u5B9A\u4E49\u8D39\u7387\uFF08\u53EF\u9009\uFF09\u3002\u7ED3\u6784\uFF1A{ pension:{personal,employer}, medical:{...}, unemployment:{...}, injury:{...}, maternity:{...}, housingFund:{...} }\uFF0C\u8D39\u7387\u4E3A\u767E\u5206\u6570",
          additionalProperties: true
        }
      },
      required: ["base"]
    },
    handler: (a) => calcSocialSecurity({
      base: num(a.base),
      baseFloor: a.baseFloor != null ? num(a.baseFloor) : void 0,
      baseCeil: a.baseCeil != null ? num(a.baseCeil) : void 0,
      housingFundEnabled: a.housingFundEnabled != null ? !!a.housingFundEnabled : void 0,
      rates: a.rates
    })
  },
  {
    name: "vat_general_cn",
    description: desc(
      "vat-calc",
      "\u4E2D\u56FD\u589E\u503C\u7A0E\u4E00\u822C\u8BA1\u7A0E\uFF08\u4E00\u822C\u7EB3\u7A0E\u4EBA\uFF09\uFF1A\u5E94\u7EB3\u7A0E\u989D = \u9500\u9879\u7A0E\u989D \u2212 \u8FDB\u9879\u7A0E\u989D\u3002\u8F93\u51FA\u9500\u9879\u3001\u8FDB\u9879\u3001\u51C0\u989D\u3001\u672C\u671F\u5E94\u7EB3\u4E0E\u7559\u62B5\u7A0E\u989D\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        salesAmount: { type: "number", description: "\u4E0D\u542B\u7A0E\u9500\u552E\u989D\uFF08\u5143\uFF09" },
        salesRate: { type: "number", description: "\u9500\u9879\u7A0E\u7387\uFF08%\uFF09\uFF0C\u5982 13 / 9 / 6" },
        purchaseAmount: { type: "number", description: "\u4E0D\u542B\u7A0E\u91C7\u8D2D\u989D\uFF08\u5143\uFF09" },
        purchaseRate: { type: "number", description: "\u8FDB\u9879\u7A0E\u7387\uFF08%\uFF09" }
      },
      required: ["salesAmount", "salesRate", "purchaseAmount", "purchaseRate"]
    },
    handler: (a) => calcGeneralVat({
      salesAmount: num(a.salesAmount),
      salesRate: num(a.salesRate),
      purchaseAmount: num(a.purchaseAmount),
      purchaseRate: num(a.purchaseRate)
    })
  },
  {
    name: "vat_simple_cn",
    description: desc(
      "vat-calc",
      "\u4E2D\u56FD\u589E\u503C\u7A0E\u7B80\u6613\u8BA1\u7A0E\uFF08\u5C0F\u89C4\u6A21\u7EB3\u7A0E\u4EBA/\u7279\u5B9A\u4E1A\u52A1\uFF09\uFF1A\u5E94\u7EB3\u7A0E\u989D = \u4E0D\u542B\u7A0E\u9500\u552E\u989D \xD7 \u5F81\u6536\u7387\u3002\u8F93\u51FA\u7A0E\u989D\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        salesAmount: { type: "number", description: "\u4E0D\u542B\u7A0E\u9500\u552E\u989D\uFF08\u5143\uFF09" },
        levyRate: { type: "number", description: "\u5F81\u6536\u7387\uFF08%\uFF09\uFF0C\u5982 3 / 1 / 5" }
      },
      required: ["salesAmount", "levyRate"]
    },
    handler: (a) => calcSimpleVat({ salesAmount: num(a.salesAmount), levyRate: num(a.levyRate) })
  },
  {
    name: "mortgage_schedule_cn",
    description: desc(
      "fund-loan-calc",
      "\u623F\u8D37\u8FD8\u6B3E\u8BA1\u5212\u8BA1\u7B97\uFF08\u5546\u8D37/\u516C\u79EF\u91D1\u8D37\uFF09\u3002\u652F\u6301\u7B49\u989D\u672C\u606F\u4E0E\u7B49\u989D\u672C\u91D1\u4E24\u79CD\u8FD8\u6B3E\u65B9\u5F0F\uFF0C\u8F93\u51FA\u6708\u4F9B\u3001\u603B\u5229\u606F\u3001\u603B\u8FD8\u6B3E\u989D\u53CA\u9010\u671F\u8FD8\u6B3E\u660E\u7EC6\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        principal: { type: "number", description: "\u8D37\u6B3E\u672C\u91D1\uFF08\u5143\uFF09" },
        annualRatePct: { type: "number", description: "\u5E74\u5229\u7387\uFF08%\uFF09\uFF0C\u5982 3.85" },
        periods: { type: "number", description: "\u8FD8\u6B3E\u603B\u671F\u6570\uFF08\u6708\uFF09" },
        method: { type: "string", enum: ["equal-payment", "equal-principal"], description: "equal-payment=\u7B49\u989D\u672C\u606F\uFF0Cequal-principal=\u7B49\u989D\u672C\u91D1" }
      },
      required: ["principal", "annualRatePct", "periods", "method"]
    },
    handler: (a) => buildSchedule(num(a.principal), num(a.annualRatePct), num(a.periods), a.method)
  },
  {
    name: "mortgage_early_repayment_cn",
    description: desc(
      "mortgage-early-repayment",
      "\u623F\u8D37\u63D0\u524D\u8FD8\u6B3E\u6D4B\u7B97\u3002\u8F93\u5165\u539F\u8D37\u6B3E\u4FE1\u606F\u4E0E\u672C\u6B21\u63D0\u524D\u8FD8\u6B3E\u91D1\u989D\uFF0C\u5BF9\u6BD4\u300C\u51CF\u5C11\u6708\u4F9B\u300D\u4E0E\u300C\u7F29\u77ED\u671F\u9650\u300D\u4E24\u79CD\u65B9\u6848\uFF0C\u8F93\u51FA\u8282\u7701\u5229\u606F\u4E0E\u65B0\u6708\u4F9B/\u65B0\u671F\u6570\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        principal: { type: "number", description: "\u539F\u8D37\u6B3E\u672C\u91D1\uFF08\u5143\uFF09" },
        annualRatePct: { type: "number", description: "\u539F\u5E74\u5229\u7387\uFF08%\uFF09" },
        periods: { type: "number", description: "\u539F\u8FD8\u6B3E\u603B\u671F\u6570\uFF08\u6708\uFF09" },
        method: { type: "string", enum: ["equal-payment", "equal-principal"], description: "\u539F\u8FD8\u6B3E\u65B9\u5F0F" },
        paidPeriods: { type: "number", description: "\u5DF2\u8FD8\u671F\u6570" },
        prepayAmount: { type: "number", description: "\u672C\u6B21\u63D0\u524D\u8FD8\u6B3E\u91D1\u989D\uFF08\u5143\uFF09" },
        mode: { type: "string", enum: ["reduce", "shorten"], description: "reduce=\u51CF\u5C11\u6708\u4F9B(\u671F\u9650\u4E0D\u53D8)\uFF0Cshorten=\u7F29\u77ED\u671F\u9650(\u6708\u4F9B\u4E0D\u53D8)" }
      },
      required: ["principal", "annualRatePct", "periods", "method", "paidPeriods", "prepayAmount", "mode"]
    },
    handler: (a) => calcEarlyRepayment({
      principal: num(a.principal),
      annualRatePct: num(a.annualRatePct),
      periods: num(a.periods),
      method: a.method,
      paidPeriods: num(a.paidPeriods),
      prepayAmount: num(a.prepayAmount),
      mode: a.mode
    })
  },
  {
    name: "retirement_age_cn",
    description: desc(
      "retirement-age",
      "\u9000\u4F11\u5E74\u9F84\u6D4B\u7B97\u3002\u4F9D\u636E 2025 \u5E74\u8D77\u5B9E\u65BD\u7684\u6E10\u8FDB\u5F0F\u5EF6\u8FDF\u9000\u4F11\u653F\u7B56\uFF0C\u8F93\u5165\u51FA\u751F\u5E74\u6708\u4E0E\u4EBA\u5458\u7C7B\u522B\uFF08\u7537\u804C\u5DE5 / \u5973\u804C\u5DE5\u5E72\u90E8 / \u5973\u5DE5\u4EBA\uFF09\uFF0C\u81EA\u52A8\u6D4B\u7B97\u6CD5\u5B9A\u9000\u4F11\u5E74\u9F84\u3001\u5EF6\u8FDF\u6708\u6570\u4E0E\u5177\u4F53\u9000\u4F11\u5E74\u6708\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        birthYear: { type: "number", description: "\u51FA\u751F\u5E74\u4EFD\uFF081940\u20132010\uFF09" },
        birthMonth: { type: "number", description: "\u51FA\u751F\u6708\u4EFD\uFF081\u201312\uFF09" },
        category: {
          type: "string",
          enum: ["male", "female-cadre", "female-worker"],
          description: "male=\u7537\u804C\u5DE5(60\u219263)\uFF0Cfemale-cadre=\u5973\u804C\u5DE5/\u5973\u5E72\u90E8(55\u219258)\uFF0Cfemale-worker=\u5973\u5DE5\u4EBA(50\u219255)",
          default: "male"
        }
      },
      required: ["birthYear", "birthMonth"]
    },
    handler: (a) => calcRetirementAge(num(a.birthYear), num(a.birthMonth), a.category || "male")
  },
  {
    name: "after_tax_salary_cn",
    description: desc(
      "after-tax-salary",
      "\u7A0E\u540E\u5DE5\u8D44\u8BA1\u7B97\u5668\u3002\u6B63\u7B97\uFF1A\u8F93\u5165\u7A0E\u524D\u6708\u85AA\u3001\u4E09\u9669\u4E00\u91D1\u4E0E\u4E13\u9879\u9644\u52A0\uFF0C\u7B97\u51FA\u6708\u4E2A\u7A0E\u4E0E\u7A0E\u540E\u5230\u624B\uFF1B\u53CD\u63A8\uFF1A\u8F93\u5165\u7A0E\u540E\u5230\u624B\u91D1\u989D\uFF0C\u53CD\u63A8\u5BF9\u5E94\u7A0E\u524D\u5DE5\u8D44\u3002\u6309\u7EFC\u5408\u6240\u5F97\u5E74\u5EA6\u7A0E\u7387\u8868\u8BA1\u7B97\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["forward", "reverse"], description: "forward=\u6B63\u7B97(\u7A0E\u524D\u2192\u7A0E\u540E)\uFF0Creverse=\u53CD\u63A8(\u7A0E\u540E\u2192\u7A0E\u524D)", default: "forward" },
        monthlyGross: { type: "number", description: "\u6BCF\u6708\u7A0E\u524D\u5DE5\u8D44\uFF08\u5143\uFF09\uFF0Cmode=forward \u65F6\u5FC5\u586B" },
        monthlyNet: { type: "number", description: "\u6BCF\u6708\u7A0E\u540E\u5230\u624B\uFF08\u5143\uFF09\uFF0Cmode=reverse \u65F6\u5FC5\u586B" },
        monthlySocial: { type: "number", description: "\u6BCF\u6708\u4E09\u9669\u4E00\u91D1\u4E2A\u4EBA\u7F34\u7EB3\uFF08\u5143\uFF09", default: 0 },
        monthlySpecial: { type: "number", description: "\u6BCF\u6708\u4E13\u9879\u9644\u52A0\u6263\u9664\uFF08\u5143\uFF09", default: 0 }
      },
      required: ["mode"]
    },
    handler: (a) => calcAfterTaxSalary({
      mode: a.mode || "forward",
      monthlyGross: a.monthlyGross != null ? num(a.monthlyGross) : void 0,
      monthlyNet: a.monthlyNet != null ? num(a.monthlyNet) : void 0,
      monthlySocial: num(a.monthlySocial, 0),
      monthlySpecial: num(a.monthlySpecial, 0)
    })
  },
  {
    name: "deposit_interest_cn",
    description: desc(
      "deposit-interest",
      "\u5B58\u6B3E\u5229\u606F\u8BA1\u7B97\u5668\u3002\u8F93\u5165\u672C\u91D1\u3001\u5E74\u5229\u7387\u4E0E\u5B58\u671F\uFF0C\u652F\u6301\u5230\u671F\u4E00\u6B21\u6027\u8FD8\u672C\u4ED8\u606F\uFF08\u5355\u5229\uFF09\u3001\u81EA\u52A8\u8F6C\u5B58\uFF08\u590D\u5229\uFF09\u4E0E\u6309\u6708\u4ED8\u606F\u4E09\u79CD\u8BA1\u606F\u65B9\u5F0F\uFF0C\u7B97\u51FA\u5229\u606F\u91D1\u989D\u4E0E\u5230\u671F\u672C\u606F\u5408\u8BA1\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        principal: { type: "number", description: "\u672C\u91D1\uFF08\u5143\uFF09" },
        annualRatePct: { type: "number", description: "\u5E74\u5229\u7387\uFF08%\uFF09\uFF0C\u5982 2.0" },
        years: { type: "number", description: "\u5B58\u671F\uFF08\u5E74\uFF0C\u53EF\u586B\u5C0F\u6570\uFF0C\u5982 0.25 \u4E3A 3 \u4E2A\u6708\uFF09" },
        mode: { type: "string", enum: ["once", "compound", "monthly"], description: "once=\u4E00\u6B21\u6027\u4ED8\u606F(\u5355\u5229)\uFF0Ccompound=\u81EA\u52A8\u8F6C\u5B58(\u590D\u5229)\uFF0Cmonthly=\u6309\u6708\u4ED8\u606F", default: "compound" }
      },
      required: ["principal", "annualRatePct", "years"]
    },
    handler: (a) => calcDepositInterest({
      principal: num(a.principal),
      annualRatePct: num(a.annualRatePct),
      years: num(a.years),
      mode: a.mode || "compound"
    })
  },
  {
    name: "deed_tax_cn",
    description: desc(
      "deed-tax",
      "\u5951\u7A0E\u8BA1\u7B97\u5668\u3002\u8F93\u5165\u623F\u5C4B\u6210\u4EA4\u4EF7\u683C\uFF08\u4E07\u5143\uFF09\u3001\u5EFA\u7B51\u9762\u79EF\u4E0E\u5BB6\u5EAD\u4F4F\u623F\u5957\u6570\uFF08\u9996\u5957 / \u4E8C\u5957 / \u4E09\u5957\u53CA\u4EE5\u4E0A\uFF09\uFF0C\u6309\u73B0\u884C\u5951\u7A0E\u4F18\u60E0\u653F\u7B56\u6D4B\u7B97\u9002\u7528\u7A0E\u7387\u4E0E\u5E94\u7F34\u5951\u7A0E\u989D\u3002\u652F\u6301\u542B\u7A0E\u4EF7\u81EA\u52A8\u5254\u9664\u589E\u503C\u7A0E\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        priceWan: { type: "number", description: "\u6210\u4EA4\u4EF7\u683C\uFF08\u4E07\u5143\uFF09" },
        area: { type: "number", description: "\u5EFA\u7B51\u9762\u79EF\uFF08\u33A1\uFF09" },
        tier: { type: "string", enum: ["first", "second", "third"], description: "first=\u5BB6\u5EAD\u552F\u4E00\u4F4F\u623F\uFF0Csecond=\u7B2C\u4E8C\u5957\u6539\u5584\u6027\u4F4F\u623F\uFF0Cthird=\u7B2C\u4E09\u5957\u53CA\u4EE5\u4E0A" },
        vatInclusive: { type: "boolean", description: "\u6210\u4EA4\u4EF7\u662F\u5426\u542B 5% \u589E\u503C\u7A0E\uFF08\u52FE\u9009\u540E\u81EA\u52A8\u5254\u9664\u518D\u8BA1\u7A0E\uFF09", default: false }
      },
      required: ["priceWan", "area", "tier"]
    },
    handler: (a) => calcDeedTax({
      priceWan: num(a.priceWan),
      area: num(a.area),
      tier: a.tier,
      vatInclusive: a.vatInclusive != null ? !!a.vatInclusive : false
    })
  },
  {
    name: "overtime_pay_cn",
    description: desc(
      "overtime-pay",
      "\u52A0\u73ED\u5DE5\u8D44\u8BA1\u7B97\u5668\u3002\u8F93\u5165\u6708\u5DE5\u8D44\u4E0E\u5404\u7C7B\u52A0\u73ED\u5C0F\u65F6\u6570\uFF0C\u6309\u6807\u51C6\u5DE5\u65F6\u5236\u6838\u7B97\u52A0\u73ED\u8D39\uFF1A\u5DE5\u4F5C\u65E5\u5EF6\u957F 150%\u3001\u4F11\u606F\u65E5 200%\u3001\u6CD5\u5B9A\u4F11\u5047\u65E5 300%\u3002\u8F93\u51FA\u65E5\u5DE5\u8D44\u3001\u5C0F\u65F6\u5DE5\u8D44\u4E0E\u52A0\u73ED\u8D39\u5408\u8BA1\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        monthlySalary: { type: "number", description: "\u6BCF\u6708\u5DE5\u8D44\uFF08\u5143\uFF09" },
        weekdayHours: { type: "number", description: "\u5DE5\u4F5C\u65E5\u52A0\u73ED\u5C0F\u65F6\u6570", default: 0 },
        restDayHours: { type: "number", description: "\u4F11\u606F\u65E5\u52A0\u73ED\u5C0F\u65F6\u6570", default: 0 },
        holidayHours: { type: "number", description: "\u6CD5\u5B9A\u8282\u5047\u65E5\u52A0\u73ED\u5C0F\u65F6\u6570", default: 0 }
      },
      required: ["monthlySalary"]
    },
    handler: (a) => calcOvertimePay({
      monthlySalary: num(a.monthlySalary),
      weekdayHours: num(a.weekdayHours, 0),
      restDayHours: num(a.restDayHours, 0),
      holidayHours: num(a.holidayHours, 0)
    })
  },
  {
    name: "pension_estimate_cn",
    description: desc(
      "pension-estimate",
      "\u517B\u8001\u91D1\u6D4B\u7B97\u3002\u8F93\u5165\u9000\u4F11\u5E74\u9F84\u3001\u5F53\u5730\u4E0A\u5E74\u5EA6\u793E\u5E73\u5DE5\u8D44\u3001\u672C\u4EBA\u5E73\u5747\u7F34\u8D39\u6307\u6570\u3001\u7D2F\u8BA1\u7F34\u8D39\u5E74\u9650\u4E0E\u4E2A\u4EBA\u8D26\u6237\u50A8\u5B58\u989D\uFF0C\u6309\u73B0\u884C\u804C\u5DE5\u57FA\u672C\u517B\u8001\u4FDD\u9669\u516C\u5F0F\u4F30\u7B97\u6BCF\u6708\u57FA\u7840\u517B\u8001\u91D1\u4E0E\u4E2A\u4EBA\u8D26\u6237\u517B\u8001\u91D1\u3002"
    ),
    inputSchema: {
      type: "object",
      properties: {
        retireAge: { type: "string", enum: ["50", "55", "60", "65"], description: "\u9000\u4F11\u5E74\u9F84\uFF08\u5BF9\u5E94\u8BA1\u53D1\u6708\u6570 195/170/139/101\uFF09", default: "60" },
        avgWage: { type: "number", description: "\u5F53\u5730\u4E0A\u5E74\u5EA6\u793E\u5E73\u5DE5\u8D44\uFF08\u5143/\u6708\uFF09" },
        index: { type: "number", description: "\u672C\u4EBA\u5E73\u5747\u7F34\u8D39\u6307\u6570\uFF080.6\u20133\uFF09" },
        years: { type: "number", description: "\u7D2F\u8BA1\u7F34\u8D39\u5E74\u9650\uFF08\u5E74\uFF09" },
        personalBalance: { type: "number", description: "\u4E2A\u4EBA\u8D26\u6237\u50A8\u5B58\u989D\uFF08\u5143\uFF09" }
      },
      required: ["avgWage", "index", "years", "personalBalance"]
    },
    handler: (a) => calcPensionEstimate({
      retireAge: a.retireAge || "60",
      avgWage: num(a.avgWage),
      index: num(a.index),
      years: num(a.years),
      personalBalance: num(a.personalBalance)
    })
  }
];
var SEARCH_TOOL = {
  name: "mokakit_search",
  description: "\u5728 MokaKit \u6469\u5361\u5DE5\u5177\u7BB1\uFF08\u5168\u90E8\u5DE5\u5177\uFF09\u4E2D\u6309\u5173\u952E\u8BCD\u68C0\u7D22\u3002\u8FD4\u56DE\u5339\u914D\u7684\u5DE5\u5177 id\u3001\u540D\u79F0\u3001\u8BF4\u660E\u3001\u5206\u7C7B\u3001\u7AD9\u5185\u94FE\u63A5\uFF1B\u82E5\u8BE5\u5DE5\u5177\u914D\u6709\u5BF9\u5E94\u7684\u8BA1\u7B97\u578B MCP \u5DE5\u5177\uFF0C\u5219\u9644\u5E26 mcpTool \u540D\u79F0\uFF0CAI \u53EF\u76F4\u63A5\u8C03\u7528\u8BE5\u5DE5\u5177\u5B8C\u6210\u8BA1\u7B97\u3002\u8FD9\u662F\u300C\u5148\u641C\u540E\u7B97\u300D\u7684 search-first \u5165\u53E3\u3002",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "\u68C0\u7D22\u8BCD\uFF0C\u5982\u300C\u4E2A\u7A0E\u300D\u300C\u623F\u8D37\u63D0\u524D\u8FD8\u6B3E\u300D\u300C\u589E\u503C\u7A0E\u300D\u300C\u4E8C\u7EF4\u7801\u300D\u7B49" },
      limit: { type: "number", description: "\u8FD4\u56DE\u6761\u6570\u4E0A\u9650", default: 8 }
    },
    required: ["query"]
  },
  handler: (a) => ({ query: a.query, count: searchCatalog(a.query, num(a.limit, 8)).length, results: searchCatalog(a.query, num(a.limit, 8)) })
};
var TOOLS = [...COMPUTE_TOOLS, SEARCH_TOOL];
var TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));
function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
var sessions = /* @__PURE__ */ new Map();
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => data += c);
    req.on("end", () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function dispatch(msg, sessionId) {
  if (!msg || typeof msg !== "object") {
    return { body: rpcError(null, -32700, "Parse error") };
  }
  const { method, params = {}, id } = msg;
  const isNotification = method && method.startsWith("notifications/") && id === void 0;
  if (!method) {
    return { body: rpcError(id, -32600, "Invalid Request: missing method") };
  }
  if (method !== "initialize" && !isNotification) {
    if (!sessionId || !sessions.has(sessionId)) {
      return { body: rpcError(id, -32e3, "No valid sessionId. Send initialize first.") };
    }
  }
  if (isNotification) {
    return { notification: true };
  }
  if (method === "initialize") {
    const reqProto = params && params.protocolVersion;
    const chosen = SUPPORTED_PROTOCOLS.includes(reqProto) ? reqProto : SUPPORTED_PROTOCOLS[0];
    const newId = crypto2.randomUUID();
    sessions.set(newId, { createdAt: Date.now() });
    return {
      sessionId: newId,
      body: rpcResult(id, {
        protocolVersion: chosen,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      })
    };
  }
  if (method === "ping") {
    return { body: rpcResult(id, {}) };
  }
  if (method === "tools/list") {
    return {
      body: rpcResult(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        }))
      })
    };
  }
  if (method === "tools/call") {
    const name = params && params.name;
    const args = params && params.arguments || {};
    const tool = TOOL_MAP.get(name);
    if (!tool) {
      return { body: rpcError(id, -32602, `Unknown tool: ${name}`) };
    }
    try {
      const out = tool.handler(args);
      return {
        body: rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
          structuredContent: out,
          isError: false
        })
      };
    } catch (e) {
      return {
        body: rpcResult(id, {
          content: [{ type: "text", text: `\u8BA1\u7B97\u5931\u8D25\uFF1A${String(e && e.message ? e.message : e)}` }],
          isError: true
        })
      };
    }
  }
  return { body: rpcError(id, -32601, `Method not found: ${method}`) };
}
function writeJson(res, code, body, sessionId) {
  const headers = { "Content-Type": "application/json" };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  res.writeHead(code, headers);
  res.end(JSON.stringify(body));
}
async function handlePost(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    writeJson(res, 400, rpcError(null, -32700, "Invalid JSON"));
    return;
  }
  const headerSession = req.headers["mcp-session-id"];
  const sessionId0 = headerSession && sessions.has(headerSession) ? headerSession : null;
  const messages = Array.isArray(body) ? body : [body];
  const out = [];
  let sessionId = sessionId0;
  let onlyNotification = true;
  for (const msg of messages) {
    const d = dispatch(msg, sessionId);
    if (d.sessionId) sessionId = d.sessionId;
    if (d.notification) continue;
    onlyNotification = false;
    out.push(d.body);
  }
  if (messages.length === 1 && onlyNotification) {
    res.writeHead(202);
    res.end();
    return;
  }
  writeJson(res, 200, messages.length === 1 ? out[0] : out, sessionId);
}
var server = http.createServer(async (req, res) => {
  if ((req.method === "POST" || req.method === "DELETE") && req.url === "/mcp") {
    if (REQUIRED_TOKEN && req.headers["authorization"] !== `Bearer ${REQUIRED_TOKEN}`) {
      writeJson(res, 401, rpcError(null, -32001, "Unauthorized: missing/invalid Bearer token"));
      return;
    }
  }
  if (req.method === "POST" && req.url === "/mcp") {
    await handlePost(req, res);
    return;
  }
  if (req.method === "DELETE" && req.url === "/mcp") {
    const sid = req.headers["mcp-session-id"];
    if (sid && sessions.has(sid)) {
      sessions.delete(sid);
      res.writeHead(200);
    } else {
      res.writeHead(404);
    }
    res.end();
    return;
  }
  if (req.method === "GET" && req.url === "/mcp") {
    res.writeHead(405, { Allow: "POST, DELETE" });
    res.end();
    return;
  }
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        apiVersion: API_VERSION,
        tokenRequired: !!REQUIRED_TOKEN,
        tools: TOOLS.length,
        catalogSize: CATALOG.length,
        metaErrors: META_ERRORS.length,
        endpoint: "/mcp"
      })
    );
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
server.listen(PORT, process.env.HOST || "0.0.0.0", () => {
  const bound = process.env.HOST || "0.0.0.0";
  console.log(`[mokakit-mcp] listening on http://${bound}:${PORT}/mcp`);
  console.log(`[mokakit-mcp] catalog=${CATALOG.length} tools, mcpTools=${TOOLS.length}, metaErrors=${META_ERRORS.length}`);
  if (META_ERRORS.length) {
    console.warn("[mokakit-mcp] meta parse errors:", META_ERRORS.slice(0, 5));
  }
});
/*! Bundled license information:

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.6.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/

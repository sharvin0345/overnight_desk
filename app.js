(function () {
  var HOW = {
    how: true,
    pipeline: true,
    scanner: true,
    analyst: true,
    social: true,
    brain: true,
    executor: true,
    risk: true
  };

  var COIN = /^https:\/\/fomo\.family\/coin\?address=([1-9A-HJ-NP-Za-km-z]+)&chainId=1399811149&r=savipww&source=share_link$/;
  var ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,48}$/;
  var CLOCK = /^\d{1,2}:\d{2}$/;

  var progressPanel = document.getElementById("panel-progress");
  var howPanel = document.getElementById("panel-how");
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var root = document.getElementById("progress-root");
  var pulse = document.getElementById("pulse");

  function viewFromHash() {
    var id = (location.hash || "").replace(/^#/, "");
    if (HOW[id]) return { view: "how", focus: id === "how" ? "" : id };
    return { view: "progress", focus: "" };
  }

  function applyView(state, scroll) {
    var how = state.view === "how";
    progressPanel.hidden = how;
    howPanel.hidden = !how;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("aria-controls") === (how ? "panel-how" : "panel-progress");
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    document.documentElement.removeAttribute("data-boot");
    if (!scroll) return;
    if (state.focus) {
      var node = document.getElementById(state.focus);
      if (node) {
        node.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function (event) {
      event.preventDefault();
      var id = tab.getAttribute("href").replace(/^#/, "");
      if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
      applyView({ view: id === "how" ? "how" : "progress", focus: "" }, true);
    });
  });

  var tablist = document.querySelector(".tabs");
  tablist.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    var dir = event.key === "ArrowRight" ? 1 : -1;
    var next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });

  window.addEventListener("hashchange", function () {
    applyView(viewFromHash(), true);
  });
  window.addEventListener("popstate", function () {
    applyView(viewFromHash(), true);
  });

  applyView(viewFromHash(), false);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isNum(value) {
    return typeof value === "number" && isFinite(value);
  }

  function text(value) {
    return typeof value === "string" && value ? value : "";
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function money(value, digits) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function usd(value) {
    var digits = Number.isInteger(value) ? 0 : 2;
    return money(value, digits);
  }

  function signedMoney(value) {
    var core = money(Math.abs(value), 2);
    if (value > 0) return "+" + core;
    if (value < 0) return "−" + core;
    return core;
  }

  function signedPct(value, digits) {
    var places = digits == null ? 2 : digits;
    var body = Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
    if (value > 0) return "+" + body + "%";
    if (value < 0) return "−" + body + "%";
    return body + "%";
  }

  function roundTo(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  var REASON_LABELS = {
    "liq $NK": "Liquidity under $10K",
    "+N% in Nh": "Pumped too fast (over 200% in 1h)",
    "top N hold N%": "Top 10 holders own too much",
    "dev sold": "Dev sold"
  };

  function reasonLabel(raw) {
    if (Object.prototype.hasOwnProperty.call(REASON_LABELS, raw)) return REASON_LABELS[raw];
    return raw;
  }

  function runPnlPct(data) {
    if (!isNum(data.balance_usd) || !isNum(data.paper_start_usd) || data.paper_start_usd === 0) return null;
    return ((data.balance_usd - data.paper_start_usd) / data.paper_start_usd) * 100;
  }

  function tone(value) {
    if (!isNum(value)) return "flat";
    if (value > 0) return "up";
    if (value < 0) return "down";
    return "flat";
  }

  function plainNumber(value) {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }

  function entryText(value) {
    var abs = Math.abs(value);
    var digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
    return money(value, digits);
  }

  function formatUpdated(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    var formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date);
    return formatted.replace(",", "");
  }

  function displayTime(value) {
    var raw = text(value);
    if (!raw || CLOCK.test(raw)) return raw;
    var date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date);
  }

  function coinHref(coin) {
    var address = text(coin.address);
    if (ADDR.test(address)) {
      return "https://fomo.family/coin?address=" + address + "&chainId=1399811149&r=savipww&source=share_link";
    }
    var link = text(coin.link);
    if (COIN.test(link)) return link;
    return "";
  }

  function ageLabel(seconds) {
    if (!isNum(seconds)) return "";
    var s = Math.max(0, Math.round(seconds));
    if (s < 60) return s + "s ago";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    return Math.floor(m / 60) + "h ago";
  }

  function stateTone(state) {
    var s = String(state || "").toLowerCase();
    if (s === "ok" || s === "open" || s === "up" || s === "running") return "good";
    if (s === "down" || s === "error" || s === "dead" || s === "closed") return "bad";
    return "warn";
  }

  function section(title, count) {
    var block = el("section", "block");
    var h = el("h2");
    h.appendChild(document.createTextNode(title));
    if (count != null) h.appendChild(el("span", "", String(count)));
    block.appendChild(h);
    return block;
  }

  function empty(message) {
    return el("p", "empty", message);
  }

  function kv(label, value, className) {
    var row = el("div", "kv" + (className ? " " + className : ""));
    row.appendChild(el("span", "", label));
    row.appendChild(el("b", "", value));
    return row;
  }

  function sumCounts(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;
    return Object.keys(obj).reduce(function (total, key) {
      return total + (isNum(obj[key]) ? obj[key] : 0);
    }, 0);
  }

  function renderHero(data) {
    var hero = el("div", "hero");
    var eye = el("p", "eyebrow");
    eye.appendChild(el("span", "badge", "PAPER"));
    eye.appendChild(document.createTextNode(" Balance"));
    hero.appendChild(eye);

    var balance = text(data.balance);
    if (!balance && isNum(data.balance_usd)) balance = usd(data.balance_usd);
    hero.appendChild(el("p", "balance", balance || "—"));

    var run = runPnlPct(data);
    if (run != null) {
      var rounded = roundTo(run, 1);
      hero.appendChild(el("p", "pnl " + tone(rounded), signedPct(rounded, 1)));
    }
    var session = text(data.pnl_pct_label);
    if (!session && isNum(data.pnl_pct)) session = signedPct(data.pnl_pct);
    if (session) {
      if (run == null) {
        hero.appendChild(el("p", "pnl " + tone(data.pnl_pct), session));
      } else {
        var line = el("p", "session");
        line.appendChild(el("span", "session-k", "This session"));
        line.appendChild(document.createTextNode(" "));
        line.appendChild(el("span", tone(data.pnl_pct), session));
        hero.appendChild(line);
      }
    }

    var bits = [];
    var cash = text(data.cash);
    if (!cash && isNum(data.cash_usd)) cash = usd(data.cash_usd);
    if (cash) bits.push("Cash " + cash);
    if (isNum(data.paper_start_usd)) bits.push("Started at " + usd(data.paper_start_usd));
    if (bits.length) hero.appendChild(el("p", "meta", bits.join(" · ")));

    var when = data.updated_at ? formatUpdated(data.updated_at) : "";
    var asof = when ? "Updated " + when : text(data.updated) ? "Updated " + data.updated : "Updated time unavailable";
    hero.appendChild(el("p", "asof", asof + " · Asia/Kuala Lumpur"));

    if (String(data.mode || "").toUpperCase() !== "PAPER") {
      hero.appendChild(el("p", "meta", "Snapshot mode field: " + (text(data.mode) || "blank") + ". This page stays a paper desk."));
    }
    return hero;
  }

  function renderStats(data) {
    var wrap = el("div", "stats");
    var desk = data.active === true ? "Running" : data.active === false ? "Paused" : "—";
    var deskTone = data.active === true ? "good" : data.active === false ? "warn" : "";
    wrap.appendChild(stat(desk, "Desk", deskTone));
    var feed = text(data.ws) || "—";
    var feedLabel = feed.toLowerCase() === "open" ? "Open" : feed;
    wrap.appendChild(stat(feedLabel, "Data feed", stateTone(feed)));
    wrap.appendChild(stat(text(data.session) || "—", "Session", ""));
    return wrap;
  }

  function stat(value, label, statTone) {
    var node = el("div", "stat" + (statTone ? " " + statTone : ""));
    node.appendChild(el("b", "", value));
    node.appendChild(el("span", "", label));
    return node;
  }

  function renderRules(rules) {
    if (!rules || typeof rules !== "object") return null;
    var chips = [];
    if (isNum(rules.stop_pct)) chips.push("Stop −" + plainNumber(rules.stop_pct) + "%");
    if (isNum(rules.tp_x)) chips.push("Take profit " + plainNumber(rules.tp_x) + "×");
    if (isNum(rules.min_liq)) chips.push("Min pool " + usd(rules.min_liq));
    if (isNum(rules.min_score)) chips.push("Min score " + plainNumber(rules.min_score));
    if (!chips.length) return null;
    var block = section("Rules in this snapshot");
    var list = el("ul", "chips");
    chips.forEach(function (chip) { list.appendChild(el("li", "", chip)); });
    block.appendChild(list);
    return block;
  }

  function renderFunnel(funnel) {
    var data = funnel && typeof funnel === "object" ? funnel : {};
    var block = section("Funnel");
    var list = el("div", "list");
    if (isNum(data.seen)) list.appendChild(kv("Seen", String(data.seen), "total"));
    if (isNum(data.passed)) list.appendChild(kv("Passed", String(data.passed)));
    var kills = data.kills && typeof data.kills === "object" ? data.kills : {};
    list.appendChild(kv("Killed", String(sumCounts(kills))));
    Object.keys(kills).forEach(function (key) {
      if (isNum(kills[key])) list.appendChild(kv(reasonLabel(key), String(kills[key]), "sub"));
    });
    var refusals = data.refusals && typeof data.refusals === "object" ? data.refusals : {};
    list.appendChild(kv("Refused", String(sumCounts(refusals))));
    Object.keys(refusals).forEach(function (key) {
      if (isNum(refusals[key])) list.appendChild(kv(reasonLabel(key), String(refusals[key]), "sub"));
    });
    block.appendChild(list);
    return block;
  }

  function renderBots(bots) {
    var rows = arr(bots);
    var block = section("Bot health", rows.length);
    if (!rows.length) {
      block.appendChild(empty("No bot status in this snapshot."));
      return block;
    }
    var list = el("div", "list");
    rows.forEach(function (bot) {
      var row = el("div", "bot");
      var dot = el("span", "dot " + stateTone(bot && bot.state));
      row.appendChild(dot);
      var name = el("div");
      name.appendChild(el("div", "name", text(bot && bot.name) || "Bot"));
      name.appendChild(el("div", "subline", text(bot && bot.state) || "unknown"));
      row.appendChild(name);
      var age = ageLabel(bot && bot.age_s);
      if (age) row.appendChild(el("div", "age", age));
      list.appendChild(row);
    });
    block.appendChild(list);
    return block;
  }

  function renderPositions(positions) {
    var rows = arr(positions);
    var block = section("Open positions", rows.length);
    if (!rows.length) {
      block.appendChild(empty("No open positions. The desk is flat."));
      return block;
    }
    var list = el("div", "list");
    rows.forEach(function (position) { list.appendChild(positionRow(position || {})); });
    block.appendChild(list);
    return block;
  }

  function positionRow(position) {
    var href = coinHref(position);
    var row = href ? el("a", "pos") : el("div", "pos");
    if (href) {
      row.href = href;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    }
    var top = el("div", "pos-top");
    top.appendChild(el("span", "sym", text(position.symbol) || "Position"));
    var pnlValue = isNum(position.pnl_pct) ? position.pnl_pct : position.pnl_usd;
    var pnlBits = [];
    if (isNum(position.pnl_pct)) pnlBits.push(signedPct(position.pnl_pct));
    if (isNum(position.pnl_usd)) pnlBits.push(signedMoney(position.pnl_usd));
    if (pnlBits.length) top.appendChild(el("span", "pos-pnl " + tone(pnlValue), pnlBits.join(" · ")));
    row.appendChild(top);
    var bits = [];
    if (isNum(position.size_usd)) bits.push(money(position.size_usd, 2) + " in");
    if (isNum(position.entry_usd)) bits.push("Entry " + entryText(position.entry_usd));
    if (isNum(position.tokens)) bits.push(position.tokens.toLocaleString("en-US") + " tokens");
    var when = displayTime(position.opened_at);
    if (when) bits.push(when);
    if (text(position.note)) bits.push(text(position.note));
    if (bits.length) row.appendChild(el("p", "subline", bits.join(" · ")));
    return row;
  }

  function renderTrades(trades) {
    var rows = arr(trades);
    var block = section("Trade history", rows.length);
    if (!rows.length) {
      block.appendChild(empty("No trades in this snapshot."));
      return block;
    }
    var list = el("div", "list");
    rows.forEach(function (trade) { list.appendChild(tradeRow(trade || {})); });
    block.appendChild(list);
    return block;
  }

  function sideLabel(side) {
    var value = String(side || "").toLowerCase();
    if (value === "buy") return "Bought";
    if (value === "sell") return "Sold";
    return text(side) || "Trade";
  }

  function tradeRow(trade) {
    var href = coinHref(trade);
    var row = href ? el("a", "pos") : el("div", "pos");
    if (href) {
      row.href = href;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    }
    var top = el("div", "pos-top");
    top.appendChild(el("span", "sym", sideLabel(trade.side) + " " + (text(trade.symbol) || "")));
    if (isNum(trade.pnl_usd)) top.appendChild(el("span", "pos-pnl " + tone(trade.pnl_usd), signedMoney(trade.pnl_usd)));
    else if (isNum(trade.usd)) top.appendChild(el("span", "pos-pnl flat", money(trade.usd, 2)));
    row.appendChild(top);
    var bits = [];
    var when = displayTime(trade.time);
    if (when) bits.push(when);
    if (text(trade.status)) bits.push(text(trade.status));
    if (isNum(trade.pnl_pct)) bits.push(signedPct(trade.pnl_pct));
    if (text(trade.reason)) bits.push(text(trade.reason));
    if (bits.length) row.appendChild(el("p", "subline", bits.join(" · ")));
    return row;
  }

  function renderCoins(coins) {
    var rows = arr(coins);
    var block = section("Recent coins", rows.length);
    if (!rows.length) {
      block.appendChild(empty("No coins in this snapshot."));
      return block;
    }
    var list = el("div", "list");
    rows.forEach(function (coin) {
      coin = coin || {};
      var href = coinHref(coin);
      var row = href ? el("a", "coin") : el("div", "coin");
      if (href) {
        row.href = href;
        row.target = "_blank";
        row.rel = "noopener noreferrer";
      }
      var top = el("div", "coin-top");
      top.appendChild(el("span", "sym", text(coin.symbol) || "Coin"));
      var when = text(coin.time);
      if (when) top.appendChild(el("span", "time", when));
      var verdict = text(coin.verdict) || "—";
      top.appendChild(el("span", "pill " + verdict.toLowerCase(), verdict));
      if (href) {
        top.appendChild(el("span", "chev"));
        row.appendChild(el("span", "sr", "Opens on fomo.family"));
      }
      row.appendChild(top);
      if (text(coin.status)) row.appendChild(el("p", "reason", text(coin.status)));
      list.appendChild(row);
    });
    block.appendChild(list);
    return block;
  }

  function render(data) {
    if (data.active === true) pulse.hidden = false;
    root.replaceChildren();
    root.appendChild(renderHero(data));
    root.appendChild(renderStats(data));
    var rules = renderRules(data.rules);
    if (rules) root.appendChild(rules);
    root.appendChild(renderFunnel(data.funnel));
    root.appendChild(renderBots(data.bots));
    root.appendChild(renderPositions(data.positions));
    root.appendChild(renderTrades(data.trades));
    root.appendChild(renderCoins(data.coins));
  }

  function fail() {
    root.replaceChildren();
    root.appendChild(el("p", "error", "Couldn't load the snapshot (data/progress.json)."));
  }

  var dataUrl = new URL("data/progress.json", window.location.href);
  fetch(dataUrl, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad snapshot");
      render(data);
    })
    .catch(function (error) {
      console.error(error);
      fail();
    });
})();

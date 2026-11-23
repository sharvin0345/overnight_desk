# Overnight Desk

Sharvin's paper-trading desk for Solana memecoins on [fomo.family](https://fomo.family/r/savipww). Five bots share one simulated account. No real funds move, and this repo holds no wallet, key, or private endpoint.

The site is static HTML, CSS, and vanilla JS. It is meant to be hosted at:

https://sharvin0345.github.io/overnight_desk/

## Pages

- **Progress** reads every figure from [`data/progress.json`](data/progress.json): balance, P&amp;L, open positions, trade history, recent coins (verdict and reason), funnel counts, and bot health. The snapshot time is shown in Asia/Kuala_Lumpur.
- **How it works** explains Scanner, Analyst, Social, Brain, Executor, and Risk in plain language. Social is part of Analyst's score, not a sixth bot.

Two settings differ from the original 19 Nov 2026 settings file, on purpose:

- Scanner's pool-liquidity floor is **$10,000**. It was $20,000.
- The desk **runs around the clock**. The earlier window was 22:00–06:30, with a report at 08:00. A session loss of 30% still stops new buys.

Coin links use `https://fomo.family/coin?address={address}&chainId=1399811149&r=savipww&source=share_link`. The footer link **New to FOMO?** goes to `https://fomo.family/r/savipww`. Asset paths are relative, so the site works under `/overnight_desk/`.

## Go live on GitHub Pages

The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys on every push to `main`. It uses `actions/configure-pages@v5` with `enablement: true`, then `actions/upload-pages-artifact` and `actions/deploy-pages`.

`enablement: true` asks the action to turn Pages on if it is off. The default `GITHUB_TOKEN` is not allowed to create a Pages site. The reliable step is a one-time setting in the repo:

1. Merge this branch into `main`.
2. Open **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. If the first Actions run failed before that setting existed, open **Actions**, and re-run **Deploy to GitHub Pages**.
5. If GitHub asks you to approve the `github-pages` environment, approve that run.

No secret, token, or environment variable is required. After a green deploy, the site is at https://sharvin0345.github.io/overnight_desk/ (the URL GitHub prints on the run is the same one).

Opening `index.html` as a local file will not load the snapshot, because the page fetches `data/progress.json`. Use the hosted site, or any static server pointed at this folder.

## Refresh the numbers

Replace `data/progress.json` and push to `main`. There is no build. The page fetches that file with `cache: "no-store"`. Do not put tokens, keys, wallet secrets, withdrawal addresses, or private endpoints in the file or anywhere else in the repo. The footer URL is fixed in `index.html` and does not follow `signup` if that field is changed.

The headline P&amp;L is the whole run against the paper start: `(balance_usd - paper_start_usd) / paper_start_usd`, shown to one decimal. The seed is `$33.11` against `$36`, which is **−8.0%**. `pnl_pct_label` stays the session figure and is shown on a smaller line labeled “This session” (seed: `+0.00%`). The balance string is still printed as written.

## `data/progress.json` schema

`schema_version` is `1`. Unknown fields are ignored. A script can regenerate the file by copying a desk snapshot into this shape. The committed file is the live seed (23 Nov 2026, 11:11 Asia/Kuala_Lumpur) plus `schema_version`, `updated_at`, `timezone`, `paper_start_usd`, numeric twins of the money strings, and `address` on each coin.

| Field | Type | What the page does |
| --- | --- | --- |
| `schema_version` | number | `1` for this contract. |
| `updated` | string | Original label, used only if `updated_at` is missing. Seed: `"Mon 23 Nov 11:11 MYT"`. |
| `updated_at` | string | ISO-8601 instant. Formatted in **Asia/Kuala_Lumpur**. Seed: `"2026-11-23T11:11:00+08:00"`. |
| `timezone` | string | `"Asia/Kuala_Lumpur"`. The page always formats times in that zone. |
| `source` | string | Kept for the script. Not shown. |
| `mode` | string | `"PAPER"`. Any other value is shown as a warning. The badge stays PAPER. |
| `active` | boolean | `true` → Desk **Running** and the green dot. `false` → **Paused**. |
| `session` | string | Shown as the session id. Seed: `"2026-11-23"`. |
| `paper_start_usd` | number | Starting paper cash. Seed: `36`. Shown as “Started at”, and used with `balance_usd` for the headline P&amp;L. |
| `balance` | string | Big balance label. Preferred over `balance_usd` for the dollar figure. Seed: `"$33.11"`. |
| `balance_usd` | number | Numeric balance. Required for the whole-run P&amp;L. Also used as the dollar label if `balance` is empty. |
| `cash` | string | Cash label. Seed: `"$33.11"`. |
| `cash_usd` | number | Numeric cash. Used only if `cash` is empty. |
| `pnl_pct` | number | Color of the session line. `0` is flat. Seed: `0.0`. |
| `pnl_pct_label` | string | Session P&amp;L text, shown as “This session”. Seed: `"+0.00%"`. |
| `positions` | array | Open positions. `[]` shows an empty state. |
| `trades` | array | Trade history. `[]` shows an empty state. |
| `coins` | array | Recent coins, in file order. |
| `funnel` | object | `seen`, `passed`, `kills`, `refusals`. |
| `bots` | array | Bot health rows. |
| `ws` | string | Data-feed status. `"open"` renders as **Open**. |
| `rules` | object | Chips: `stop_pct`, `tp_x`, `min_liq` (USD), `min_score`. |
| `signup` | string | Snapshot copy of the referral URL. The footer does not read it. |

`funnel.kills` and `funnel.refusals` are objects of **reason label → count**. The page translates a few desk templates into readable phrases and shows any other label as written:

| Raw label | Shown as |
| --- | --- |
| `liq $NK` | Liquidity under $10K |
| `+N% in Nh` | Pumped too fast (over 200% in 1h) |
| `top N hold N%` | Top 10 holders own too much |
| `dev sold` | Dev sold |

The seed already uses the readable phrases: Liquidity under $10K (20), Pumped too fast (over 200% in 1h) (2), Dev sold (1). Seen `27`. Passed `1`. Killed and Refused on the page are the sums of those objects. A script can write either the template or the phrase.

`bots[]`:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string | Scanner, Analyst, Brain, Executor, Risk. |
| `state` | string | `ok` is healthy. `down`, `error`, `dead`, `closed` are failures. Anything else is a warning. |
| `age_s` | number | Seconds since that bot last reported. Shown as “16s ago”, then minutes, then hours. |

`coins[]`:

| Field | Type | Meaning |
| --- | --- | --- |
| `symbol` | string | Ticker. |
| `time` | string | Clock time already in the snapshot, such as `"11:01"`. Shown as written. |
| `status` | string | Reason line. Shown as written. |
| `verdict` | string | `waiting`, `pass`, or `kill`. Shown as written. |
| `address` | string | Base58 mint. The page builds the fomo.family coin URL from this. |
| `link` | string | Optional. Used only when `address` is missing and the link matches the exact coin URL above. |

`positions[]` (all optional except a row is skipped only if the array is empty):

| Field | Type | Meaning |
| --- | --- | --- |
| `symbol` | string | Ticker. |
| `address` | string | Mint, same link rules as coins. |
| `link` | string | Optional fallback link, same rule as coins. |
| `size_usd` | number | Dollars in the position. |
| `entry_usd` | number | Entry price in USD per token. |
| `tokens` | number | Token amount. |
| `pnl_usd` | number | Unrealized or last P&amp;L in dollars. |
| `pnl_pct` | number | P&amp;L in percent. |
| `opened_at` | string | ISO-8601, or any other display string. ISO times are shown in Asia/Kuala_Lumpur. |
| `note` | string | Short status. |

`trades[]`:

| Field | Type | Meaning |
| --- | --- | --- |
| `symbol` | string | Ticker. |
| `address` | string | Mint, same link rules. |
| `link` | string | Optional fallback link. |
| `side` | string | `buy` or `sell`. |
| `usd` | number | Trade notional. Shown when `pnl_usd` is absent. |
| `pnl_usd` | number | Realized P&amp;L in dollars, or `null` while open. |
| `pnl_pct` | number | Realized P&amp;L in percent, or `null`. |
| `status` | string | For example `done`, `skipped`, `failed`. |
| `reason` | string | Why it was skipped or closed. |
| `time` | string | `"HH:MM"` or an ISO-8601 instant. |

Example position and trade (not in the seed — the seed's arrays are empty):

```json
{
  "positions": [
    {
      "symbol": "EXAMPLE",
      "address": "MintAddressInBase58",
      "size_usd": 12.5,
      "entry_usd": 0.00001234,
      "tokens": 1000000,
      "pnl_usd": 1.2,
      "pnl_pct": 9.6,
      "opened_at": "2026-11-23T09:04:00+08:00",
      "note": "Trail on"
    }
  ],
  "trades": [
    {
      "symbol": "EXAMPLE",
      "address": "MintAddressInBase58",
      "side": "sell",
      "usd": 6.25,
      "pnl_usd": 1.2,
      "pnl_pct": 9.6,
      "status": "done",
      "reason": "take profit",
      "time": "10:15"
    }
  ]
}
```

Minimal transform from a raw desk payload that already matches the seed's source shape: copy the payload through, set `schema_version` to `1`, set `timezone` to `Asia/Kuala_Lumpur`, set `updated_at` to the same instant as `updated`, set `paper_start_usd` to `36` unless that setting changed, set `balance_usd` and `cash_usd` from the dollar strings, and set each coin's `address` from its `link`. Kill and refusal labels can stay as the desk’s template strings; the page translates the known ones. Writing the readable phrase into the file is fine too.

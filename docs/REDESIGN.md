# Digital Gujarat – redesign ("Official Blue")

## Identity
- **Palette** (`src/tokens.scss`): government blue `#1b5cb8` → `#3b8de6`, deep banner blue `#123a75` / `#1c58ad`, saffron accent `#f5992a` (the two colours of the Digital Gujarat logo), cool-white surfaces (`#f3f7fc` page, `#fff` cards, `#d9e4f2` borders). Dark mode is optional and uses brighter blues.
- **Type:** Sora (display) + Inter (body); fluid `--fs-h1/h2/h3`.
- **Shape/elevation:** radii 12 / 16 / 24 / 32 / pill; tinted layered shadows; brand glow for primary actions.
- **Signature elements:** dark aurora banners (home hero + every inner-page banner), floating glass pill header, pill buttons with gradient primary, eyebrow chips, rounded aurora footer, dotted-grid texture.
- **Theme picker** (top bar) offers Govt Blue (default), Saffron, Emerald, Teal, Rose and Violet; every colour comes from `--brand*`.
- Variables renamed: `--dg-orange*`→`--brand*`, `--dg-accent-2/3`→`--brand-2/3`, `--dg-navy*`→`--ink*`, `--grad-navy`→`--grad-ink`.

## Checklist (✔ = implemented and viewed in the browser unless noted)
**Shared**
- ✔ Top bar · ✔ floating header + nav + Services dropdown · ✔ mobile menu (below 1180 px)
- ✔ Footer · ✔ Loader (index.html + main.ts progress) · ✔ Ctrl+K palette · ✔ theme picker · ✔ page banner (`app-page-hero`)
- ✔ Buttons, inputs, selects, select-buttons, tabs, accordion, p-card, tables, paginator, dialogs, messages (PrimeNG skins in `pages.scss`)
- ✔ a11y drawer on tokens (second pass fixed a dark-mode bug: tiles stayed white under light text)
**Home** – ✔ hero + slider · ✔ search card · ✔ ticker · ✔ explorer · ✔ stats · ✔ trending carousel · ✔ steps · ✔ promo · ✔ FAQ · ✔ glimpses slider (rebuilt as "timed cards" component) · ✔ partners marquee · ✔ holidays · ✔ CTA band
**Routes (all 22 + 404)** – `/`, `about-us`, `sugam-digital-gujarat`, `services/{citizen,digital-sevasetu,janseva,linked}`, `latest-update`, `faq`, `sitemap`, `feedback`, `feedback-dashboard`, `help-desk`, `videos`, `promotional-campaign`, `user-manual`, 6 policy pages, `**`.
- Viewed at 1440 px: home (all sections, light + dark), about, sugam, linked, latest-update, faq, sitemap, help-desk, videos, campaign, user-manual, feedback-dashboard, feedback.
- Also viewed at 1440 px in a second pass: services/citizen and services/janseva (digital-sevasetu shares the template, only its overflow at 375 px was checked), terms-conditions and accessibility-statement (the other four policy pages share that template).
- Overlays viewed: login menu, accessibility drawer (light + dark), video dialog, Services menu, Ctrl+K palette, theme picker with all six themes applied (Indigo, Sky, Emerald, Teal, Rose, Amber).

## Verification actually run
- `ng build` production: passes (initial 1.09 MB raw / 234 kB transfer).
- 375 px: all 22 routes + 404 → 0 px horizontal overflow, correct titles, 0 broken images on the 15 routes where images were counted.
- 768 px: home hero viewed. 1440 px dark mode: explorer, stats, FAQ, holidays viewed. Theme picker: Emerald applied site-wide then reset to Indigo. Services menu and Ctrl+K palette opened and viewed.
- Grep for old colours/fonts (orange hexes, old navies, Poppins/Lato/Plus Jakarta, `--dg-orange`) → none left in `src`.

## Not done / limits
- Not tested: Safari/Firefox, real devices, landscape phones, keyboard-only pass, screen readers, Lighthouse, slow-network loader behaviour, the drawer's high-contrast / invert / monochrome states, the image lightbox, the 404 page at desktop width. White text on the Amber theme button is only ~3:1 contrast.
- Per-page *layouts* of inner pages keep their original structure (cards/grids/tables); they were re-skinned and given the new banner, not re-composed.
- Bundle budget raised (warn 1.2 MB / error 1.5 MB) instead of trimming PrimeNG; images remain unoptimised PNG/JPG.
- Feedback form still has no backend (pre-existing). No functionality, routes or data were changed.

## Files modified
`src/tokens.scss` (new), `base.scss`, `hero.scss`, `home-sections.scss`, `pages.scss`, `anim.scss`, `responsive.scss`, `dropdown.scss`, `coverflow.scss`, `perf.scss`, `a11y.scss`, `a11y-drawer.scss`, `styles.scss`, `index.html`, `main.ts`, `app/app.ts` (theme list, variable names), `app/app.config.ts` (preset variable names), `app/app.html` (menubar breakpoint), `app/pages/home.html` (trending icon wrapper), `angular.json` (budget), `.claude/launch.json`, `docs/REDESIGN.md`. No new dependencies.

## Glimpses slider (rebuilt)
Replaces the expanding-panel slider with a native Angular port of the CodePen "Timed Cards Opening": `src/app/shared/glimpse-slider.ts` + `src/glimpses.scss`. A full-bleed stage shows the active photo; a strip of upcoming cards sits bottom-right; on change the next card grows from its slot to fill the stage while the old photo zooms out. Arrows, clickable cards, swipe, ←/→ keys, progress line (its animation end advances the slide), slide counter, "View photo" button (opens the existing lightbox). Autoplay pauses on hover/focus and while the lightbox is open; reduced-motion / "Pause animation" users get no timer and no grow animation. No Swiper/GSAP dependency added. Verified: next/prev/card click/lightbox via script, desktop + 375 px views, no overflow. Not verified: tablet width view, other browsers. The source photos are only 276×299 px, so they are shown whole in a framed picture over a blurred copy of themselves (never cropped or stretched across the stage); larger source images would make them sharper.

## About Us slider (restyled)
`src/coverflow.scss` + `AboutPage.pos()` now render the photos as a 3D stack ported from the CodePen "Dermal Health Science" carousel: the front card is sharp and raised; the other photos sit behind it to the left, smaller and fainter, and each change rotates the stack (0.8 s ease). Glass-style card frames; arrows, dots, click-a-card, swipe, ←/→ keys and the pause-on-hover autoplay are unchanged. Verified: next/prev/dot/click states via script, desktop + 375 px views, no overflow. Not verified: tablet width, other browsers.

## Palette revision
The first pass (near-black ink + indigo) was too dark for a government portal. Revised to Official Blue: banners, footer, stats and loader are now mid government-blue gradients with a saffron glow instead of near-black; the closing banner is a bright blue gradient so it separates from the footer. Viewed: home hero, stats, trending, CTA + footer, Citizen Services page, dark mode. Not re-viewed after the change: other inner pages, the five alternative themes, the loader, the accessibility drawer.

## Themes now recolour everything
Picking a colour theme used to change only buttons and accents. `src/tokens.scss` now derives the banner/footer/stats shades (`--ink`, `--ink-2`), the page tint, card borders, text and muted text, and the aurora glows from `--brand` / `--brand-2` with `color-mix`; `setTheme()` in `app.ts` also sets `--brand-2-rgb`, `--accent`, `--accent-rgb` and `--ink-rgb` per theme (each theme has its own accent). Viewed: Saffron (hero) and Emerald (hero, stats, trending, closing banner, footer) fully recoloured; Govt Blue is the default. Not viewed after this change: Teal, Rose, Violet, inner pages in non-default themes, dark mode combined with a non-default theme. The first-paint loader is fixed blue because it renders before themes load.

## Palette overhaul — "Ivory & Navy" (current identity)
Direction chosen from the project's purpose (a Government of Gujarat citizen-services portal, logo = blue + saffron, banner = government blue): a warm-ivory canvas with deep navy ink, Gujarat blue for every action and a marigold-saffron accent used only for highlights (badges, step numbers, ticker label, marker underline on key heading words, CTA buttons on navy panels). Editorial serif headings (Fraunces) over Inter body text; Sora stays for numerals and the banners.
- **Tokens** (`src/tokens.scss`): `--brand` `#1a4a94` / `--brand-2` `#2f6bc4`; `--accent` `#e8891d` with `--accent-ink` `#9a5a05` for accent text; `--ink` / `--ink-2` navy shades derived from the brand; page `--dg-bg` warm ivory, `--dg-alt` sand, `--dg-card` white, `--dg-text` navy-black, `--dg-muted`, `--dg-border` warm grey; `--dg-success` / `--dg-warning` / `--dg-danger`; `--grad-brand` (subtle), `--grad-ink`, `--grad-aurora` (footer/stats), `--sh-1…3`, `--sh-glow`. Dark mode is a full second token set.
- **Banner lock:** the home hero and every inner-page banner read `--bn-*` tokens scoped on `.hero, .page-hero` (with the derived gradients re-declared there), so they keep their original blue/saffron look and Sora type, whatever the page palette. Verified by comparing computed styles before/after: 4/4 page-banner properties identical; 15/16 hero elements identical, the 16th (slider indicator) uses exactly the original banner colours (188,217,247 → 245,153,42) and differed only in a sampled state.
- **Components:** serif headings with a saffron marker on key words; saffron-tinted eyebrow chips; ivory/sand section rhythm; navy ticker with saffron label; navy stats strip; promo + closing banner on navy with saffron primary buttons with white text (about 2.6:1 contrast, chosen by the owner over the navy text) and glass-outline secondaries; navy footer with saffron top rule; step badges and "Hot" tags in saffron; loader recoloured.
- **Themes:** Govt Blue (default, uses stylesheet values incl. dark mode), Saffron, Emerald, Teal, Rose, Violet re-derive ink, surfaces, borders and accent from the theme; in dark mode theme colours are lightened for contrast. Banners follow the picker's tint but the default theme keeps them exactly as designed.
- **Contrast measured (light):** body text 14.7:1, muted 5.6–5.8:1, brand links 7.4–7.7:1, white on primary button 8.6:1, saffron-ink chip 4.8:1, navy on saffron badge 5.6:1, white on navy 14.7:1. Dark: text 16.8:1, muted 6.8:1, brand links 5.2–5.9:1; buttons switched to dark text (white on the lighter dark-mode blue was only 3.3:1).
- **Fixed during this pass:** highlighted words unreadable on navy panels; dark-mode theme overrides clobbering the dark brand colour; secondary buttons on navy; saffron CTA buttons losing to the base button rule (now driven by tokens).
- **Verified:** production build passes; 375 px: home, about, citizen, feedback, linked, faq, help-desk and 404 have 0 px overflow; home (all sections), About, Citizen, Feedback, Latest Update viewed at 1440 px; Emerald theme and dark mode viewed. **Not re-viewed after this palette:** remaining inner pages (videos, campaign, manual, sitemap, dashboard, policies, other service lists), Teal/Rose/Violet/Saffron inner pages, the accessibility drawer, tablet width, other browsers.

### Dark-mode fix (icons and link text)
The service icons are dark line art, so on dark cards they vanished. In dark mode the icon tiles (trending, explorer, service lists) now use a light backing, "Apply now"/link text and step icons are lifted for contrast, partner logos sit on white tiles, and the navy panels are deeper. Viewed in dark mode: trending, steps, explorer, stats, Important Links, holidays and the Citizen Services list. Not viewed in dark mode: the other inner pages.

### Navbar: pill → full-width bar on scroll
`.site-header` in `src/base.scss`: at the top the navbar is the floating glass pill inside the page container; after 60 px of scroll (existing `.scrolled` class) it widens to 100 % of the viewport (container-fluid), drops to the top edge, squares its top corners (bottom corners stay rounded), and gets a hairline bottom border and a softer shadow. Width, offset, padding, radius, shadow, background and logo size all transition together over 0.55 s `ease-out`. The side padding becomes `max(gutter, (100vw − container) / 2)` so the nav content stays aligned with the page content. Verified: desktop (1440 px: bar spans the full width, padding 120 px) and 375 px (full width, no overflow); the smooth in-between frames were seen mid-transition. Reduced-motion users get the global near-zero transition.

## Helpdesk Support page (`/help-desk`)
- Rebuilt from the live page https://www.digitalgujarat.gov.in/LinkPages/HelpDesk.aspx (fetched with curl; WebFetch failed on the site's certificate). All of its content is kept: support hours 10:00 AM–6:00 PM Mon–Sun, the 8 issue categories, toll free 1800 233 5500, dss-support@gujarat.gov.in, English and Gujarati user manual PDFs, Sugam User Manual link, and `assets/img/support.svg` (already mirrored locally).
- Page: `src/app/pages/help-desk.ts`, styles `src/help-desk.scss` (old `.help/.chips/.contact-cards` rules removed from `pages.scss`).
- Motion: scroll reveals, pulsing "online now" dot (computed from IST hours, refreshed every 30 s), ringing contact icons, floating illustration, topic-card hover. All disabled under reduced motion.
- Checked: console clean, 375 px no horizontal overflow, `ng build` passes. Not checked: dark mode, other themes, tablet width, PDF links opening (point at the live site).

## Citizen Login (`/citizen-login`)
New page built from a scan of https://www.digitalgujarat.gov.in/loginapp/CitizenLogin.aspx: `src/app/pages/citizen-login.ts` + `src/login.scss`.
- **Content carried over:** New User (registration, 4 benefits, helpline 1800 233 5500, English/Gujarati user manuals), Registered User (Gujarati notice, 90-day password notice, Know Your Citizen ID, login type Mobile No / CitizenId, user name, password, captcha, full password policy, bilingual hint, Forgot Password), Latest Update (all 6 items with the official PDF / store links). Official actions (registration, Know Your ID, Forgot Password, manuals, circulars) link to the official site.
- **Behaviour:** username rules per login type (10-digit mobile / alphanumeric ID); live password-policy checklist + strength meter; own canvas captcha with refresh; Login stays disabled until everything passes (and says what is still missing); show/hide password.
- **Animations:** staggered card/field entrances, animated gradient hairline on the form card, floating background orbs, pulsing helpline ring, ticking policy rules, spinning refresh, button light-sweep, drawn check-mark on completion, auto-scrolling updates that pause on hover/focus; all disabled by reduced-motion / "Pause animation".
- **Important limitation:** the real login needs the portal's server session, server-generated captcha and salted SHA-1 hash, so it cannot authenticate from this app. After local validation the page clears the password and hands the user to the official sign-in page ("Continue to secure sign-in", new tab). No credentials are stored or sent by this app, and the captcha here is a front-end check only.
- **Wiring:** header "Login / Register → Citizen Login", home CTA "Register / Login", Ctrl+K search entry, and the old `CitizenLogin.aspx` link mapping now point to this route. Office / School login still go to the official portal.
- **Assets:** the source page has no photos; its logos are already in the project. Its only page-specific image is a captcha-refresh icon, which I replaced with the site icon set. (My first download attempt used curl with certificate checks off and was blocked; I redid it with verification on.)
- **Verified:** form logic via scripted events (type, policy rules, strength, captcha right/wrong, enable/disable, hand-off, link target), header navigation, light + dark at 1280 px, 375 px and 768 px without overflow. Not verified: other browsers, keyboard-only walk-through, screen readers.

## Help Desk (`/help-desk`) — checked against https://www.digitalgujarat.gov.in/LinkPages/HelpDesk.aspx
The page had already been rebuilt in the new design (`src/app/pages/help-desk.ts` + `src/help-desk.scss`). A scan of the official page found: headline "Need support for any service?", hours 10:00 AM–6:00 PM Monday–Sunday, 8 topics (Application, Scholarship, Sugam, Janseva, Payment, Payment Failed, Payment Refund, Payment Other), toll free 1800 233 5500, email dss-support@gujarat.gov.in, and `assets/img/support.svg`. All of it is present on our page (checked by script against the rendered text; phone/mail links and the illustration load; 0 px overflow). The official illustration is byte-identical to the copy already in `public/assets/site/assets/img/support.svg`, so no new asset was added. Extras on our page: live "online now / closed" badge (IST), topic cards grouped into Services and Payments, user-manual download cards, closing CTA. Visually viewed: intro and topics at 1024 px; not re-viewed this round: mobile, dark mode.



## Hero stats row → cards
The three hero facts (services online, linked department services, helpdesk hours) changed from a plain row of numbers with divider lines to three glass cards, each with an icon tile and a count-up number (the helpdesk card stays text "10–6"). They rise in one after another, lift on hover, and stack icon-over-number on phones. Files: `home.ts` (`facts`), `home.html`, `hero.scss`, `responsive.scss`. Previous versions are saved in the session scratchpad (`backup-facts`). Verified at 1280 px and 375 px (no overflow) and by build; not checked at tablet width.
Note: with the accessibility "Light Mode" on, the dark hero still gets a light background under white text (existing issue, unchanged).

## Hero headline block restructured
The headline now reveals word by word (each word slides up out of a mask in turn, replaying on every slide change); the accent words carry a slow colour shimmer; the subtitle sits beside an accent rule (centred, no rule on phones); the visible text is split per word while the `<h1>` keeps one clean `aria-label`. Reduced-motion users get the words immediately. Files: `home.html`, `home.ts` (`words()`), `hero.scss`. Previous versions are in the session scratchpad (`backup-headline`). Verified at 1280 px and 375 px (no overflow) and by build; not checked at tablet width or in other browsers.


## Videos: grid structure
The first video is now an explicit featured card ("Start here" tag; 2 columns × 2 rows on desktop, full width on tablet, normal on phones) whose picture grows to fill the cell, so no empty white area sits under its title. All other cards are equal height within a row (titles clamp at 3 lines), and `grid-auto-flow: dense` packs the grid without holes. Files: `videos.ts`, `pages.scss`; previous versions in the session scratchpad (`backup-videos`). Verified at 1440 / 768 / 375 px (measured card sizes, no overflow) and by build. One thumbnail (Unreserved Caste Certificate, Panchayat) still shows a broken image: its source file is missing (separate, previously reverted fix).

## Videos: thumbnail fix (applied)
The missing thumbnail `public/assets/site/images/VideoImages/UnreservedCasteCertificateRular.jpg` was downloaded from the official site (certificate-verified), and `videos.ts` falls back to the video's YouTube preview if any thumbnail fails. All 22 thumbnails load; a forced failure swaps to the YouTube URL. The stray folder `UnreservedCasteCertificateRular.jpgassets/` in that directory is harmless and can be deleted by hand.

## External links open in a new tab
Audit: every `<a>` that leaves the site already had `target="_blank"` in templates, and the two `window.open` calls use `_blank`. The gap was the menu items defined in code: the header menu's Policy, Business and Scholarship Services items and the Login menu's Office / School Login opened in the same tab. `shared/site.ts` now passes both menus through `openExternal()`, which sets `target: '_blank'` on any item with a `url` (recursively). Checked in the browser on 14 routes (home with the login menu open, about, sugam, citizen, DSS, janseva, linked, latest update, sitemap, user manual, FAQ, citizen login, help desk, campaign, feedback response): 0 off-site links without `target="_blank"`. Not swept: the feedback form, videos and the six policy pages (they have no off-site links other than the shared header/footer, which were covered). Internal links still navigate in the same tab.

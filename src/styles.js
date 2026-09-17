export const CSS = `
/* ============================================================
   thriveABL — measured-document design system.
   Monochrome: ink + paper + the grey ramp below. Every
   spacing/type value is a token — a stray literal is a bug.

   ONE hue exists: --signal (amber). It is a signal, not a
   palette. Permitted in exactly three places:
     1. the front-facing axis of the hero profile solid
     2. the CTA arrow / link underline
     3. the assessment progress fill
   Charts, badges, score bars and error states stay monochrome —
   darkness must never encode category or magnitude. Adding a
   fourth use, or a second hue, is a design regression.
   ============================================================ */

@font-face{
  font-family:'Inter Variable';
  src:url('/fonts/inter-latin-wght-normal.woff2') format('woff2-variations');
  font-weight:100 900;
  font-display:swap;
}
@font-face{
  font-family:'JetBrains Mono Variable';
  src:url('/fonts/jetbrains-mono-latin-wght-normal.woff2') format('woff2-variations');
  font-weight:100 800;
  font-display:swap;
}

:root{
  /* ---- palette: two inks + the grey ramp. nothing else. ---- */
  --ink:#0A0A0A;
  --paper:#FFFFFF;
  --grey-900:#141414;
  --grey-600:#3D3D3D;
  --grey-500:#767676;
  --grey-300:#B8B8B8;
  --grey-200:#E4E4E4;
  --grey-100:#F4F4F4;

  /* the single tertiary — see the header note for its three uses */
  --signal:#F2A33C;

  /* ---- spacing scale: 8px unit, no arbitrary values ---- */
  --sp-4:4px; --sp-8:8px; --sp-16:16px; --sp-24:24px; --sp-32:32px;
  --sp-48:48px; --sp-64:64px; --sp-96:96px; --sp-128:128px;

  /* ---- type scale: minor third (1.2) off 16px, 4px baseline ---- */
  --fs-12:12px; --lh-12:16px;
  --fs-14:14px; --lh-14:20px;
  --fs-16:16px; --lh-16:24px;
  --fs-20:20px; --lh-20:28px;
  --fs-24:24px; --lh-24:32px;
  --fs-32:32px; --lh-32:40px;
  --fs-44:44px; --lh-44:52px;
  --fs-64:64px; --lh-64:72px;

  /* fluid display — marketing pages only. Scales continuously so
     there is no breakpoint at which the hero looks half-sized. */
  /* Capped so the longest authored hero line ("terrible career", 15ch) fits
     the copy column without wrapping — see .line-in white-space:nowrap. */
  --fs-fluid-display:clamp(32px, 5.2vw, 74px);
  --fs-fluid-hero:clamp(28px, 4.2vw, 56px);

  --font-body:'Inter Variable','Inter',system-ui,-apple-system,sans-serif;
  --font-mono:'JetBrains Mono Variable','JetBrains Mono',ui-monospace,'SF Mono',Consolas,monospace;

  --radius:0; /* square corners throughout — no exceptions */
  --touch-min:44px;
  --header-h:73px; /* sp-16 x2 + 40px nav-cta + 1px rule */

  --col-reading:640px;
  --col-wide:1200px;
  --gutter:24px;
}
@media (min-width:768px){:root{--gutter:48px}}

/* Wider-gamut amber where supported; the hex above is the fallback. */
@supports (color:oklch(0.78 0.16 70)){:root{--signal:oklch(0.78 0.16 70)}}

*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
/* overflow-anchor: Chrome's scroll anchoring adjusts scrollTop when content
   above the viewport changes size. ScrollTrigger's pin-spacers do exactly
   that, so the browser and GSAP end up correcting each other — visible as
   jitter. Pinned pages must opt out. */
html,body{background:var(--paper);overflow-anchor:none;overflow-x:hidden}

/* ============================================================
   Surfaces — the one dramatic move. .surface-ink is the black
   canvas (landing); .surface-paper is the printed-instrument
   white (assessment / report / admin). Crossing from one to the
   other IS the brand expression, so it's used exactly once in
   the product (the "/" -> "/assessment" transition).
   ============================================================ */
.surface-paper{ --surface:var(--paper); --on-surface:var(--ink); --rule:var(--grey-200); --muted:var(--grey-500); }
.surface-ink{   --surface:var(--ink);   --on-surface:var(--paper); --rule:rgba(255,255,255,.16); --muted:rgba(255,255,255,.56); }

.app{min-height:100vh;background:var(--surface,var(--paper));color:var(--on-surface,var(--ink));font-family:var(--font-body);line-height:var(--lh-16)}

/* ============================================================
   Layout
   ============================================================ */
.wrap{max-width:var(--col-reading);margin:0 auto;padding:var(--sp-64) var(--gutter) var(--sp-96)}
.wrap-wide{max-width:var(--col-wide);margin:0 auto;padding:var(--sp-48) var(--gutter) var(--sp-96)}

/* ============================================================
   Typography
   ============================================================ */
.eyebrow{font-family:var(--font-mono);font-size:var(--fs-12);line-height:var(--lh-12);font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.hero-title{font-size:var(--fs-44);line-height:var(--lh-44);font-weight:500;letter-spacing:-.01em}
.display-title{font-size:var(--fs-64);line-height:var(--lh-64);font-weight:400;letter-spacing:-.01em}
.sec-title{font-size:var(--fs-24);line-height:var(--lh-24);font-weight:500}
.body{font-size:var(--fs-16);line-height:var(--lh-16);color:var(--on-surface)}
.caption{font-size:var(--fs-14);line-height:var(--lh-14);color:var(--muted)}

/* every number that changes must not jitter */
.num,.mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums}

/* ============================================================
   Rules — exactly two weights: hairline division, ink structure
   ============================================================ */
.rule-hair{border:none;border-top:1px solid var(--rule)}
.rule-structure{border:none;border-top:1px solid var(--on-surface)}

/* ============================================================
   Panel — the flat card is now a bordered, square-cornered block.
   Replaces the old rounded/shadowed .card.
   ============================================================ */
.panel{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius);padding:var(--sp-24);margin-bottom:var(--sp-16)}
.panel-flat{background:transparent;padding:0}
.panel-inverted{background:var(--on-surface);color:var(--surface)}

/* ============================================================
   Dimension line — the progress indicator, drawn like a drafting
   callout: end ticks, mono value set above the rule.
   ============================================================ */
.dim-line{margin-bottom:var(--sp-32)}
.dim-line .dim-value{font-family:var(--font-mono);font-size:var(--fs-14);font-variant-numeric:tabular-nums;letter-spacing:.02em;margin-bottom:var(--sp-8);display:flex;justify-content:space-between}
.dim-line .dim-track{position:relative;height:1px;background:var(--rule)}
.dim-line .dim-fill{position:absolute;top:0;left:0;height:1px;background:var(--on-surface);transition:width .25s ease}
.dim-line .dim-track::before,.dim-line .dim-track::after{content:'';position:absolute;top:-4px;width:1px;height:9px;background:var(--rule)}
.dim-line .dim-track::before{left:0}
.dim-line .dim-track::after{right:0}

/* Section identity: "01 / 04" in mono against a full-width rule */
.section-mark{display:flex;align-items:baseline;gap:var(--sp-8);padding-bottom:var(--sp-8);border-bottom:1px solid var(--on-surface);margin-bottom:var(--sp-24)}
.section-mark .num{font-size:var(--fs-20);line-height:var(--lh-20);font-weight:500}
.section-mark .of{font-family:var(--font-mono);font-size:var(--fs-12);color:var(--muted);letter-spacing:.04em;text-transform:uppercase}

/* ============================================================
   Likert scale — the most-seen component (34x per run). Five
   equal square cells, hairline-divided, no gaps, no radius.
   ============================================================ */
.likert-row{display:flex;border:1px solid var(--rule)}
.likert-cell{flex:1;min-height:56px;border:none;border-right:1px solid var(--rule);background:var(--surface);color:var(--on-surface);font-family:var(--font-mono);font-size:var(--fs-20);font-variant-numeric:tabular-nums;cursor:pointer;transition:background .12s,color .12s}
.likert-cell:last-child{border-right:none}
.likert-cell:hover{background:var(--rule)}
.likert-cell.sel{background:var(--on-surface);color:var(--surface)}
.likert-anchors{display:flex;justify-content:space-between;margin-top:var(--sp-8)}
.likert-anchors span{font-family:var(--font-mono);font-size:var(--fs-12);color:var(--muted);text-transform:uppercase;letter-spacing:.04em}

/* ============================================================
   Buttons — accent is inversion, not colour. No gradients, no radius.
   ============================================================ */
.btn-cta{width:100%;min-height:var(--touch-min);height:56px;border:1px solid var(--on-surface);background:var(--on-surface);color:var(--surface);font-family:var(--font-body);font-size:var(--fs-16);font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--sp-8);transition:opacity .12s}
.btn-cta:hover{opacity:.82}
.btn-cta:disabled{background:var(--rule);border-color:var(--rule);color:var(--muted);cursor:not-allowed;opacity:1}
.btn-secondary{width:100%;min-height:var(--touch-min);height:56px;border:1px solid var(--on-surface);background:transparent;color:var(--on-surface);font-family:var(--font-body);font-size:var(--fs-16);font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--sp-8);transition:background .12s,color .12s}
.btn-secondary:hover{background:var(--on-surface);color:var(--surface)}

/* ============================================================
   Report panels — locked/unlocked gamified states (Beat 1).
   Locked: blurred, grey, outlined. Unlocked: sharp, ink.
   ============================================================ */
.report-panel{border:1px solid var(--rule);padding:var(--sp-24);margin-bottom:var(--sp-16);transition:filter .5s ease,opacity .5s ease}
.report-panel.locked{filter:blur(6px);opacity:.55;color:var(--grey-300);user-select:none;pointer-events:none}
.report-panel.unlocked{filter:blur(0);opacity:1}

/* ============================================================
   Score bars — monochrome scale bars, not an infographic.
   Darkness never encodes category OR magnitude; length + label do.
   ============================================================ */
.score-bar{margin-bottom:var(--sp-16)}
.score-bar .score-label-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:var(--sp-4)}
.score-bar .score-label{font-size:var(--fs-14);line-height:var(--lh-14)}
.score-bar .score-value{font-family:var(--font-mono);font-size:var(--fs-14);font-variant-numeric:tabular-nums}
.score-bar .score-track{position:relative;height:1px;background:var(--rule);margin-top:var(--sp-8)}
.score-bar .score-fill{position:absolute;top:-1.5px;left:0;height:4px;background:var(--on-surface)}
.score-ticks{display:flex;justify-content:space-between;margin-top:var(--sp-4)}
.score-ticks span{font-family:var(--font-mono);font-size:var(--fs-12);color:var(--muted)}

/* ============================================================
   Registration marks — corner brackets from the wordmark, used
   sparingly as a framing device.
   ============================================================ */
.reg-mark{position:fixed;width:16px;height:16px;pointer-events:none;opacity:.5}
.reg-mark::before,.reg-mark::after{content:'';position:absolute;background:var(--on-surface)}
.reg-mark::before{width:100%;height:1px;top:0;left:0}
.reg-mark::after{width:1px;height:100%;top:0;left:0}
.reg-mark.tl{top:var(--sp-16);left:var(--sp-16)}
.reg-mark.tr{top:var(--sp-16);right:var(--sp-16);transform:scaleX(-1)}
.reg-mark.bl{bottom:var(--sp-16);left:var(--sp-16);transform:scaleY(-1)}
.reg-mark.br{bottom:var(--sp-16);right:var(--sp-16);transform:scale(-1,-1)}

/* ============================================================
   Fields
   ============================================================ */
.field{display:grid;gap:var(--sp-8)}
.field label{font-size:var(--fs-14);font-weight:500}
.field-input{min-height:var(--touch-min);height:48px;border:1px solid var(--rule);border-radius:var(--radius);padding:0 var(--sp-16);font-size:var(--fs-16);font-family:var(--font-body);color:var(--on-surface);background:var(--surface);outline:none}
.field-input:focus{border-color:var(--on-surface)}
.field-check{display:flex;align-items:flex-start;gap:var(--sp-8);font-size:var(--fs-14);color:var(--muted)}

/* ============================================================
   Motion — restrained; used for the unlock/reveal beats only
   ============================================================ */
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .3s ease both}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{width:32px;height:32px;border-radius:50%;border:1px solid var(--rule);border-top-color:var(--on-surface);animation:spin .85s linear infinite}

@media print{
  .no-print{display:none!important}
  .app{background:#fff!important;color:#0A0A0A!important}
}

/* ============================================================
   MARKETING SURFACE — site chrome, hero, sections.
   Everything below is used only by the public company pages;
   the assessment/report/admin surfaces are untouched.
   ============================================================ */

/* ---- brand lockup: wordmark inside its registration brackets ---- */
.brand-lockup{position:relative;display:inline-flex;align-items:center;padding:var(--sp-8) var(--sp-16);color:inherit}
.brand-lockup .bl-c{position:absolute;width:9px;height:9px;pointer-events:none}
.brand-lockup .bl-c::before,.brand-lockup .bl-c::after{content:'';position:absolute;background:currentColor;opacity:.65}
.brand-lockup .bl-c::before{width:100%;height:1px;top:0;left:0}
.brand-lockup .bl-c::after{width:1px;height:100%;top:0;left:0}
.brand-lockup .bl-c.tl{top:0;left:0}
.brand-lockup .bl-c.tr{top:0;right:0;transform:scaleX(-1)}
.brand-lockup .bl-c.bl{bottom:0;left:0;transform:scaleY(-1)}
.brand-lockup .bl-c.br{bottom:0;right:0;transform:scale(-1,-1)}

/* ---- shared chrome ---- */
.site-header{position:sticky;top:0;z-index:40;background:var(--surface);border-bottom:1px solid var(--rule)}
.site-header-in{max-width:var(--col-wide);margin:0 auto;padding:var(--sp-16) var(--gutter);display:flex;align-items:center;justify-content:space-between;gap:var(--sp-24)}
/* Negative inline margin so the lockup's bracket padding does not visually
   indent the logo past the page gutter. */
.brand-link{display:flex;align-items:center;color:var(--on-surface);text-decoration:none;margin-left:calc(var(--sp-16) * -1)}
.scroll-rail{position:absolute;left:0;bottom:-1px;height:1px;width:100%;background:var(--on-surface);transform:scaleX(0);transform-origin:0 50%;display:block}
.site-nav{display:flex;align-items:center;gap:var(--sp-32)}
.site-nav a:not(.nav-cta){font-size:var(--fs-14);line-height:var(--lh-14);color:var(--muted);text-decoration:none;transition:color .12s}
.site-nav a:not(.nav-cta):hover,.site-nav a:not(.nav-cta)[aria-current="page"]{color:var(--on-surface)}
.nav-cta{display:inline-flex;align-items:center;justify-content:center;gap:var(--sp-8);min-height:40px;padding:0 var(--sp-16);border:1px solid var(--on-surface);color:var(--on-surface);text-decoration:none;font-size:var(--fs-14);font-weight:500;white-space:nowrap;transition:background .12s,color .12s}
.nav-cta:hover{background:var(--on-surface);color:var(--surface)}
/* The drawer copy only exists to fill mobile's header-bar gap; the header
   copy only exists to fill desktop's inline slot. Never both at once. */
.nav-cta-drawer{display:none}
@media (max-width:899.98px){
  .nav-cta-header{display:none}
  .nav-cta-drawer{display:flex;width:100%;min-height:52px;margin-top:var(--sp-16)}
}

/* ---- mobile nav: hamburger + collapsing drawer ----
   The drawer stays display:flex at all times below 900px (never none) so
   max-height/opacity can transition — you cannot animate out of display:none. */
.nav-toggle{display:inline-flex;align-items:center;justify-content:center;width:var(--touch-min);height:var(--touch-min);border:1px solid var(--on-surface);background:transparent;color:var(--on-surface);cursor:pointer;position:relative;flex-shrink:0}
.nav-toggle span,.nav-toggle span::before,.nav-toggle span::after{content:'';display:block;position:absolute;left:50%;width:18px;height:1px;background:var(--on-surface);transform:translateX(-50%);transition:transform .22s ease,opacity .22s ease,top .22s ease}
.nav-toggle span{top:50%}
.nav-toggle span::before{top:-6px}
.nav-toggle span::after{top:6px}
.nav-toggle[aria-expanded="true"] span{background:transparent}
.nav-toggle[aria-expanded="true"] span::before{top:0;transform:translateX(-50%) rotate(45deg)}
.nav-toggle[aria-expanded="true"] span::after{top:0;transform:translateX(-50%) rotate(-45deg)}
@media (max-width:899.98px){
  .site-nav{
    position:absolute;top:100%;left:0;right:0;z-index:39;
    flex-direction:column;align-items:stretch;gap:0;
    background:var(--surface);border-bottom:1px solid var(--rule);
    padding:0 var(--gutter);max-height:0;opacity:0;overflow:hidden;pointer-events:none;
    transition:max-height .32s cubic-bezier(.16,1,.3,1),opacity .2s ease;
  }
  .site-nav.is-open{max-height:70vh;opacity:1;pointer-events:auto;padding-bottom:var(--sp-16)}
  .site-nav a:not(.nav-cta){padding:var(--sp-16) 0;border-bottom:1px solid var(--rule);font-size:var(--fs-16);color:var(--on-surface)}
  .site-nav a:not(.nav-cta):last-of-type{border-bottom:none}
}
@media (min-width:900px){.nav-toggle{display:none}}

.site-footer{border-top:1px solid var(--rule);padding:var(--sp-48) 0 var(--sp-32)}
.site-footer-in{max-width:var(--col-wide);margin:0 auto;padding:0 var(--gutter);display:grid;gap:var(--sp-32)}
@media (min-width:768px){.site-footer-in{grid-template-columns:1fr auto;align-items:end}}
.footer-links{display:flex;flex-wrap:wrap;gap:var(--sp-24)}
.footer-links a{font-size:var(--fs-14);color:var(--muted);text-decoration:none}
.footer-links a:hover{color:var(--on-surface)}
/* Staff door: findable, never attention-grabbing. Opacity rather than a
   lighter colour so it reads as recessive on both surfaces. */
.footer-admin{display:inline-block;margin-top:var(--sp-24);font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;opacity:.5;transition:opacity .16s}
.footer-admin:hover{opacity:1;color:var(--on-surface)}

/* ---- marketing section rhythm ---- */
.mkt{max-width:var(--col-wide);margin:0 auto;padding:0 var(--gutter)}
.sec{padding:var(--sp-96) 0}
@media (min-width:768px){.sec{padding:var(--sp-128) 0}}
.sec-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:var(--sp-16) var(--sp-24);padding-bottom:var(--sp-16);border-bottom:1px solid var(--on-surface);margin-bottom:var(--sp-48)}
/* The eyebrow won't shrink below its own text; without a basis+min-width on
   the title, flex gives it min-width:auto (its unwrapped line length) and it
   runs off the right edge on narrow screens instead of wrapping. */
.sec-head-title{flex:1 1 240px;min-width:0;max-width:18ch;text-align:left}
@media (min-width:640px){.sec-head-title{text-align:right}}
.measure{max-width:52ch}

/* ---- coach portrait: the only photograph on the site ----
   Text-first at every width: the portrait is a fixed 232px column beside the
   bio on desktop and sits above it on mobile, rather than a full-bleed hero
   image. The frame is a hairline, matching every other bounded box here. */
.coach-grid{display:grid;gap:var(--sp-32)}
@media (min-width:768px){
  .coach-grid{grid-template-columns:232px minmax(0,1fr);gap:var(--sp-48);align-items:start}
}
.coach-portrait{
  /* Square, capped so it never dominates the column it shares with the bio. */
  position:relative;width:100%;max-width:232px;aspect-ratio:1;
  border:1px solid var(--rule);
  background:var(--grey-100);
}
.coach-portrait img{
  display:block;width:100%;height:100%;object-fit:cover;
  /* The palette is two inks plus the grey ramp — see the header note. Removing
     saturation here means a colour photograph can be swapped in later without
     quietly becoming the page's second hue. */
  filter:grayscale(1);
}
/* Corner ticks, echoing the brackets around the wordmark. Drawn on the frame
   rather than the image so they survive a slow or failed image load. */
.coach-portrait::before,
.coach-portrait::after{
  content:'';position:absolute;width:var(--sp-8);height:var(--sp-8);
  border-color:var(--on-surface);border-style:solid;
}
.coach-portrait::before{top:-1px;left:-1px;border-width:1px 0 0 1px}
.coach-portrait::after{bottom:-1px;right:-1px;border-width:0 1px 1px 0}

/* ---- fluid display type + masked line reveal ---- */
.display-fluid{font-size:var(--fs-fluid-display);line-height:.94;font-weight:400;letter-spacing:-.03em}
.hero-fluid{font-size:var(--fs-fluid-hero);line-height:1.1;font-weight:400;letter-spacing:-.02em}
.line-mask{display:block;overflow:hidden;padding-bottom:.06em}
/* Authored line breaks are the animation's unit — letting the browser re-wrap
   a line would split one masked reveal across two visual rows. */
.line-in{display:block;white-space:nowrap}
/* Same mask-and-slide motif as the hero, but for section titles whose text is
   one arbitrary-length string rather than pre-authored short lines — this one
   is allowed to wrap, so the mask holds however many lines the browser makes. */
.title-mask{display:block;overflow:hidden;padding-bottom:.06em}
.title-in{display:block}

/* ---- hero ---- */
/* Below 1000px this is content-height, top-aligned — forcing full-viewport
   centering on a content stack shorter than the screen just splits the
   difference into dead air above the headline and below the graphic. The
   "fill the viewport" drama is a desktop move, where the two-column grid
   actually uses that height. */
.hero{position:relative;display:grid;gap:var(--sp-32);padding:var(--sp-48) 0}
@media (min-width:1000px){
  .hero{min-height:calc(100svh - var(--header-h));align-items:center;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:var(--sp-64);padding:var(--sp-64) 0}
}
.hero-copy{position:relative;z-index:2}
.meta-row{display:flex;flex-wrap:wrap;gap:var(--sp-8)}
.meta-chip{font-family:var(--font-mono);font-size:var(--fs-12);line-height:var(--lh-12);letter-spacing:.04em;text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:var(--sp-8) var(--sp-16)}

/* The solid sits BELOW the copy in flow on small screens and beside it on
   large. It used to be absolutely positioned behind the copy on mobile and
   dimmed to .7 so the subtitle stayed legible over it — now that it's a
   normal flow sibling instead of an underlay, full opacity reads as a
   confident second element instead of a faded afterthought. Spacing above it
   is the grid's own row-gap only; a second margin-top here used to double it
   up to 80px, which is exactly the "dead air" this graphic got flagged for. */
.solid-stage{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;opacity:1;pointer-events:none}
.solid-stage .solid-svg{max-width:340px}
@media (min-width:1000px){
  .solid-stage{z-index:2}
  .solid-stage .solid-svg{max-width:740px}
}
/* The holder must claim width: it sits in a flex stage, where a plain block
   would shrink to its content and collapse the SVG's width:100%. */
/* .solid-stage is pointer-events:none (decorative, shouldn't block clicks
   around it) and that value inherits — re-enable it here so the touch-drag
   handler in ProfileSolid actually receives events. touch-action:pan-y keeps
   vertical page scroll native; only a horizontal drag ever reaches the JS. */
.solid-holder{width:100%;display:flex;justify-content:center;pointer-events:auto;touch-action:pan-y}
.solid-svg{width:100%;height:auto;max-width:740px;overflow:visible}
/* Per-edge opacity is set imperatively from depth, so these rules carry only
   colour and weight — never opacity, or the two would fight. */
.solid-edge{stroke:var(--on-surface);stroke-width:1;fill:none;vector-effect:non-scaling-stroke}
.solid-edge.spoke{stroke:var(--on-surface)}
.solid-edge.signal{stroke:var(--signal);stroke-width:1.75}
.solid-vertex{fill:var(--surface);stroke:var(--on-surface);stroke-width:1;vector-effect:non-scaling-stroke}
.solid-vertex.signal{fill:var(--signal);stroke:var(--signal)}
.solid-label{font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;fill:var(--signal)}

/* ---- buttons: inline-width variants for marketing ---- */
.btn-inline{width:auto;padding:0 var(--sp-32);display:inline-flex}

/* ---- liquid CTA ----
   The blob is a plain element whose asymmetric border-radius morphs as it
   scales up from the pointer. No SVG filter: a goo filter costs a per-frame
   raster pass and softens the label sitting on top of it. */
.lq{position:relative;overflow:hidden;isolation:isolate;text-decoration:none}
.lq-label{position:relative;z-index:1;display:inline-flex;align-items:center;gap:var(--sp-8);transition:color .28s ease .06s}
.lq-fill{
  position:absolute;z-index:0;
  left:var(--lx,50%);top:var(--ly,50%);
  width:320%;aspect-ratio:1;
  translate:-50% -50%;              /* separate from transform, so scale is free */
  transform:scale(0);
  background:var(--surface);
  border-radius:44% 56% 60% 40% / 52% 46% 54% 48%;
  transition:transform .52s cubic-bezier(.22,.61,.36,1), border-radius .52s ease;
  pointer-events:none;
}
@keyframes lq-wobble{
  0%,100%{border-radius:44% 56% 60% 40% / 52% 46% 54% 48%}
  50%    {border-radius:58% 42% 40% 60% / 44% 56% 44% 56%}
}
/* Pointer devices only. On a touchscreen :hover either never fires or sticks
   after the tap, leaving the button stuck inverted. */
@media (hover:hover) and (pointer:fine){
  .lq:hover .lq-fill{transform:scale(1);animation:lq-wobble 4.5s ease-in-out .5s infinite}
  .lq:hover .lq-label{color:var(--on-surface)}
}
/* Touch gets the same inversion as immediate press feedback, no wobble. */
@media (hover:none){
  .lq:active .lq-fill{transform:scale(1);transition-duration:.28s}
  .lq:active .lq-label{color:var(--on-surface);transition-delay:0s}
}
.lq:focus-visible .lq-fill{transform:scale(1)}
.lq:focus-visible .lq-label{color:var(--on-surface)}
.link-signal{display:inline-flex;align-items:center;gap:var(--sp-8);color:var(--on-surface);text-decoration:none;font-size:var(--fs-16);font-weight:500;border-bottom:1px solid var(--signal);padding-bottom:2px}
.link-signal .arw{color:var(--signal);transition:transform .18s ease}
.link-signal:hover .arw{transform:translateX(4px)}

/* ---- problem section: statement left, qualifying questions right ---- */
.prob-grid{display:grid;gap:var(--sp-48)}
@media (min-width:900px){.prob-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:var(--sp-64);align-items:start}}
.prob-aside{border-top:1px solid var(--on-surface);padding-top:var(--sp-24)}
.prob-list{list-style:none;display:grid;gap:var(--sp-16);margin:0;padding:0}
.prob-list li{display:grid;grid-template-columns:auto 1fr;gap:var(--sp-16);align-items:start;padding-bottom:var(--sp-16);border-bottom:1px solid var(--rule);font-size:var(--fs-16);line-height:var(--lh-16)}
.prob-list li:last-child{border-bottom:none;padding-bottom:0}
.prob-list .mono{color:var(--muted);font-size:var(--fs-12)}

/* ---- scroll-scrubbed word reveal ---- */
.reveal-words{font-size:var(--fs-fluid-hero);line-height:1.18;font-weight:400;letter-spacing:-.02em;max-width:20ch}
.reveal-words .w{display:inline-block;white-space:pre}

/* ---- pinned horizontal instrument scroller ---- */
.hscroll{position:relative}
/* Mobile has no pin, so the track is a normal swipeable row. Scroll snapping
   makes that feel deliberate instead of like an accidental overflow. */
.hscroll-track{display:flex;gap:var(--sp-32);will-change:transform;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;padding-bottom:var(--sp-16);-webkit-overflow-scrolling:touch}
.hscroll-track::-webkit-scrollbar{height:2px}
.hscroll-track::-webkit-scrollbar-thumb{background:var(--rule)}
@media (min-width:900px){
  .hscroll{overflow:hidden}
  .hscroll-track{overflow-x:visible;scroll-snap-type:none;padding-bottom:0}
}
.hpanel{
  flex:0 0 clamp(268px,30vw,400px);
  scroll-snap-align:start;
  scroll-snap-stop:always;
  border-top:1px solid var(--on-surface);
  padding-top:var(--sp-24);
  min-height:clamp(340px,44vh,460px);
  display:flex;flex-direction:column;
}
/* Mobile-only focus dim: the panel at the track's leading edge stays full
   contrast, the rest recede — same front/back logic as the hero solid's
   signal vertex, tracked live off native scrollLeft (see InstrumentScroller). */
@media (max-width:899px){
  .hpanel{opacity:.3;transform:scale(.97);transition:opacity .3s ease,transform .3s ease}
  .hpanel.is-active{opacity:1;transform:scale(1)}
}
.hpanel .idx{font-family:var(--font-mono);font-size:clamp(44px,6vw,84px);line-height:1;color:var(--muted);margin-bottom:var(--sp-48)}
.hpanel-body{flex:1;display:flex;flex-direction:column}
.hpanel .name{font-size:var(--fs-24);line-height:var(--lh-24);font-weight:500;margin-bottom:var(--sp-8)}
.hpanel-src{font-size:var(--fs-12);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding-bottom:var(--sp-16);margin-bottom:var(--sp-16);border-bottom:1px solid var(--rule)}
.hpanel-what{max-width:34ch}
/* Sits on the panel's baseline so the four payoff lines align across the row
   regardless of how long each description runs. */
.hpanel-tells{margin-top:var(--sp-24);padding-top:var(--sp-16);border-top:1px solid var(--rule);font-size:var(--fs-14);line-height:var(--lh-14);font-weight:500}
.hscroll-progress{margin-top:var(--sp-32)}
@media (min-width:900px){.hscroll-progress{margin-top:var(--sp-48)}}
/* Names what the rail is tracking — same drafting-callout logic as .dim-line
   (the assessment's own progress readout), so the marketing page previews the
   product's own visual language instead of inventing a one-off. */
.hscroll-count{display:flex;gap:var(--sp-4);font-size:var(--fs-14);letter-spacing:.02em;margin-bottom:var(--sp-8);font-variant-numeric:tabular-nums}
.hscroll-count .of{color:var(--muted)}
@media (min-width:900px){.hscroll-count{display:none}}
.hscroll-rail{height:1px;background:var(--rule);position:relative}
.hscroll-rail i{position:absolute;inset:0 auto 0 0;width:0;background:var(--on-surface);display:block}

/* ---- pinned unlock demo ---- */
.unlock-grid{display:grid;gap:var(--sp-48);align-items:center}
@media (min-width:900px){.unlock-grid{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}}
.unlock-counter{font-family:var(--font-mono);font-size:clamp(64px,9vw,128px);line-height:1;font-variant-numeric:tabular-nums}
.unlock-counter .of{font-size:var(--fs-24);color:var(--muted)}

/* ---- coaching framework: the drawn 5-step sequence ---- */
.fw-top{display:grid;gap:var(--sp-32);margin-bottom:var(--sp-64)}
@media (min-width:768px){.fw-top{grid-template-columns:1fr auto;align-items:end}}
.fw-stat{text-align:left}
@media (min-width:768px){.fw-stat{text-align:right}}
.fw-stat-n{font-size:clamp(56px,7vw,104px);line-height:.9;font-variant-numeric:tabular-nums}

.fw-steps{position:relative}
/* Rail sits on the node column centre: gutter (28px) / 2 - half a hairline. */
.fw-rail{position:absolute;left:13px;top:0;bottom:0;width:1px;background:var(--on-surface);transform:scaleY(0);transform-origin:50% 0;pointer-events:none}
@media (min-width:900px){.fw-rail{left:13px}}
.fw-list{list-style:none;display:grid;gap:var(--sp-48);margin:0;padding:0}
.fw-step{position:relative;padding-left:var(--sp-48);display:grid;gap:var(--sp-8)}
@media (min-width:900px){
  .fw-step{grid-template-columns:auto minmax(0,1fr) minmax(0,240px);gap:var(--sp-32);align-items:start}
}
.fw-node{position:absolute;left:9px;top:6px;width:9px;height:9px;background:var(--surface);border:1px solid var(--on-surface);border-radius:50%}
.fw-num{font-size:var(--fs-20);line-height:var(--lh-20);color:var(--muted);font-variant-numeric:tabular-nums}
.fw-title{font-size:var(--fs-24);line-height:var(--lh-24);font-weight:500;margin-bottom:var(--sp-8)}
.fw-body{min-width:0}
.fw-meta{display:flex;flex-wrap:wrap;align-items:center;gap:var(--sp-8)}
@media (min-width:900px){.fw-meta{flex-direction:column;align-items:flex-end;text-align:right}}
.fw-deliv{border-top:1px solid var(--rule);padding-top:var(--sp-8);width:100%}
@media (max-width:899px){.fw-deliv{border-top:none;padding-top:0;width:auto}}

.fw-cta{margin-top:var(--sp-64);display:flex;flex-wrap:wrap;align-items:center;gap:var(--sp-24)}

/* ---- axis marquee ---- */
.marquee{overflow:hidden;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:var(--sp-24) 0}
.marquee-track{display:flex;width:max-content;will-change:transform}
.marquee-item{font-family:var(--font-mono);font-size:var(--fs-14);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:0 var(--sp-32);white-space:nowrap}
.marquee-item .dot{color:var(--on-surface);margin-right:var(--sp-32)}

/* ---- tool card (the assessments grid, one live entry) ---- */
.tool-grid{display:grid;gap:var(--sp-24)}
@media (min-width:768px){.tool-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}}
.tool-card{display:block;border:1px solid var(--rule);padding:var(--sp-32);text-decoration:none;color:var(--on-surface);transition:border-color .16s,background .16s}
.tool-card:hover{border-color:var(--on-surface)}
.tool-card .status{font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.06em;text-transform:uppercase;color:var(--signal)}

/* ---- mini unlock preview (homepage demo of the real mechanic) ---- */
/* No CSS transition here on purpose — GSAP drives filter/opacity, and a
   transition on the same properties would fight it every frame. */
.mini-stack{display:grid;gap:var(--sp-8)}
.mini-panel{border:1px solid var(--rule);padding:var(--sp-16);filter:blur(5px);opacity:.5}

/* ---- discovery-session calendar ----
   Day columns on a 1px grid-gap "hairline table". One border between cells
   rather than a border per button: 160 individually outlined chips was the
   noise problem in the first build. */
.cal{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(104px,1fr);gap:1px;background:var(--rule);border:1px solid var(--rule);overflow-x:auto;overscroll-behavior-x:contain}
.cal-day{background:var(--surface);display:flex;flex-direction:column;min-width:0}
.cal-head{padding:var(--sp-16) var(--sp-8);border-bottom:1px solid var(--rule);text-align:center}
.cal-dow{font-size:var(--fs-12);line-height:var(--lh-12);letter-spacing:.1em;color:var(--muted)}
.cal-date{font-size:var(--fs-24);line-height:var(--lh-24);font-variant-numeric:tabular-nums}
.cal-times{display:flex;flex-direction:column}
.cal-slot{min-height:var(--touch-min);border:none;border-bottom:1px solid var(--rule);background:transparent;color:var(--on-surface);font-family:var(--font-mono);font-size:var(--fs-14);font-variant-numeric:tabular-nums;cursor:pointer;transition:background .12s,color .12s}
.cal-slot:last-child{border-bottom:none}
.cal-slot:hover:not(:disabled){background:var(--on-surface);color:var(--surface)}
.cal-slot.sel{background:var(--on-surface);color:var(--surface)}
.cal-slot:disabled{color:var(--muted);cursor:not-allowed}
.cal-more{min-height:36px;border:none;border-bottom:1px solid var(--rule);background:transparent;color:var(--muted);font-family:var(--font-mono);font-size:var(--fs-12);cursor:pointer}
.cal-more:hover{color:var(--on-surface)}
.cal-expand{margin-top:var(--sp-16);background:none;border:none;padding:0;cursor:pointer;font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--rule);padding-bottom:2px}
.cal-expand:hover{color:var(--on-surface);border-color:var(--on-surface)}
/* Locked: recede the whole table once, instead of restyling every cell. */
.cal-wrap{position:relative}
.cal.is-locked{opacity:.4}
.cal.is-locked .cal-slot{text-decoration:line-through;text-decoration-thickness:1px}
.cal-lock{position:absolute;inset:0;z-index:2;display:grid;place-items:center;pointer-events:none;padding:var(--sp-16)}
.cal-lock-badge{
  display:inline-flex;align-items:center;gap:var(--sp-8);
  padding:var(--sp-8) var(--sp-16);
  font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.14em;text-transform:uppercase;
  color:var(--on-surface);
  border:1px solid var(--on-surface);
  /* The "glass": a translucent wash over the grid plus a blur of what's
     behind it. color-mix keeps it surface-aware, so it frosts correctly on
     both the ink and paper surfaces without a second rule. */
  background:color-mix(in oklab, var(--surface) 72%, transparent);
  -webkit-backdrop-filter:blur(7px) saturate(140%);
  backdrop-filter:blur(7px) saturate(140%);
}
/* No backdrop-filter (older Firefox/Safari): fall back to an opaque chip
   rather than an unreadable transparent one. */
@supports not (backdrop-filter:blur(1px)){
  .cal-lock-badge{background:var(--surface)}
}

.gate-note{display:flex;gap:var(--sp-16);align-items:flex-start;border-left:2px solid var(--signal);padding-left:var(--sp-16);margin-bottom:var(--sp-32)}
/* The recovery affordance is a <button> for correct semantics, so it needs the
   UA button chrome removed or it renders as a boxed control. */
.link-btn{background:none;border:none;padding:0;font:inherit;cursor:pointer}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .link-signal:hover .arw{transform:none}
}

/* ============================================================
   Admin — same tokens, denser rhythm (wrap-wide)
   ============================================================ */
.a-btn{height:40px;border:1px solid var(--grey-200);background:var(--paper);font-size:var(--fs-14);font-weight:500;cursor:pointer;font-family:var(--font-body);padding:0 var(--sp-16);color:var(--ink);border-radius:var(--radius)}
.a-btn:hover{background:var(--grey-100)}
.a-btn.primary{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.a-btn.danger{color:var(--ink);border-color:var(--grey-300)}
.a-btn.danger:hover{background:var(--grey-100)}
.a-btn:disabled{opacity:.5;cursor:not-allowed}
.a-list-row{display:flex;align-items:center;gap:var(--sp-16);padding:var(--sp-16);border-bottom:1px solid var(--grey-200);cursor:pointer}
.a-list-row:hover{background:var(--grey-100)}
.a-list-row:last-child{border-bottom:none}
.a-badge{font-family:var(--font-mono);font-size:var(--fs-12);font-weight:500;letter-spacing:.04em;padding:var(--sp-4) var(--sp-8);border:1px solid var(--grey-300);text-transform:uppercase}
.a-badge.new{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.a-badge.fallback{color:var(--grey-600)}
/* Entry intent. Monochrome on purpose — admin is a working surface, and
   --signal is reserved for the three marketing uses in the header note. */
.a-badge.intent{border-color:var(--ink);color:var(--ink);font-weight:600}
.a-badge.holland{letter-spacing:2px}
.a-search{height:44px;border:1px solid var(--grey-200);border-radius:var(--radius);padding:0 var(--sp-16);font-size:var(--fs-16);font-family:var(--font-body);outline:none;width:100%;background:var(--paper)}
.a-search:focus{border-color:var(--ink)}
.a-resp-row{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-16);padding:var(--sp-8) 0;border-bottom:1px solid var(--grey-200)}
.a-resp-row:last-child{border-bottom:none}
.a-dot{width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--fs-12);font-weight:500;color:var(--paper);background:var(--ink);flex-shrink:0}
`

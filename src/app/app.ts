import { Component, HostListener, afterNextRender, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommandPalette } from './shared/command-palette';
import { SearchService } from './shared/search.service';
import { initScrollLock } from './shared/scroll-lock';
import { A11yService, A11Y_PROFILES, A11yProfile } from './shared/a11y.service';

interface A11yTile { label: string; icon: string; on: () => boolean; run: () => void; level?: () => number; badge?: boolean }
import { FormsModule } from '@angular/forms';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { ScrollTop } from 'primeng/scrolltop';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { IMPORTANT_LINKS, LOGIN_MENU, NAV, QUICK_LINKS, SITE, SOCIAL } from './shared/site';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPalette, FormsModule, RouterLink, RouterOutlet, ButtonDirective, Menu, Menubar, ScrollTop, Select, ToggleSwitch, Tooltip,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly site = SITE;
  readonly year = new Date().getFullYear();
  readonly nav = NAV;
  readonly loginMenu = LOGIN_MENU;
  readonly quickLinks = QUICK_LINKS;
  readonly importantLinks = IMPORTANT_LINKS;
  readonly social = SOCIAL;

  search = inject(SearchService);
  progress = signal(0);
  scrolled = signal(false);

  private ticking = false;

  navigating = signal(false);

  constructor() {
    initScrollLock();
    // the header sticks just below the sticky utility bar; keep --topbar-h equal to the bar's real height (it wraps on small screens and grows with text size)
    afterNextRender(() => {
      const bar = document.querySelector<HTMLElement>('.topbar');
      if (!bar) return;
      const set = () => document.documentElement.style.setProperty('--topbar-h', bar.getBoundingClientRect().height + 'px');
      set();
      new ResizeObserver(set).observe(bar);
    });
    let navTimer: ReturnType<typeof setTimeout> | undefined;
    inject(Router).events.subscribe((e) => {
      // only show the bar if a navigation is still pending after 150ms, so fast page changes never flash it
      if (e instanceof NavigationStart) { clearTimeout(navTimer); navTimer = setTimeout(() => this.navigating.set(true), 150); }
      else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) { clearTimeout(navTimer); this.navigating.set(false); }
    });
    document.addEventListener('click', (e) => {
      const li = this.hoverOpened;
      if (li && (e.target as Element).closest?.('.p-menubar-item-content') && li.contains(e.target as Node) && li.getAttribute('aria-expanded') === 'true') { e.stopPropagation(); this.hoverOpened = null; }
    }, true);
    // a saved choice wins; first-time visitors get the default (Govt Blue) theme without it being written to storage
    let saved: string | null = null;
    try { saved = localStorage.getItem(App.THEME_KEY); } catch { /* storage unavailable */ }
    const initial = this.themes.find((x) => x.key === saved) ?? this.themes.find((x) => x.key === App.DEFAULT_THEME)!;
    this.setTheme(initial, false);
    // Passive + rAF-throttled: scrolling never blocks, and signals only change when the value does.
    window.addEventListener('scroll', () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => { this.ticking = false; this.onScroll(); });
    }, { passive: true });
  }

  private onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
    if (Math.abs(p - this.progress()) > 0.002) this.progress.set(p);
    // hysteresis: switch to the bar past 80px, back to the pill only above 30px, so small scroll jitter near one threshold can't flip it back and forth
    const s = this.scrolled() ? h.scrollTop > 30 : h.scrollTop > 80;
    if (s !== this.scrolled()) this.scrolled.set(s);
  }


  // Desktop nav: open a submenu on hover, close it shortly after the pointer leaves (PrimeNG menubar is click-only).
  private navTimer: ReturnType<typeof setTimeout> | undefined;
  private hoverOpened: Element | null = null;
  private static readonly ROOT = '.main-nav .p-menubar-root-list > li';

  @HostListener('document:mouseover', ['$event'])
  onNavHover(e: MouseEvent) {
    if (!matchMedia('(hover: hover)').matches) return;
    const li = (e.target as Element | null)?.closest?.(App.ROOT) ?? null;
    const open = document.querySelector(`${App.ROOT}[aria-expanded="true"]`);
    const toggle = (el: Element) => el.querySelector<HTMLElement>('.p-menubar-item-content')?.click();
    clearTimeout(this.navTimer);
    if (li?.hasAttribute('aria-haspopup')) {
      if (open && open !== li) { this.hoverOpened = null; toggle(open); }
      if (li.getAttribute('aria-expanded') === 'false') { this.hoverOpened = li; this.navTimer = setTimeout(() => toggle(li), 70); }
    } else if (open && open !== li) {
      this.navTimer = setTimeout(() => { this.hoverOpened = null; if (open.getAttribute('aria-expanded') === 'true') toggle(open); }, 220);
    }
  }
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '');
    if (e.ctrlKey && e.key === 'F2') { e.preventDefault(); this.toggleA11yByKey(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.search.open.update((o) => !o); }
    else if (e.key === '/' && !typing) { e.preventDefault(); this.search.show(); }
  }



  a11y = inject(A11yService);
  a11yOpen = signal(false);
  a11yView = signal<'grid' | 'list'>('grid');
  a11yOpenSections = signal<Record<string, boolean>>({ profile: false, color: true, content: true, orient: true });
  readonly profiles = A11Y_PROFILES;
  private a11yTrigger: HTMLElement | null = null;

  openA11y(e: Event) {
    e.stopPropagation();
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = e.currentTarget as HTMLElement;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  closeA11y() { this.a11yOpen.set(false); this.a11yTrigger?.focus(); }
  toggleA11yByKey() {
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = document.activeElement as HTMLElement | null;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  toggleSection(k: string) { this.a11yOpenSections.update((s) => ({ ...s, [k]: !s[k] })); }
  activeProfile = signal<string | null>(null);
  applyProfile(p: A11yProfile) {
    if (this.activeProfile() === p.key) { this.resetA11y(); return; } // tapping the active profile turns it off
    this.a11y.applyProfile(p); this.setFontScale(p.text ?? 100); this.activeProfile.set(p.key);
  }
  resetA11y() { this.activeProfile.set(null); this.a11y.reset(); this.setFontScale(100); if (this.dark()) this.toggleDark(false); }

  /** 0 = normal, 1 = 115 %, 2 = 130 % */
  textLevel = computed(() => (this.fontScale() >= 130 ? 2 : this.fontScale() >= 115 ? 1 : 0));
  cycleText() { this.setFontScale([115, 130, 100][this.textLevel()]); }

  private tile(label: string, icon: string, on: () => boolean, run: () => void, level?: () => number): A11yTile { return { label, icon, on, run, level }; }
  readonly colorTiles: A11yTile[] = [
    this.tile('Monochrome', 'svg:drop-dots', () => this.a11y.prefs().gray, () => this.a11y.toggle('gray')),
    this.tile('High Saturate', 'svg:drop-half', () => this.a11y.prefs().satHigh, () => this.a11y.setSaturation('satHigh')),
    this.tile('Low Saturate', 'svg:drop-fade', () => this.a11y.prefs().satLow, () => this.a11y.setSaturation('satLow')),
    this.tile('Dark Mode', 'pi-moon', () => this.dark(), () => this.toggleDark(!this.dark())),
    this.tile('Invert Color', 'pi-sync', () => this.a11y.prefs().invert, () => this.a11y.toggle('invert')),
    this.tile('High Contrast', 'pi-eye', () => this.a11y.prefs().contrast, () => this.a11y.toggle('contrast')),
  ];
  readonly contentTiles: A11yTile[] = [
    this.tile('Bigger Text', 'A+', () => this.textLevel() > 0, () => this.cycleText(), () => this.textLevel()),
    this.tile('Line Height', 'svg:lineh', () => this.a11y.prefs().lineh > 0, () => this.a11y.cycle('lineh'), () => this.a11y.prefs().lineh),
    this.tile('Text Spacing', 'svg:spacing', () => this.a11y.prefs().spacing > 0, () => this.a11y.cycle('spacing'), () => this.a11y.prefs().spacing),
    this.tile('Highlight Links', 'pi-link', () => this.a11y.prefs().links, () => this.a11y.toggle('links')),
    this.tile('Dyslexia Friendly', 'Df', () => this.a11y.prefs().dyslexia, () => this.a11y.toggle('dyslexia')),
    { ...this.tile('Text Magnify', 'pi-search-plus', () => this.a11y.prefs().magnify, () => this.a11y.toggle('magnify')), badge: true },
    this.tile('Cursor Size', 'pi-arrow-up-left', () => this.a11y.prefs().cursor > 0, () => this.a11y.cycle('cursor'), () => Math.min(2, this.a11y.prefs().cursor)),
  ];
  readonly orientTiles: A11yTile[] = [
    this.tile('Screen Reader', 'pi-volume-up', () => this.a11y.prefs().reader, () => this.a11y.toggle('reader')),
    this.tile('Voice Support', 'pi-microphone', () => this.a11y.prefs().voice, () => this.a11y.toggle('voice')),
    this.tile('Pause Animation', 'pi-pause', () => this.a11y.prefs().motion, () => this.a11y.toggle('motion')),
    this.tile('Hide Images', 'pi-image', () => this.a11y.prefs().images, () => this.a11y.toggle('images')),
    this.tile('Focus Mode', 'pi-bullseye', () => this.a11y.prefs().focusMode, () => this.a11y.toggle('focusMode')),
    this.tile('Reading Guides', 'pi-align-justify', () => this.a11y.prefs().guide, () => this.a11y.toggle('guide')),
    this.tile('Focus Ring', 'pi-stop', () => this.a11y.prefs().focus, () => this.a11y.toggle('focus')),
    this.tile('Light Mode', 'pi-wifi', () => this.a11y.prefs().lite, () => this.a11y.toggle('lite')),
  ];

  setLanguage(code: string) { document.documentElement.lang = code; }
  readonly themes: { key: string; name: string; main: string; a2: string; a3: string; accent: string; ink: string; bn?: { main: string; a2: string; a3: string; accent: string } }[] = [
    // official = the base look baked into tokens.scss (the site starts on DEFAULT_THEME); its banners keep the original blue/saffron palette (bn)
    { key: 'official', name: 'Govt Blue', main: '#1a4a94', a2: '#2f6bc4', a3: '#cfe0f7', accent: '#e8891d', ink: '#9a5a05', bn: { main: '#1b5cb8', a2: '#3b8de6', a3: '#bcd9f7', accent: '#f5992a' } },
    { key: 'saffron', name: 'Saffron', main: '#b45309', a2: '#e8891d', a3: '#fcd9a0', accent: '#f5a524', ink: '#8a4b00' },
    { key: 'emerald', name: 'Emerald', main: '#0b6b4b', a2: '#27a577', a3: '#bfeede', accent: '#e8a21d', ink: '#8a5a00' },
    { key: 'teal', name: 'Teal', main: '#0b6b78', a2: '#1fa5b3', a3: '#bcecf0', accent: '#e8891d', ink: '#9a5a05' },
    { key: 'rose', name: 'Rose', main: '#a8174f', a2: '#d9457f', a3: '#f8cfe0', accent: '#e8a21d', ink: '#8a5a00' },
    { key: 'violet', name: 'Violet', main: '#4f35b0', a2: '#7a5fe0', a3: '#d8d0fa', accent: '#e8891d', ink: '#9a5a05' },
  ];
  private static readonly DEFAULT_THEME = 'official';
  /** v3: choices saved before Govt Blue became the default are ignored once, so everyone starts on Govt Blue. */
  private static readonly THEME_KEY = 'dg-theme-v3';
  theme = signal(this.themes.find((x) => x.key === App.DEFAULT_THEME)!);
  themeOpen = signal(false);

  private static readonly THEME_PROPS = ['--brand', '--brand-rgb', '--brand-2', '--brand-2-rgb', '--brand-3', '--accent', '--accent-rgb', '--accent-ink', '--ink-rgb',
    '--bn-brand', '--bn-brand-rgb', '--bn-brand-2', '--bn-brand-2-rgb', '--bn-brand-3', '--bn-accent', '--bn-accent-rgb', '--bn-ink-rgb'];

  setTheme(t: (typeof this.themes)[number], persist = true) {
    this.theme.set(t);
    const s = document.documentElement.style;
    if (persist) { try { localStorage.setItem(App.THEME_KEY, t.key); } catch { /* storage unavailable */ } }
    // the default theme lives entirely in tokens.scss (light + dark), so clear any runtime overrides instead of re-setting them
    if (t.key === 'official') { App.THEME_PROPS.forEach((p) => s.removeProperty(p)); return; }
    const dark = this.dark();
    const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const hexOf = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
    // in dark mode interactive colours are lifted toward white so they stay readable on dark surfaces
    const lift = (hex: string) => (dark ? hexOf(rgb(hex).map((v) => Math.round(v + (255 - v) * 0.4))) : hex);
    const main = lift(t.main), a2 = lift(t.a2);
    // everything else (banners, footer, tinted backgrounds, borders) is derived from these in tokens.scss, so a theme re-colours the whole site
    s.setProperty('--brand', main);
    s.setProperty('--brand-rgb', rgb(main).join(', '));
    s.setProperty('--brand-2', a2);
    s.setProperty('--brand-2-rgb', rgb(a2).join(', '));
    s.setProperty('--brand-3', t.a3);
    s.setProperty('--accent', t.accent);
    s.setProperty('--accent-rgb', rgb(t.accent).join(', '));
    s.setProperty('--accent-ink', dark ? lift(t.accent) : t.ink);
    s.setProperty('--ink-rgb', rgb(t.main).map((c) => Math.round(c * 0.5)).join(', '));
    // banners (hero + page banners) read their own palette so they stay as designed; the picker still tints them
    const b = t.bn ?? { main: t.main, a2: t.a2, a3: t.a3, accent: t.accent };
    s.setProperty('--bn-brand', b.main);
    s.setProperty('--bn-brand-rgb', rgb(b.main).join(', '));
    s.setProperty('--bn-brand-2', b.a2);
    s.setProperty('--bn-brand-2-rgb', rgb(b.a2).join(', '));
    s.setProperty('--bn-brand-3', b.a3);
    s.setProperty('--bn-accent', b.accent);
    s.setProperty('--bn-accent-rgb', rgb(b.accent).join(', '));
    s.setProperty('--bn-ink-rgb', rgb(b.main).map((c) => Math.round(c * 0.7)).join(', '));
  }

  @HostListener('document:click')
  closeThemePicker() { if (this.themeOpen()) this.themeOpen.set(false); }

  @HostListener('document:keydown.escape')
  escThemePicker() { this.themeOpen.set(false); if (this.a11yOpen()) this.closeA11y(); }
  dark = signal(false);
  fontScale = signal(100);

  languages = [
    { label: 'English', code: 'en' },
    { label: 'ગુજરાતી', code: 'gu' },
  ];
  language = this.languages[0];

  toggleDark(on: boolean) {
    this.dark.set(on);
    document.documentElement.classList.toggle('app-dark', on);
    if (this.theme().key !== 'official') this.setTheme(this.theme(), false); // re-derive the theme colours for the new mode
  }

  setFontScale(v: number) { this.fontScale.set(v); document.documentElement.style.fontSize = v + '%'; }

  setFont(delta: number) {
    const v = delta === 0 ? 100 : Math.min(130, Math.max(85, this.fontScale() + delta));
    this.fontScale.set(v);
    document.documentElement.style.fontSize = v + '%';
  }

  /** Jump past the banner/breadcrumb to the first real content block of the current page. */
  skipToMain(e: Event) {
    e.preventDefault();
    const el = document.querySelector<HTMLElement>('[data-main]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }
}

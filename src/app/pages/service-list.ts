import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Reveal, Tilt } from '../shared/motion';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Tag } from 'primeng/tag';
import { PageHero } from '../shared/page-hero';
import { IMG, SITE } from '../shared/site';
import citizen from '../data/citizen.json';
import sugam from '../data/sugam.json';
import dss from '../data/dss.json';
import janseva from '../data/janseva.json';

interface Item { title: string; img: string; }

const CONFIG: Record<string, { title: string; subtitle: string; page: string; items: Item[] }> = {
  citizen: { title: 'Citizen Services', subtitle: 'Certificates and passes available to every citizen of Gujarat.', page: 'Services/CitizenServices.aspx', items: citizen },
  sugam: { title: 'Sugam Digital Gujarat', subtitle: 'Online services — apply from home.', page: 'Services/SugamDGAbhiyanServices.aspx', items: sugam },
  dss: { title: 'Digital SevaSetu Services', subtitle: 'Department schemes and subsidies delivered through Digital SevaSetu.', page: 'Services/DSSServices.aspx', items: dss },
  janseva: { title: 'Janseva Services', subtitle: 'Services available through Janseva Kendras.', page: 'Services/JansevaServices.aspx', items: janseva },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-service-list',
  imports: [FormsModule, RouterLink, ButtonDirective, IconField, InputIcon, InputText, Paginator, Tag, PageHero, Reveal, Tilt],
  template: `
    <app-page-hero [title]="cfg().title" [subtitle]="cfg().subtitle" [trail]="trail" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <div class="list-toolbar">
          <p-iconfield class="grow">
            <p-inputicon class="pi pi-search" />
            <input pInputText type="search" enterkeyhint="search" autocomplete="off" [ngModel]="query()" (ngModelChange)="setQuery($event)" placeholder="Search in {{ cfg().title }}…" aria-label="Search services" />
          </p-iconfield>
          <p-tag [value]="filtered().length + ' services'" severity="contrast" [rounded]="true" />
          @if (key() === 'sugam') {
            <a pButton [outlined]="true" routerLink="/user-manual"><i class="pi pi-book"></i> User Manual</a>
          }
          @if (key() === 'janseva') {
            <a pButton [outlined]="true" [href]="site + 'Download/JanSevaKendraList.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i> Janseva Kendra list</a>
            <p-tag value="Office time: 10 AM – 6 PM" icon="pi pi-clock" severity="warn" [rounded]="true" />
          }
        </div>

        @if (pageItems().length) {
          <div class="svc-grid">
            @for (s of pageItems(); track s.title + $index) {
              <article class="svc-card" appTilt [appReveal]="'up'" [revealDelay]="($index % 4) * 70">
                <span class="num">{{ first() + $index + 1 }}</span>
                <img [src]="img(s.img)" alt="" loading="lazy">
                <h3>{{ s.title }}</h3>
                <a class="more" [href]="site + cfg().page" target="_blank" rel="noopener">Read more <i class="pi pi-arrow-right"></i></a>
              </article>
            }
          </div>
          <p-paginator [first]="first()" [rows]="rows" [totalRecords]="filtered().length" (onPageChange)="onPage($event)" [showCurrentPageReport]="true" currentPageReportTemplate="{first} – {last} of {totalRecords}" />
        } @else {
          <p class="empty"><i class="pi pi-search"></i> No services match “{{ query() }}”.</p>
        }
      </div>
    </section>
  `,
})
export class ServiceListPage {
  readonly site = SITE;
  readonly rows = 12;
  private data = toSignal(inject(ActivatedRoute).data, { requireSync: true });
  key = computed<string>(() => this.data()['key']);
  cfg = computed(() => CONFIG[this.key()]);
  trail = [{ label: 'Services' }];
  query = signal('');
  first = signal(0);
  private qp = toSignal(inject(ActivatedRoute).queryParamMap);

  constructor() {
    effect(() => {
      const q = this.qp()?.get('q');
      if (q) { this.query.set(q); this.first.set(0); }
    });
  }

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const items = this.cfg().items;
    return tokens.length ? items.filter((i) => tokens.every((t) => i.title.toLowerCase().includes(t))) : items;
  });

  pageItems = computed(() => this.filtered().slice(this.first(), this.first() + this.rows));

  setQuery(v: string) { this.query.set(v); this.first.set(0); }
  onPage(e: PaginatorState) { this.first.set(e.first ?? 0); document.querySelector('[data-main]')?.scrollIntoView({ behavior: 'smooth' }); }
  img(p: string) { return IMG + encodeURI(p); }
}

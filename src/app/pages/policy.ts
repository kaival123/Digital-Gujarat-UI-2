import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import policies from '../data/policies.json';

interface Block { t: 'h' | 'p' | 'li'; x: string; }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-policy',
  imports: [PageHero, Reveal],
  template: `
    <app-page-hero [title]="title()" />
    <section class="section" data-main tabindex="-1">
      <article class="container prose" appReveal="up">
        @for (b of blocks(); track $index) {
          @switch (b.t) {
            @case ('h') { <h2>{{ b.x }}</h2> }
            @case ('li') { <p class="bullet"><i class="pi pi-check-circle"></i><span>{{ b.x }}</span></p> }
            @default { <p>{{ b.x }}</p> }
          }
        }
      </article>
    </section>
  `,
})
export class PolicyPage {
  private data = toSignal(inject(ActivatedRoute).data, { requireSync: true });
  title = computed<string>(() => this.data()['title']);
  blocks = computed<Block[]>(() => (policies as Record<string, Block[]>)[this.data()['key']] ?? []);
}

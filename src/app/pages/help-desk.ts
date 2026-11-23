import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { IMG, abs } from '../shared/site';

interface Topic { label: string; icon: string; }

/** Helpdesk runs 10:00–18:00 every day of the week (India Standard Time). */
const OPEN_MIN = 10 * 60;
const CLOSE_MIN = 18 * 60;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-help-desk',
  imports: [PageHero, Reveal, RouterLink],
  template: `
    <app-page-hero title="Helpdesk Support" subtitle="Stuck on an application or a payment? Our support team is one call away." />

    <section class="section hd-intro" data-main tabindex="-1">
      <div class="container hd">
        <div class="hd-copy" appReveal="left">
          <span class="hd-status" [class.is-open]="open()" role="status">
            <span class="dot" aria-hidden="true"></span>
            {{ open() ? 'We are online now' : 'Currently closed' }}
            <small>· {{ open() ? 'Closes at 6:00 PM' : 'Opens at 10:00 AM' }}</small>
          </span>
          <h2>Need support for any <span class="accent">service?</span></h2>
          <p>The support team is available to assist you from <b>10:00 AM to 6:00 PM, Monday through Sunday</b>. Please feel free to reach out during these hours for any assistance you may need.</p>

          <div class="hd-contact">
            <a class="hd-call" href="tel:18002335500">
              <span class="ring" aria-hidden="true"><i class="pi pi-phone"></i></span>
              <span><small>Toll Free</small><b>1800 233 5500</b></span>
            </a>
            <a class="hd-mail" href="mailto:dss-support@gujarat.gov.in">
              <span class="ring" aria-hidden="true"><i class="pi pi-envelope"></i></span>
              <span><small>Support Email ID</small><b>dss-support&#64;gujarat.gov.in</b></span>
            </a>
          </div>
        </div>

        <div class="hd-art" appReveal="zoom">
          <span class="blob b1" aria-hidden="true"></span><span class="blob b2" aria-hidden="true"></span>
          <img [src]="img" alt="Helpdesk illustration" width="440" height="440">
          <div class="hd-hours" aria-label="Support hours">
            <i class="pi pi-clock" aria-hidden="true"></i>
            <span><b>10:00 AM – 6:00 PM</b><small>Monday to Sunday</small></span>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt hd-topics">
      <div class="container">
        <div class="section-head" appReveal="up">
          <h2>What can we <span class="accent">help you with?</span></h2>
          <p>Our support team is available to help you resolve your queries related to:</p>
        </div>

        <h3 class="hd-group" appReveal="left"><i class="pi pi-th-large" aria-hidden="true"></i> Services</h3>
        <ul class="hd-grid">
          @for (t of services; track t.label; let i = $index) {
            <li class="hd-topic" [appReveal]="'up'" [revealDelay]="i * 70">
              <span class="ic"><i [class]="'pi ' + t.icon" aria-hidden="true"></i></span>
              <span class="tx">{{ t.label }}</span>
            </li>
          }
        </ul>

        <h3 class="hd-group" appReveal="left"><i class="pi pi-wallet" aria-hidden="true"></i> Payments</h3>
        <ul class="hd-grid">
          @for (t of payments; track t.label; let i = $index) {
            <li class="hd-topic pay" [appReveal]="'up'" [revealDelay]="i * 70">
              <span class="ic"><i [class]="'pi ' + t.icon" aria-hidden="true"></i></span>
              <span class="tx">{{ t.label }}</span>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section hd-guides">
      <div class="container">
        <div class="section-head" appReveal="up">
          <h2>Guides to <span class="accent">get started</span></h2>
          <p>Download the user manual, or browse the Sugam service guides.</p>
        </div>
        <div class="hd-guide-grid">
          @for (m of manuals; track m.label; let i = $index) {
            <a class="hd-guide" [appReveal]="'up'" [revealDelay]="i * 90" [href]="m.url" target="_blank" rel="noopener">
              <span class="ic"><i class="pi pi-file-pdf" aria-hidden="true"></i></span>
              <span class="tx"><small>Download User Manual</small><b>{{ m.label }}</b></span>
              <i class="pi pi-download dl" aria-hidden="true"></i>
            </a>
          }
          <a class="hd-guide sugam" appReveal="up" [revealDelay]="180" routerLink="/user-manual">
            <span class="ic"><i class="pi pi-book" aria-hidden="true"></i></span>
            <span class="tx"><small>Step-by-step guides</small><b>Sugam User Manual</b></span>
            <i class="pi pi-arrow-right dl" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </section>

    <section class="hd-cta-wrap">
      <div class="container">
        <div class="hd-cta" appReveal="zoom">
          <div>
            <h2>Still need <span class="accent">help?</span></h2>
            <p>Reach us any day, 10:00 AM to 6:00 PM. Call toll free or write to us and we will get back to you.</p>
          </div>
          <div class="hd-cta-actions">
            <a class="hd-btn primary" href="tel:18002335500"><i class="pi pi-phone" aria-hidden="true"></i> 1800 233 5500</a>
            <a class="hd-btn ghost" href="mailto:dss-support@gujarat.gov.in"><i class="pi pi-envelope" aria-hidden="true"></i> Email support</a>
            <a class="hd-btn ghost" routerLink="/feedback"><i class="pi pi-comment" aria-hidden="true"></i> Send feedback</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HelpDeskPage {
  img = IMG + 'assets/img/support.svg';

  services: Topic[] = [
    { label: 'Application Related Issue', icon: 'pi-file-edit' },
    { label: 'Scholarship Service Related Issue', icon: 'pi-graduation-cap' },
    { label: 'Sugam Service Related Issue', icon: 'pi-th-large' },
    { label: 'Janseva Service Related Issue', icon: 'pi-users' },
  ];
  payments: Topic[] = [
    { label: 'Payment Related Issue', icon: 'pi-credit-card' },
    { label: 'Payment Failed Related Issue', icon: 'pi-times-circle' },
    { label: 'Payment Refund Related Issue', icon: 'pi-replay' },
    { label: 'Payment Related Other Issue', icon: 'pi-ellipsis-h' },
  ];
  manuals = [
    { label: 'English', url: abs('Download/User_Manual_on_CSP_v1.1.pdf') },
    { label: 'Gujarati', url: abs('Download/GUser_Manual_on_CSP_v1.1.pdf') },
  ];

  private minutes = signal(this.istMinutes());
  open = computed(() => this.minutes() >= OPEN_MIN && this.minutes() < CLOSE_MIN);

  constructor() {
    const id = setInterval(() => this.minutes.set(this.istMinutes()), 30000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private istMinutes() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    return +p.find((x) => x.type === 'hour')!.value * 60 + +p.find((x) => x.type === 'minute')!.value;
  }
}

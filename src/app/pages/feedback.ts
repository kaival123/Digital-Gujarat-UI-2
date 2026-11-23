import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { Textarea } from 'primeng/textarea';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';

const Q = (q: string, options: string[]) => ({ q, options, value: null as string | null });

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-feedback',
  imports: [FormsModule, ButtonDirective, InputText, Message, SelectButton, Textarea, PageHero, Reveal],
  template: `
    <app-page-hero title="Feedback" subtitle="Tell us how we can make Digital Gujarat better." />
    <section class="section" data-main tabindex="-1">
      <div class="container narrow">
        @if (sent()) {
          <p-message severity="success" icon="pi pi-check-circle">Thank you for your feedback. Your response has been recorded in this demo.</p-message>
          <button pButton type="button" class="mt" (click)="sent.set(false)">Send another response</button>
        } @else {
          <form class="feedback-form" appReveal="up" (ngSubmit)="submit()" #f="ngForm">
            <div class="form-grid">
              <label>Name <input pInputText name="name" [(ngModel)]="form.name" required></label>
              <label>Email <input pInputText type="email" name="email" [(ngModel)]="form.email" required></label>
              <label>Mobile <input pInputText name="mobile" [(ngModel)]="form.mobile" pattern="[0-9]{10}" maxlength="10" required></label>
              <label>Subject <input pInputText name="subject" [(ngModel)]="form.subject"></label>
            </div>
            @for (q of questions; track q.q; let i = $index) {
              <fieldset>
                <legend>{{ q.q }}</legend>
                <p-selectbutton [options]="q.options" [(ngModel)]="q.value" [name]="'q' + i" [allowEmpty]="false" size="small" [ariaLabel]="q.q" />
              </fieldset>
            }
            <label>Message <textarea pTextarea name="message" rows="4" [(ngModel)]="form.message"></textarea></label>
            <button pButton type="submit" [disabled]="f.invalid"><i class="pi pi-send"></i> Submit feedback</button>
          </form>
        }
      </div>
    </section>
  `,
})
export class FeedbackPage {
  sent = signal(false);
  form = { name: '', email: '', mobile: '', subject: '', message: '' };
  questions = [
    Q('How easy was it to access the service online?', ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy']),
    Q('How clear and understandable were the instructions for completing the process?', ['Very Unclear', 'Unclear', 'Neutral', 'Clear', 'Very Clear']),
    Q('How satisfied are you with the timeliness of the service?', ['Very Slow', 'Slow', 'Average', 'Fast', 'Very Fast']),
    Q('How satisfied are you with the user interface?', ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']),
    Q('Overall, how satisfied are you with the overall online service experience?', ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']),
  ];
  submit() { this.sent.set(true); }
}

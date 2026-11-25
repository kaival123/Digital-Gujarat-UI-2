import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';

import { DISTRICTS, talukasOf, villagesOf } from '../data/gujarat-places';
import { CertificateServiceDetails, blankServiceDetails } from './certificate-service-details';
import { CertificateDocuments, blankDocuments } from './certificate-documents';
import { CertificateDeclaration } from './certificate-declaration';

/** Signed-in citizen's profile — the source for "Update From Profile". */
const PROFILE = {
  salute: 'Shri', surname: 'સુથાર', firstName: 'વ્રજકુમાર', middleName: '',
  mobile: '9016711343', email: 'vrajsuthar17@gmail.com',
  motherName: 'સોનલબેન સુથાર', fatherName: 'ભાવેશભાઈ સુથાર', relation: 'Son',
  permAddress: '85-6 ચંદન સોસાયટી, વેજલપુર, પંચમહાલ, ગુજરાત',
  permDistrict: 'Panchmahals', permTaluka: 'Kalol', permVillage: 'Vejalpur',
};

type AddressKind = 'perm' | 'curr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificates',
  imports: [FormsModule, ButtonDirective, Checkbox, InputText, Message, Select, Textarea, PageHero, Reveal, CertificateServiceDetails, CertificateDocuments, CertificateDeclaration],
  template: `
    <app-page-hero title="Income Certificate (Panchayat)" subtitle="Service detail entry — Sugam" [trail]="trail" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        @if (lastSubmitted()) {
          <p-message class="svc-sent" severity="success" icon="pi pi-check-circle" [closable]="true" (onClose)="lastSubmitted.set('')">
            Application <strong>{{ lastSubmitted() }}</strong> submitted successfully. You will receive an SMS when the certificate is issued.
          </p-message>
        }
        <ol class="svc-stepper" aria-label="Application progress">
          @for (s of steps; track s; let i = $index) {
            <li [class.active]="step() === i + 1" [class.complete]="step() > i + 1" [attr.aria-current]="step() === i + 1 ? 'step' : null">
              <span class="dot">@if (step() > i + 1) { <i class="pi pi-check" aria-hidden="true"></i> } @else { {{ i + 1 }} }</span>
              <span class="lbl">{{ s }}</span>
            </li>
          }
        </ol>
        <p class="svc-title">Service Detail Entry :- <strong>Income Certificate (Panchayat) (Sugam)</strong></p>

        @if (step() === 1) {
          <form class="svc-form" appReveal="up" #f="ngForm" (ngSubmit)="next()" novalidate>
            <header class="svc-head">
              <span class="svc-badge"><i class="pi pi-user" aria-hidden="true"></i> Applicant Information</span>
            </header>

            <div class="svc-meta">
              <div><span>Service Request ID</span><strong>{{ requestId }}</strong></div>
              <div><span>Service Apply Year</span><strong>{{ applyYear }}</strong></div>
              <div><span>Service Apply Date</span><strong>{{ applyDate }}</strong></div>
            </div>

            <div class="svc-grid">
              <div class="fld">
                <label for="salute">Salute <b class="req">*</b></label>
                <p-select inputId="salute" name="salute" [(ngModel)]="form.salute" [options]="salutes" placeholder="Select" required appendTo="body" />
                @if (err(f, 'salute')) { <small class="fld-err">Select a salute</small> }
              </div>
              <div class="fld">
                <label for="surname">Surname <b class="req">*</b></label>
                <input pInputText id="surname" name="surname" [(ngModel)]="form.surname" required readonly class="locked">
              </div>
              <div class="fld">
                <label for="firstName">First Name <b class="req">*</b></label>
                <input pInputText id="firstName" name="firstName" [(ngModel)]="form.firstName" required readonly class="locked">
              </div>
              <div class="fld">
                <label for="middleName">Middle Name</label>
                <input pInputText id="middleName" name="middleName" [(ngModel)]="form.middleName" maxlength="50">
              </div>

              <div class="fld">
                <label for="mobile">Mobile No <b class="req">*</b></label>
                <input pInputText id="mobile" name="mobile" inputmode="numeric" [(ngModel)]="form.mobile" required pattern="[6-9][0-9]{9}" maxlength="10" readonly class="locked">
              </div>
              <div class="fld">
                <label for="email">E-mail <b class="req">*</b></label>
                <input pInputText id="email" name="email" type="email" [(ngModel)]="form.email" required email>
                @if (err(f, 'email')) { <small class="fld-err">Enter a valid e-mail address</small> }
              </div>
              <div class="fld">
                <label for="motherName">Mother Full Name <b class="req">*</b></label>
                <input pInputText id="motherName" name="motherName" [(ngModel)]="form.motherName" required readonly class="locked">
              </div>
              <div class="fld">
                <label for="fatherName">Father/Husband Full Name <b class="req">*</b></label>
                <input pInputText id="fatherName" name="fatherName" [(ngModel)]="form.fatherName" required readonly class="locked">
              </div>

              <div class="fld span-all">
                <label for="relation">Relation with Parent's / Husband's / Guardian</label>
                <p-select inputId="relation" name="relation" [(ngModel)]="form.relation" [options]="relations" placeholder="Select relation" appendTo="body" />
              </div>
            </div>

            <!-- Permanent address -->
            <fieldset class="svc-addr">
              <legend><i class="pi pi-home" aria-hidden="true"></i> Permanent Address</legend>
              <div class="fld">
                <label for="permAddress">Address <b class="req">*</b></label>
                <textarea pTextarea id="permAddress" name="permAddress" rows="2" [(ngModel)]="form.permAddress" (ngModelChange)="syncCurrent()" required maxlength="250"></textarea>
                @if (err(f, 'permAddress')) { <small class="fld-err">Permanent address is required</small> }
              </div>
              <div class="svc-grid three">
                <div class="fld">
                  <label for="permDistrict">District <b class="req">*</b></label>
                  <p-select inputId="permDistrict" name="permDistrict" [(ngModel)]="form.permDistrict" (ngModelChange)="onDistrict('perm')" [options]="districts" optionLabel="label" optionValue="value" placeholder="Select district" [filter]="true" required appendTo="body" />
                  @if (err(f, 'permDistrict')) { <small class="fld-err">Select a district</small> }
                </div>
                <div class="fld">
                  <label for="permTaluka">Taluka <b class="req">*</b></label>
                  <p-select inputId="permTaluka" name="permTaluka" [(ngModel)]="form.permTaluka" (ngModelChange)="onTaluka('perm')" [options]="talukas(form.permDistrict)" optionLabel="label" optionValue="value" placeholder="Select taluka" [disabled]="!form.permDistrict" required appendTo="body" />
                  @if (err(f, 'permTaluka')) { <small class="fld-err">Select a taluka</small> }
                </div>
                <div class="fld">
                  <label for="permVillage">Village</label>
                  <p-select inputId="permVillage" name="permVillage" [(ngModel)]="form.permVillage" (ngModelChange)="syncCurrent()" [options]="villages(form.permDistrict, form.permTaluka)" optionLabel="label" optionValue="value" placeholder="Select village" [disabled]="!form.permTaluka" [showClear]="true" appendTo="body" />
                </div>
              </div>
            </fieldset>

            <label class="svc-same">
              <p-checkbox inputId="same" name="same" [binary]="true" [(ngModel)]="same" (ngModelChange)="syncCurrent()" />
              <span>Same as Permanent Address</span>
            </label>

            <!-- Current address -->
            <fieldset class="svc-addr" [class.is-linked]="same">
              <legend><i class="pi pi-map-marker" aria-hidden="true"></i> Current Address</legend>
              <div class="fld">
                <label for="currAddress">Address <b class="req">*</b></label>
                <textarea pTextarea id="currAddress" name="currAddress" rows="2" [(ngModel)]="form.currAddress" required maxlength="250" [readonly]="same" [class.locked]="same"></textarea>
                @if (err(f, 'currAddress')) { <small class="fld-err">Current address is required</small> }
              </div>
              <div class="svc-grid three">
                <div class="fld">
                  <label for="currDistrict">District <b class="req">*</b></label>
                  <p-select inputId="currDistrict" name="currDistrict" [(ngModel)]="form.currDistrict" (ngModelChange)="onDistrict('curr')" [options]="districts" optionLabel="label" optionValue="value" placeholder="Select district" [filter]="true" [disabled]="same" required appendTo="body" />
                  @if (err(f, 'currDistrict')) { <small class="fld-err">Select a district</small> }
                </div>
                <div class="fld">
                  <label for="currTaluka">Taluka <b class="req">*</b></label>
                  <p-select inputId="currTaluka" name="currTaluka" [(ngModel)]="form.currTaluka" (ngModelChange)="onTaluka('curr')" [options]="talukas(form.currDistrict)" optionLabel="label" optionValue="value" placeholder="Select taluka" [disabled]="same || !form.currDistrict" required appendTo="body" />
                  @if (err(f, 'currTaluka')) { <small class="fld-err">Select a taluka</small> }
                </div>
                <div class="fld">
                  <label for="currVillage">Village</label>
                  <p-select inputId="currVillage" name="currVillage" [(ngModel)]="form.currVillage" [options]="villages(form.currDistrict, form.currTaluka)" optionLabel="label" optionValue="value" placeholder="Select village" [disabled]="same || !form.currTaluka" [showClear]="true" appendTo="body" />
                </div>
              </div>
            </fieldset>

            @if (notice()) {
              <p-message [severity]="notice()!.sev" [icon]="notice()!.sev === 'error' ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle'">{{ notice()!.text }}</p-message>
            }

            <div class="svc-actions">
              <button pButton type="button" severity="secondary" [outlined]="true" (click)="fromProfile()"><i class="pi pi-refresh"></i> Update From Profile</button>
              <button pButton type="submit">Next <i class="pi pi-arrow-right"></i></button>
            </div>
          </form>
        } @else if (step() === 2) {
          <app-certificate-service-details appReveal="up" [m]="service" [applicantName]="fullName()" [applicantAddress]="form.currAddress" (previous)="go(1)" (completed)="go(3)" />
        } @else if (step() === 3) {
          <app-certificate-documents appReveal="up" [d]="docs" [familyApplicable]="familyEarns()" (previous)="go(2)" (completed)="declOpen.set(true)" />
        }
        <app-certificate-declaration [a]="form" [s]="service" [(visible)]="declOpen" (submitted)="onSubmitted()" />
      </div>
    </section>
  `,
})
export class CertificatesPage {
  trail = [{ label: 'Services' }, { label: 'Certificates', routerLink: '/services/certificates' }];

  private ngForm = viewChild<NgForm>('f');

  readonly districts = DISTRICTS;
  readonly salutes = ['Shri', 'Smt.', 'Kumari', 'Dr.', 'Master'];
  readonly relations = ['Son', 'Daughter', 'Wife', 'Husband', 'Ward'];

  private now = new Date();
  readonly applyYear = this.now.getFullYear();
  readonly applyDate = this.now.toLocaleDateString('en-GB');
  requestId = this.newRequestId();
  /** Application number of the one just submitted (shown as a success message). */
  lastSubmitted = signal('');
  private newRequestId() {
    return `${String(this.applyYear).slice(2)}${String(Math.floor(1e9 + Math.random() * 9e9)).slice(0, 10)}`;
  }

  same = false;
  form = this.blank();
  step = signal(1);
  service = blankServiceDetails();
  docs = blankDocuments();
  readonly steps = ['Applicant Information', 'Service Details', 'Upload Documents'];
  declOpen = signal(false);
  submitted = signal(false);
  notice = signal<{ sev: 'error' | 'info'; text: string } | null>(null);

  constructor() { this.fromProfile(true); }

  readonly talukas = talukasOf;
  readonly villages = villagesOf;

  /** Changing a parent clears the dependent selects. */
  onDistrict(kind: AddressKind) {
    this.form[`${kind}Taluka`] = '';
    this.form[`${kind}Village`] = '';
    if (kind === 'perm') this.syncCurrent();
  }
  onTaluka(kind: AddressKind) {
    this.form[`${kind}Village`] = '';
    if (kind === 'perm') this.syncCurrent();
  }

  /** "Same as Permanent Address" mirrors every permanent field while ticked. */
  syncCurrent() {
    if (!this.same) return;
    this.form.currAddress = this.form.permAddress;
    this.form.currDistrict = this.form.permDistrict;
    this.form.currTaluka = this.form.permTaluka;
    this.form.currVillage = this.form.permVillage;
  }

  fromProfile(silent = false) {
    Object.assign(this.form, PROFILE);
    if (!this.form.currAddress || this.same) {
      this.form.currAddress = PROFILE.permAddress;
      this.form.currDistrict = PROFILE.permDistrict;
      this.form.currTaluka = PROFILE.permTaluka;
      this.form.currVillage = PROFILE.permVillage;
    }
    if (!silent) this.notice.set({ sev: 'info', text: 'Applicant details refreshed from your citizen profile.' });
  }

  err(f: NgForm, name: string): boolean {
    const c = f.controls[name];
    return !!c && c.invalid && (c.touched || this.submitted());
  }

  next() {
    const f = this.ngForm();
    this.submitted.set(true);
    if (!f || f.invalid) {
      f?.form.markAllAsTouched();
      this.notice.set({ sev: 'error', text: 'Please fill all mandatory (*) fields before continuing.' });
      return;
    }
    this.notice.set(null);
    this.go(2);
  }

  fullName() {
    const f = this.form;
    return [f.salute, f.firstName, f.middleName, f.surname].filter(Boolean).join(' ');
  }

  /** Someone other than the applicant has income → family-member income proof is required. */
  familyEarns() {
    return this.service.members.some((m) => !m.relation.startsWith('Self') && (m.income ?? 0) > 0);
  }

  /** After the declaration is confirmed: remember the number, then start a fresh application. */
  onSubmitted() {
    const no = this.requestId;
    this.startOver();
    this.lastSubmitted.set(no);
  }
  /** Fresh application: new request ID, profile prefilled again, everything else cleared. */
  private startOver() {
    this.form = this.blank();
    this.same = false;
    this.fromProfile(true);
    this.service = blankServiceDetails();
    this.docs = blankDocuments();
    this.requestId = this.newRequestId();
    this.notice.set(null);
    this.submitted.set(false);
    this.go(1);
  }

  go(n: number) {
    if (n > 1) this.lastSubmitted.set('');
    this.step.set(n);
    this.toTop();
  }
  private toTop() {
    document.querySelector('.svc-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private blank() {
    return {
      salute: '', surname: '', firstName: '', middleName: '', mobile: '', email: '', motherName: '', fatherName: '', relation: '',
      permAddress: '', permDistrict: '', permTaluka: '', permVillage: '',
      currAddress: '', currDistrict: '', currTaluka: '', currVillage: '',
    };
  }
}

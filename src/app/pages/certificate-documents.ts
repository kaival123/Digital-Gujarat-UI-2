import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, OnDestroy, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';

type SlotStatus = 'none' | 'selected' | 'uploading' | 'attached';

export interface DocSlot {
  type: string; number: string;
  file: File | null; fileName: string; url: string;
  status: SlotStatus; source: 'upload' | 'digilocker' | '';
  error: string;
}
export interface PhotoSlot { url: string; fileName: string; status: SlotStatus; error: string }

const slot = (): DocSlot => ({ type: '', number: '', file: null, fileName: '', url: '', status: 'none', source: '', error: '' });

/** Step 3 state — owned by the page so it survives Previous / Next. */
export function blankDocuments() {
  return { residence: slot(), income: slot(), family: slot(), photo: { url: '', fileName: '', status: 'none', error: '' } as PhotoSlot };
}
export type Documents = ReturnType<typeof blankDocuments>;
type SlotKey = 'residence' | 'income' | 'family';

const DOC_MAX = 1024 * 1024;        // 1 MB
const PHOTO_MAX = 200 * 1024;       // 200 KB
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const PHOTO_TYPES = ['image/jpeg', 'image/png'];

const INCOME_PROOFS = ['Salary Certificate / Salary Slip', 'Form 16', 'Income Tax Return (ITR)', "Talati-cum-Mantri's Income Report", '7/12 & 8-A Extract', 'Self Declaration of Income (Affidavit)'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificate-documents',
  imports: [FormsModule, ButtonDirective, Dialog, InputText, Message, Select],
  template: `
    <div class="svc-form">
      <header class="svc-head">
        <span class="svc-badge"><i class="pi pi-paperclip" aria-hidden="true"></i> Document Attach</span>
      </header>
      <p class="doc-note"><i class="pi pi-info-circle" aria-hidden="true"></i> Attach any one document per section — PDF, JPG or PNG up to 1 MB — or fetch it straight from DigiLocker.</p>

      @for (s of sections; track s.key) {
        <fieldset class="svc-addr doc-sec" [class.is-na]="s.key === 'family' && !familyApplicable()" [attr.aria-disabled]="s.key === 'family' && !familyApplicable()">
          <legend><i [class]="s.icon" aria-hidden="true"></i> {{ s.title }} (Any One)</legend>
          @if (s.key === 'family' && !familyApplicable()) {
            <p class="doc-na"><i class="pi pi-ban" aria-hidden="true"></i> Not Applicable <span>— no other earning family member was added in Service Details.</span></p>
          }
          <div class="svc-grid two">
            <div class="fld">
              <label [for]="s.key + 'Type'">{{ s.title }} (Any One) @if (isActive(s.key)) { <b class="req">*</b> }</label>
              <p-select [inputId]="s.key + 'Type'" [name]="s.key + 'Type'" [(ngModel)]="d()[s.key].type" (ngModelChange)="d()[s.key].error = ''" [options]="s.options" placeholder="Select Document for Upload" [disabled]="!isActive(s.key) || d()[s.key].status === 'attached'" appendTo="body" />
            </div>
            <div class="fld">
              <label [for]="s.key + 'No'">Document Number / Certificate No @if (isActive(s.key)) { <b class="req">*</b> }</label>
              <input pInputText [id]="s.key + 'No'" [name]="s.key + 'No'" [(ngModel)]="d()[s.key].number" (ngModelChange)="d()[s.key].error = ''" maxlength="30" autocomplete="off" class="mono" [disabled]="!isActive(s.key) || d()[s.key].status === 'attached'">
            </div>
          </div>

          <div class="doc-row">
            <span class="doc-ico" [class.ok]="d()[s.key].status === 'attached'" aria-hidden="true">
              <i [class]="d()[s.key].status === 'attached' ? 'pi pi-file-check' : 'pi pi-file'"></i>
            </span>
            <div class="doc-ctl">
              <span class="fld-label">Select File For Upload</span>
              <div class="doc-btns">
                <input #picker type="file" class="sr-only" [accept]="docAccept" (change)="pick(s.key, picker)" [disabled]="!isActive(s.key)" tabindex="-1">
                <button pButton type="button" size="small" severity="secondary" [outlined]="true" (click)="picker.click()" [disabled]="!isActive(s.key) || busy(s.key)"><i class="pi pi-search"></i> Browse</button>
                <button pButton type="button" size="small" (click)="upload(s.key)" [disabled]="!isActive(s.key) || d()[s.key].status !== 'selected'" [loading]="d()[s.key].status === 'uploading' && d()[s.key].source === 'upload'"><i class="pi pi-upload"></i> Upload</button>
                <button pButton type="button" size="small" (click)="digiLocker(s.key)" [disabled]="!isActive(s.key) || busy(s.key)" [loading]="d()[s.key].status === 'uploading' && d()[s.key].source === 'digilocker'"><i class="pi pi-cloud-download"></i> Attach From DigiLocker</button>
              </div>
              <div class="doc-status" role="status">
                @switch (d()[s.key].status) {
                  @case ('attached') {
                    <span class="ok"><i class="pi pi-check-circle" aria-hidden="true"></i> Document attached{{ d()[s.key].source === 'digilocker' ? ' from DigiLocker' : '' }}: <strong>{{ d()[s.key].fileName }}</strong></span>
                    @if (d()[s.key].url) { <a [href]="d()[s.key].url" target="_blank" rel="noopener">View</a> }
                    <button type="button" class="link-btn" (click)="remove(s.key)">Remove</button>
                  }
                  @case ('selected') { <span class="pending"><i class="pi pi-clock" aria-hidden="true"></i> {{ d()[s.key].fileName }} selected — click Upload.</span> }
                  @case ('uploading') { <span class="pending"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Attaching…</span> }
                  @default { <span class="no">Document Not attached.</span> }
                }
              </div>
              @if (d()[s.key].error) { <small class="fld-err">{{ d()[s.key].error }}</small> }
            </div>
          </div>
        </fieldset>
      }

      <!-- photo -->
      <fieldset class="svc-addr doc-sec">
        <legend><i class="pi pi-camera" aria-hidden="true"></i> Upload Document — Photo Upload</legend>
        <div class="photo-row">
          <div class="doc-ctl">
            <span class="fld-label">Attach Photo <b class="req">*</b></span>
            <div class="doc-btns">
              <input #photoPicker type="file" class="sr-only" [accept]="photoAccept" (change)="pickPhoto(photoPicker)" tabindex="-1">
              <button pButton type="button" size="small" severity="secondary" [outlined]="true" (click)="photoPicker.click()"><i class="pi pi-search"></i> Browse</button>
              <button pButton type="button" size="small" (click)="uploadPhoto()" [disabled]="d().photo.status !== 'selected'" [loading]="d().photo.status === 'uploading'"><i class="pi pi-upload"></i> Upload</button>
              <button pButton type="button" size="small" severity="secondary" [outlined]="true" (click)="openCamera()"><i class="pi pi-camera"></i> Capture</button>
            </div>
            <small class="fld-hint"><i class="pi pi-info-circle" aria-hidden="true"></i> Recent passport-size photo, JPG/PNG up to 200 KB.</small>
            <div class="doc-status" role="status">
              @switch (d().photo.status) {
                @case ('attached') { <span class="ok"><i class="pi pi-check-circle" aria-hidden="true"></i> Photo uploaded.</span> <button type="button" class="link-btn" (click)="removePhoto()">Remove</button> }
                @case ('selected') { <span class="pending"><i class="pi pi-clock" aria-hidden="true"></i> Photo ready — click Upload.</span> }
                @case ('uploading') { <span class="pending"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Uploading…</span> }
                @default { <span class="no">Photo not attached.</span> }
              }
            </div>
            @if (d().photo.error) { <small class="fld-err">{{ d().photo.error }}</small> }
          </div>
          <figure class="photo-frame" [class.ok]="d().photo.status === 'attached'">
            @if (d().photo.url) { <img [src]="d().photo.url" alt="Applicant photo preview"> }
            @else { <i class="pi pi-user" aria-hidden="true"></i><figcaption>No photo</figcaption> }
          </figure>
        </div>
      </fieldset>

      @if (notice()) {
        <p-message severity="error" icon="pi pi-exclamation-triangle">{{ notice() }}</p-message>
      }

      <div class="svc-actions">
        <button pButton type="button" severity="secondary" [outlined]="true" (click)="previous.emit()"><i class="pi pi-arrow-left"></i> Previous</button>
        <button pButton type="button" (click)="next()"><i class="pi pi-send"></i> Submit</button>
      </div>
    </div>

    <p-dialog header="Capture photo" [(visible)]="camOpen" [modal]="true" [style]="{ width: 'min(92vw, 460px)' }" (onHide)="stopCamera()" [draggable]="false">
      <div class="cam">
        @if (camError()) {
          <p-message severity="warn" icon="pi pi-video">{{ camError() }}</p-message>
        } @else {
          <video #video autoplay playsinline muted aria-label="Camera preview"></video>
        }
      </div>
      <ng-template #footer>
        <button pButton type="button" severity="secondary" [text]="true" (click)="camOpen = false">Cancel</button>
        <button pButton type="button" (click)="capture()" [disabled]="!!camError() || !camReady()"><i class="pi pi-camera"></i> Capture</button>
      </ng-template>
    </p-dialog>
  `,
})
export class CertificateDocuments implements OnDestroy {
  d = input.required<Documents>();
  /** Family-member proof is only needed when someone other than the applicant earns. */
  familyApplicable = input(false);
  previous = output<void>();
  completed = output<void>();

  private cdr = inject(ChangeDetectorRef);
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;

  readonly docAccept = '.pdf,.jpg,.jpeg,.png';
  readonly photoAccept = '.jpg,.jpeg,.png';
  readonly sections: { key: SlotKey; title: string; icon: string; options: string[] }[] = [
    { key: 'residence', title: 'Residence Proof Attachment', icon: 'pi pi-home',
      options: ['Aadhaar Card', 'Electricity Bill', 'Ration Card', 'Voter ID Card', 'Passport', 'Property Tax Bill', 'Registered Rent Agreement'] },
    { key: 'income', title: "Applicant's Income Proof Attachment", icon: 'pi pi-wallet', options: INCOME_PROOFS },
    { key: 'family', title: "Family Member's Income Proof Attachment", icon: 'pi pi-users', options: INCOME_PROOFS },
  ];

  notice = signal('');
  camOpen = false;
  camError = signal('');
  camReady = signal(false);

  isActive(k: SlotKey) { return k !== 'family' || this.familyApplicable(); }
  busy(k: SlotKey) { return this.d()[k].status === 'uploading'; }

  pick(k: SlotKey, el: HTMLInputElement) {
    const f = el.files?.[0];
    el.value = '';
    if (!f) return;
    const s = this.d()[k];
    const bad = this.check(f, DOC_TYPES, DOC_MAX, '1 MB', 'PDF, JPG or PNG');
    if (bad) { s.error = bad; return; }
    this.revoke(s.url);
    Object.assign(s, { file: f, fileName: f.name, url: URL.createObjectURL(f), status: 'selected', source: '', error: '' });
  }

  upload(k: SlotKey) {
    const s = this.d()[k];
    if (!s.type) { s.error = 'Select the document type first.'; return; }
    if (!s.number.trim()) { s.error = 'Enter the document / certificate number.'; return; }
    s.status = 'uploading'; s.source = 'upload';
    this.later(() => { s.status = 'attached'; s.error = ''; });
  }

  /** Simulated DigiLocker pull (the live portal redirects to DigiLocker consent). */
  digiLocker(k: SlotKey) {
    const s = this.d()[k];
    if (!s.type) { s.error = 'Select the document type to fetch from DigiLocker.'; return; }
    this.revoke(s.url);
    Object.assign(s, { status: 'uploading', source: 'digilocker', error: '', file: null, url: '' });
    this.later(() => {
      if (!s.number.trim()) s.number = `DL-${Math.floor(1e7 + Math.random() * 9e7)}`;
      Object.assign(s, { fileName: `${s.type}.pdf`, status: 'attached' });
    });
  }

  remove(k: SlotKey) {
    const s = this.d()[k];
    this.revoke(s.url);
    Object.assign(s, { file: null, fileName: '', url: '', status: 'none', source: '', error: '' });
  }

  pickPhoto(el: HTMLInputElement) {
    const f = el.files?.[0];
    el.value = '';
    if (!f) return;
    const p = this.d().photo;
    const bad = this.check(f, PHOTO_TYPES, PHOTO_MAX, '200 KB', 'JPG or PNG');
    if (bad) { p.error = bad; return; }
    this.revoke(p.url);
    Object.assign(p, { url: URL.createObjectURL(f), fileName: f.name, status: 'selected', error: '' });
  }
  uploadPhoto() {
    const p = this.d().photo;
    p.status = 'uploading';
    this.later(() => { p.status = 'attached'; p.error = ''; });
  }
  removePhoto() {
    const p = this.d().photo;
    this.revoke(p.url);
    Object.assign(p, { url: '', fileName: '', status: 'none', error: '' });
  }

  async openCamera() {
    this.camError.set(''); this.camReady.set(false); this.camOpen = true;
    if (!navigator.mediaDevices?.getUserMedia) { this.camError.set('Camera is not available in this browser. Use Browse instead.'); return; }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      // the <video> renders once the dialog is open
      setTimeout(() => {
        const v = this.video()?.nativeElement;
        if (!v || !this.stream) return;
        v.srcObject = this.stream;
        v.onloadedmetadata = () => this.camReady.set(true);
      });
    } catch {
      this.camError.set('Camera permission was denied or no camera was found. Use Browse instead.');
    }
    this.cdr.markForCheck();
  }
  capture() {
    const v = this.video()?.nativeElement;
    if (!v) return;
    // passport-style 3:4 crop from the centre, scaled to 300×400
    const c = document.createElement('canvas'); c.width = 300; c.height = 400;
    const sw = Math.min(v.videoWidth, v.videoHeight * 0.75), sh = sw / 0.75;
    c.getContext('2d')!.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, 300, 400);
    const p = this.d().photo;
    this.revoke(p.url);
    Object.assign(p, { url: c.toDataURL('image/jpeg', 0.85), fileName: 'captured-photo.jpg', status: 'selected', error: '' });
    this.camOpen = false;
    this.stopCamera();
  }
  stopCamera() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.camReady.set(false);
  }

  next() {
    const d = this.d();
    const missing: string[] = [];
    for (const s of this.sections) {
      if (!this.isActive(s.key)) continue;
      const x = d[s.key];
      if (x.status !== 'attached') { missing.push(s.title.replace(' Attachment', '')); x.error ||= 'Attach a document for this section.'; }
    }
    if (d.photo.status !== 'attached') { missing.push('Photo'); d.photo.error ||= 'Upload or capture your photo.'; }
    if (missing.length) { this.notice.set(`Please attach: ${missing.join(', ')}.`); return; }
    this.notice.set('');
    this.completed.emit();
  }

  ngOnDestroy() { this.stopCamera(); }

  private check(f: File, types: string[], max: number, maxLabel: string, typeLabel: string) {
    if (!types.includes(f.type)) return `Only ${typeLabel} files are allowed.`;
    if (f.size > max) return `File is ${(f.size / 1024).toFixed(0)} KB — the limit is ${maxLabel}.`;
    return '';
  }
  private later(fn: () => void) {
    setTimeout(() => { fn(); this.notice.set(''); this.cdr.markForCheck(); }, 800);
  }
  private revoke(url: string) { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }
}

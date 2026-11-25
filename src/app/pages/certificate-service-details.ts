import { Component, ChangeDetectionStrategy, input, output, signal, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { DISTRICTS, surveysOf, talukasOf, villagesOf } from '../data/gujarat-places';

export interface FamilyMember { name: string; relation: string; age: number | null; source: string; income: number | null }

/** Step 2 state — owned by the page so it survives Previous / Next. */
export function blankServiceDetails() {
  return {
    purpose: '', purposeOther: '',
    occFarmer: false, occBusiness: false, occJob: false,
    landDistrict: '', landTaluka: '', landVillage: '', survey: '', landDetails: '', landVerified: false,
    pan: '',
    bizName: '', bizDistrict: '', bizTaluka: '', bizVillage: '', bizAddress: '',
    familyCount: null as number | null, earningCount: null as number | null,
    members: [] as FamilyMember[],
    consent: false, company: '', consumerNo: '', billVerified: false,
    billName: '', billAmount: null as number | null, billAddress: '',
  };
}
export type ServiceDetails = ReturnType<typeof blankServiceDetails>;

const SELF = 'Self (Applicant)';
const PARENTS = ['Father', 'Mother'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificate-service-details',
  imports: [FormsModule, ButtonDirective, Checkbox, InputText, Message, Select, Textarea],
  template: `
    <form class="svc-form" #f="ngForm" (ngSubmit)="next()" novalidate>
      <header class="svc-head">
        <span class="svc-badge"><i class="pi pi-briefcase" aria-hidden="true"></i> Service Details</span>
      </header>

      <!-- purpose + occupation -->
      <div class="svc-grid two">
        <div class="fld">
          <label for="purpose">Purpose for which income certificate is required <b class="req">*</b></label>
          <p-select inputId="purpose" name="purpose" [(ngModel)]="m().purpose" (ngModelChange)="m().purposeOther = ''" [options]="purposes" placeholder="Select" required appendTo="body" />
          @if (err(f, 'purpose')) { <small class="fld-err">Select a purpose</small> }
        </div>
        <div class="fld">
          <label for="purposeOther">Enter purpose if Other selected @if (m().purpose === 'Other') { <b class="req">*</b> }</label>
          <input pInputText id="purposeOther" name="purposeOther" [(ngModel)]="m().purposeOther" [required]="m().purpose === 'Other'" [disabled]="m().purpose !== 'Other'" maxlength="100">
          @if (err(f, 'purposeOther')) { <small class="fld-err">Enter the purpose</small> }
        </div>
      </div>

      <fieldset class="svc-choice">
        <legend>Applicant Occupation Details <b class="req">*</b></legend>
        <label><p-checkbox name="occFarmer" [binary]="true" [(ngModel)]="m().occFarmer" /> Farmer</label>
        <label><p-checkbox name="occBusiness" [binary]="true" [(ngModel)]="m().occBusiness" /> Business / Other Occupation</label>
        <label><p-checkbox name="occJob" [binary]="true" [(ngModel)]="m().occJob" /> Job</label>
        @if (submitted() && !anyOccupation()) { <small class="fld-err">Select at least one occupation</small> }
      </fieldset>

      <!-- farming -->
      @if (m().occFarmer) {
        <fieldset class="svc-addr">
          <legend><i class="pi pi-sun" aria-hidden="true"></i> If the occupation is farming, provide details of the land owned</legend>
          <div class="svc-grid three">
            <div class="fld">
              <label for="landDistrict">District <b class="req">*</b></label>
              <p-select inputId="landDistrict" name="landDistrict" [(ngModel)]="m().landDistrict" (ngModelChange)="resetLand('district')" [options]="districts" optionLabel="label" optionValue="value" placeholder="Select district" [filter]="true" [disabled]="m().landVerified" required appendTo="body" />
              @if (err(f, 'landDistrict')) { <small class="fld-err">Select a district</small> }
            </div>
            <div class="fld">
              <label for="landTaluka">Taluka <b class="req">*</b></label>
              <p-select inputId="landTaluka" name="landTaluka" [(ngModel)]="m().landTaluka" (ngModelChange)="resetLand('taluka')" [options]="talukas(m().landDistrict)" optionLabel="label" optionValue="value" placeholder="Select taluka" [disabled]="m().landVerified || !m().landDistrict" required appendTo="body" />
              @if (err(f, 'landTaluka')) { <small class="fld-err">Select a taluka</small> }
            </div>
            <div class="fld">
              <label for="landVillage">Village <b class="req">*</b></label>
              <p-select inputId="landVillage" name="landVillage" [(ngModel)]="m().landVillage" (ngModelChange)="resetLand('village')" [options]="villages(m().landDistrict, m().landTaluka)" optionLabel="label" optionValue="value" placeholder="Select village" [disabled]="m().landVerified || !m().landTaluka" required appendTo="body" />
              @if (err(f, 'landVillage')) { <small class="fld-err">Select a village</small> }
            </div>
            <div class="fld">
              <label for="survey">Survey <b class="req">*</b></label>
              <p-select inputId="survey" name="survey" [(ngModel)]="m().survey" [options]="surveys(m().landVillage)" placeholder="Select survey no." [disabled]="m().landVerified || !m().landVillage" required appendTo="body" />
              @if (err(f, 'survey')) { <small class="fld-err">Select a survey number</small> }
            </div>
            <div class="fld">
              <span class="fld-label">Verify Land Details</span>
              <button pButton type="button" size="small" [loading]="busy() === 'land'" [disabled]="!m().survey || m().landVerified" (click)="verifyLand()"><i class="pi pi-shield"></i> Click to Verify Land Details</button>
            </div>
            <div class="fld">
              <span class="fld-label">Clear Details</span>
              <button pButton type="button" size="small" severity="secondary" [outlined]="true" (click)="resetLand('all')"><i class="pi pi-eraser"></i> Clear Details</button>
            </div>
          </div>
          <div class="svc-grid two">
            <div class="fld">
              <label for="landDetails">Land Details</label>
              <textarea pTextarea id="landDetails" name="landDetails" rows="2" [ngModel]="m().landDetails" readonly class="locked" placeholder="Filled after verification"></textarea>
            </div>
            <div class="fld">
              <span class="fld-label">Verify Status</span>
              <span class="verify-pill" [class.ok]="m().landVerified"><i [class]="m().landVerified ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i> {{ m().landVerified ? 'Yes' : 'No' }}</span>
              @if (submitted() && !m().landVerified) { <small class="fld-err">Verify land details to continue</small> }
            </div>
          </div>
        </fieldset>
      }

      <!-- job -->
      @if (m().occJob) {
        <fieldset class="svc-addr">
          <legend><i class="pi pi-id-card" aria-hidden="true"></i> If employed, provide details of the PAN card you hold</legend>
          <div class="svc-grid four">
            <div class="fld">
              <label for="pan">PAN Card Detail <b class="req">*</b></label>
              <input pInputText id="pan" name="pan" [ngModel]="m().pan" (ngModelChange)="m().pan = $event.toUpperCase()" required pattern="[A-Z]{5}[0-9]{4}[A-Z]" maxlength="10" placeholder="ABCDE1234F" autocomplete="off" class="mono">
              @if (err(f, 'pan')) { <small class="fld-err">Enter a valid 10-character PAN</small> }
            </div>
          </div>
        </fieldset>
      }

      <!-- business -->
      @if (m().occBusiness) {
        <fieldset class="svc-addr">
          <legend><i class="pi pi-shop" aria-hidden="true"></i> If you have a business, provide its details</legend>
          <div class="svc-grid four">
            <div class="fld">
              <label for="bizName">Occupation Name <b class="req">*</b></label>
              <input pInputText id="bizName" name="bizName" [(ngModel)]="m().bizName" required maxlength="100">
              @if (err(f, 'bizName')) { <small class="fld-err">Enter the occupation name</small> }
            </div>
          </div>
          <div class="svc-grid three">
            <div class="fld">
              <label for="bizDistrict">District <b class="req">*</b></label>
              <p-select inputId="bizDistrict" name="bizDistrict" [(ngModel)]="m().bizDistrict" (ngModelChange)="m().bizTaluka = ''; m().bizVillage = ''" [options]="districts" optionLabel="label" optionValue="value" placeholder="Select" [filter]="true" required appendTo="body" />
              @if (err(f, 'bizDistrict')) { <small class="fld-err">Select a district</small> }
            </div>
            <div class="fld">
              <label for="bizTaluka">Taluka <b class="req">*</b></label>
              <p-select inputId="bizTaluka" name="bizTaluka" [(ngModel)]="m().bizTaluka" (ngModelChange)="m().bizVillage = ''" [options]="talukas(m().bizDistrict)" optionLabel="label" optionValue="value" placeholder="Select" [disabled]="!m().bizDistrict" required appendTo="body" />
              @if (err(f, 'bizTaluka')) { <small class="fld-err">Select a taluka</small> }
            </div>
            <div class="fld">
              <label for="bizVillage">Village</label>
              <p-select inputId="bizVillage" name="bizVillage" [(ngModel)]="m().bizVillage" [options]="villages(m().bizDistrict, m().bizTaluka)" optionLabel="label" optionValue="value" placeholder="Select" [disabled]="!m().bizTaluka" [showClear]="true" appendTo="body" />
            </div>
          </div>
          <div class="fld">
            <label for="bizAddress">Occupation Address <b class="req">*</b></label>
            <textarea pTextarea id="bizAddress" name="bizAddress" rows="2" [(ngModel)]="m().bizAddress" required maxlength="250"></textarea>
            @if (err(f, 'bizAddress')) { <small class="fld-err">Enter the occupation address</small> }
          </div>
        </fieldset>
      }

      <!-- family income -->
      <fieldset class="svc-addr">
        <legend><i class="pi pi-users" aria-hidden="true"></i> Family Yearly Income</legend>
        <div class="svc-grid two">
          <div class="fld">
            <label for="familyCount">No of Family Member <b class="req">*</b></label>
            <input pInputText id="familyCount" name="familyCount" type="number" inputmode="numeric" min="1" max="30" [(ngModel)]="m().familyCount" required>
            @if (err(f, 'familyCount')) { <small class="fld-err">Enter the number of family members</small> }
          </div>
          <div class="fld">
            <label for="earningCount">No of Earning Member <b class="req">*</b></label>
            <input pInputText id="earningCount" name="earningCount" type="number" inputmode="numeric" min="0" max="30" [(ngModel)]="m().earningCount" required>
            @if (err(f, 'earningCount')) { <small class="fld-err">Enter the number of earning members</small> }
            @else if (countMismatch()) { <small class="fld-err">Earning members cannot exceed family members</small> }
          </div>
        </div>
      </fieldset>

      <!-- family members -->
      <fieldset class="svc-addr">
        <legend><i class="pi pi-user-plus" aria-hidden="true"></i> Family members details (Add at least one member)</legend>
        <div class="svc-grid three">
          <div class="fld">
            <label for="mName">Name of member <b class="req">*</b></label>
            <input pInputText id="mName" name="mName" [(ngModel)]="draft.name" maxlength="100">
          </div>
          <div class="fld">
            <label for="mRelation">Relation of member <b class="req">*</b></label>
            <p-select inputId="mRelation" name="mRelation" [(ngModel)]="draft.relation" [options]="memberRelations" placeholder="Select" appendTo="body" />
          </div>
          <div class="fld">
            <label for="mAge">Age of member <b class="req">*</b></label>
            <input pInputText id="mAge" name="mAge" type="number" inputmode="numeric" min="0" max="120" [(ngModel)]="draft.age">
          </div>
          <div class="fld">
            <label for="mSource">Source of Income <b class="req">*</b></label>
            <p-select inputId="mSource" name="mSource" [(ngModel)]="draft.source" [options]="incomeSources" placeholder="Select" appendTo="body" />
          </div>
          <div class="fld">
            <label for="mIncome">Yearly income of member (Previous Financial Year) <b class="req">*</b></label>
            <input pInputText id="mIncome" name="mIncome" type="number" inputmode="numeric" min="0" [(ngModel)]="draft.income" placeholder="₹">
          </div>
          <div class="fld fld-actions">
            <button pButton type="button" (click)="saveMember()"><i [class]="editing() === null ? 'pi pi-plus' : 'pi pi-check'"></i> {{ editing() === null ? 'Add Member' : 'Update Member' }}</button>
            @if (editing() !== null) { <button pButton type="button" severity="secondary" [text]="true" (click)="cancelEdit()">Cancel</button> }
          </div>
        </div>
        @if (memberError()) { <small class="fld-err">{{ memberError() }}</small> }

        <div class="svc-table-wrap">
          <table class="svc-table">
            <thead><tr><th>Sr No</th><th>Name</th><th>Relation</th><th>Age</th><th>Business</th><th class="num">Yearly Income</th><th>Update</th><th>Delete</th></tr></thead>
            <tbody>
              @for (mem of m().members; track $index; let i = $index) {
                <tr [class.is-editing]="editing() === i">
                  <td>{{ i + 1 }}</td><td>{{ mem.name }}</td><td>{{ mem.relation }}</td><td>{{ mem.age }}</td><td>{{ mem.source }}</td>
                  <td class="num">{{ inr(mem.income) }}</td>
                  <td><button pButton type="button" size="small" [text]="true" [rounded]="true" (click)="editMember(i)" [attr.aria-label]="'Update ' + mem.name"><i class="pi pi-pencil"></i></button></td>
                  <td><button pButton type="button" size="small" severity="danger" [text]="true" [rounded]="true" (click)="removeMember(i)" [attr.aria-label]="'Delete ' + mem.name"><i class="pi pi-trash"></i></button></td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="svc-table-empty">No family members added yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (submitted() && !m().members.length) { <small class="fld-err">Add at least one family member</small> }
      </fieldset>

      <div class="svc-grid two">
        <div class="fld"><label for="tot">Total Annual Income</label><input pInputText id="tot" [value]="inr(total())" readonly class="locked"></div>
        <div class="fld"><label for="appInc">Applicant's Income <b class="req">*</b></label><input pInputText id="appInc" [value]="inr(applicantIncome())" readonly class="locked"></div>
        <div class="fld"><label for="parInc">Applicant's Parents' Income <b class="req">*</b></label><input pInputText id="parInc" [value]="inr(parentsIncome())" readonly class="locked"></div>
        <div class="fld"><label for="othInc">Other family Member income <b class="req">*</b></label><input pInputText id="othInc" [value]="inr(otherIncome())" readonly class="locked"></div>
      </div>

      <!-- electricity bill -->
      <fieldset class="svc-addr">
        <legend><i class="pi pi-bolt" aria-hidden="true"></i> Electricity bill (address proof)</legend>
        <label class="svc-consent">
          <p-checkbox name="consent" [binary]="true" [(ngModel)]="m().consent" [disabled]="m().billVerified" />
          <span>
            I hereby provide my voluntary consent to DJED to access and retrieve my Electricity Bill records via the Digital Gujarat portal for availing the service of Income Certificate provided by the Government of Gujarat. I understand that my personal details will be used exclusively for this purpose and handled securely to process my application.
            <span lang="gu" class="gu">હું મારી સ્વૈચ્છિક સંમતિ આપું છું કે ગુજરાત સરકાર દ્વારા આપવામાં આવતી આવકના પ્રમાણપત્રની સેવા મેળવવા માટે ડિજિટલ ગુજરાત પોર્ટલ દ્વારા મારા વીજળી બિલના રેકોર્ડ મેળવવામાં આવે. મારી વ્યક્તિગત વિગતોનો ઉપયોગ ફક્ત આ હેતુ માટે જ અને સુરક્ષિત રીતે કરવામાં આવશે.</span>
          </span>
        </label>
        <div class="svc-grid four">
          <div class="fld">
            <label for="company">Company</label>
            <p-select inputId="company" name="company" [(ngModel)]="m().company" [options]="companies" placeholder="Select" [disabled]="m().billVerified" appendTo="body" />
          </div>
          <div class="fld">
            <label for="consumerNo">Electricity bill Consumer Number</label>
            <input pInputText id="consumerNo" name="consumerNo" inputmode="numeric" [(ngModel)]="m().consumerNo" pattern="[0-9]{5,15}" maxlength="15" [readonly]="m().billVerified" [class.locked]="m().billVerified" class="mono">
            @if (err(f, 'consumerNo')) { <small class="fld-err">5–15 digits</small> }
          </div>
          <div class="fld">
            <span class="fld-label">Verify Electricity bill</span>
            <button pButton type="button" size="small" [loading]="busy() === 'bill'" [disabled]="!canVerifyBill()" (click)="verifyBill()"><i class="pi pi-shield"></i> Click to Verify Electricity bill</button>
          </div>
          <div class="fld">
            <span class="fld-label">Verify Status</span>
            <span class="verify-pill" [class.ok]="m().billVerified"><i [class]="m().billVerified ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i> {{ m().billVerified ? 'Yes' : 'No' }}</span>
          </div>
        </div>
        @if (!m().consent && (m().company || m().consumerNo)) { <small class="fld-hint"><i class="pi pi-info-circle"></i> Tick the consent above to verify your electricity bill.</small> }
        <div class="svc-grid two">
          <div class="fld">
            <label for="billName">Electricity Bill Consumer Name <b class="req">*</b></label>
            <input pInputText id="billName" name="billName" [(ngModel)]="m().billName" required maxlength="100" [readonly]="m().billVerified" [class.locked]="m().billVerified">
            @if (err(f, 'billName')) { <small class="fld-err">Enter the consumer name</small> }
          </div>
          <div class="fld">
            <label for="billAmount">Last Electricity Bill Amount (in Rs)</label>
            <input pInputText id="billAmount" name="billAmount" type="number" min="0" [(ngModel)]="m().billAmount" [readonly]="m().billVerified" [class.locked]="m().billVerified">
          </div>
          <div class="fld">
            <label for="billAddress">Electricity Bill Consumer Address <b class="req">*</b></label>
            <textarea pTextarea id="billAddress" name="billAddress" rows="2" [(ngModel)]="m().billAddress" required maxlength="250" [readonly]="m().billVerified" [class.locked]="m().billVerified"></textarea>
            @if (err(f, 'billAddress')) { <small class="fld-err">Enter the consumer address</small> }
          </div>
          <div class="fld">
            <span class="fld-label">Clear Details</span>
            <button pButton type="button" size="small" severity="secondary" [outlined]="true" (click)="clearBill()"><i class="pi pi-eraser"></i> Clear Details</button>
          </div>
        </div>
      </fieldset>

      @if (notice()) {
        <p-message [severity]="notice()!.sev" [icon]="notice()!.sev === 'error' ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'">{{ notice()!.text }}</p-message>
      }

      <div class="svc-actions">
        <button pButton type="button" severity="secondary" [outlined]="true" (click)="previous.emit()"><i class="pi pi-arrow-left"></i> Previous</button>
        <button pButton type="submit">Next <i class="pi pi-arrow-right"></i></button>
      </div>
    </form>
  `,
})
export class CertificateServiceDetails {
  /** Shared, mutable step model (owned by the page). */
  m = input.required<ServiceDetails>();
  /** Used to prefill the electricity-bill lookup. */
  applicantName = input('');
  applicantAddress = input('');
  previous = output<void>();
  completed = output<void>();

  private ngForm = viewChild.required<NgForm>('f');

  readonly districts = DISTRICTS;
  readonly talukas = talukasOf;
  readonly villages = villagesOf;
  readonly surveys = surveysOf;
  readonly purposes = ['Education / Admission', 'Scholarship', 'Government Scheme Benefit', 'Employment', 'Bank Loan', 'EWS Certificate', 'Other'];
  readonly memberRelations = [SELF, 'Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
  readonly incomeSources = ['Job', 'Business', 'Profession', 'Agriculture', 'Animal Husbandry', 'Rent from Self-Owned Property', 'Rent from Ancestral Property', 'Other Sources', 'No Income'];
  readonly companies = ['MGVCL', 'UGVCL', 'DGVCL', 'PGVCL', 'Torrent Power'];

  submitted = signal(false);
  busy = signal<'land' | 'bill' | null>(null);
  notice = signal<{ sev: 'error' | 'success'; text: string } | null>(null);
  editing = signal<number | null>(null);
  memberError = signal('');
  draft = this.blankMember();

  // incomes are derived from the members table (re-evaluated on every change-detection pass the form triggers)
  total() { return this.sum(() => true); }
  applicantIncome() { return this.sum((x) => x.relation === SELF); }
  parentsIncome() { return this.sum((x) => PARENTS.includes(x.relation)); }
  otherIncome() { return this.sum((x) => x.relation !== SELF && !PARENTS.includes(x.relation)); }
  inr(n: number | null) { return `₹ ${(n ?? 0).toLocaleString('en-IN')}`; }

  anyOccupation() { const m = this.m(); return m.occFarmer || m.occBusiness || m.occJob; }
  countMismatch() { const m = this.m(); return m.familyCount != null && m.earningCount != null && m.earningCount > m.familyCount; }
  canVerifyBill() { const m = this.m(); return m.consent && !!m.company && /^[0-9]{5,15}$/.test(m.consumerNo) && !m.billVerified; }

  err(f: NgForm, name: string): boolean {
    const c = f.controls[name];
    return !!c && c.invalid && (c.touched || this.submitted());
  }

  resetLand(level: 'all' | 'district' | 'taluka' | 'village') {
    const m = this.m();
    if (level === 'all') { m.landDistrict = ''; }
    if (level === 'all' || level === 'district') m.landTaluka = '';
    if (level !== 'village') m.landVillage = '';
    m.survey = ''; m.landDetails = ''; m.landVerified = false;
  }

  /** Simulated 7/12 (AnyROR) lookup. */
  verifyLand() {
    this.busy.set('land');
    setTimeout(() => {
      const m = this.m();
      const ha = (0.4 + (m.survey.length * 0.37) % 2.2).toFixed(2);
      m.landDetails = `Survey No. ${m.survey}, ${m.landVillage}, Ta. ${m.landTaluka}, Dist. ${m.landDistrict} — Area ${ha} Ha (7/12 record), Holder: ${this.applicantName() || 'Applicant'}`;
      m.landVerified = true;
      this.busy.set(null);
    }, 700);
  }

  /** Simulated DISCOM lookup. */
  verifyBill() {
    this.busy.set('bill');
    setTimeout(() => {
      const m = this.m();
      m.billName = this.applicantName();
      m.billAddress = this.applicantAddress();
      m.billAmount = 600 + (Number(m.consumerNo.slice(-3)) % 1400);
      m.billVerified = true;
      this.busy.set(null);
    }, 700);
  }
  clearBill() {
    Object.assign(this.m(), { company: '', consumerNo: '', billVerified: false, billName: '', billAmount: null, billAddress: '' });
  }

  saveMember() {
    const d = this.draft;
    if (!d.name.trim() || !d.relation || d.age == null || !d.source || d.income == null) { this.memberError.set('Fill all member fields before adding.'); return; }
    if (d.age < 0 || d.age > 120 || d.income < 0) { this.memberError.set('Enter a valid age and income.'); return; }
    const list = this.m().members;
    if (d.relation === SELF && list.some((x, i) => x.relation === SELF && i !== this.editing())) { this.memberError.set('The applicant (Self) is already in the list.'); return; }
    const i = this.editing();
    if (i === null) list.push({ ...d, name: d.name.trim() }); else list[i] = { ...d, name: d.name.trim() };
    this.cancelEdit();
  }
  editMember(i: number) { this.draft = { ...this.m().members[i] }; this.editing.set(i); this.memberError.set(''); }
  removeMember(i: number) { this.m().members.splice(i, 1); if (this.editing() === i) this.cancelEdit(); }
  cancelEdit() { this.draft = this.blankMember(); this.editing.set(null); this.memberError.set(''); }

  next() {
    const f = this.ngForm();
    this.submitted.set(true);
    const m = this.m();
    const problems = f.invalid || !this.anyOccupation() || !m.members.length || this.countMismatch() || (m.occFarmer && !m.landVerified);
    if (problems) {
      f.form.markAllAsTouched();
      this.notice.set({ sev: 'error', text: 'Please complete all mandatory (*) fields and verifications before continuing.' });
      return;
    }
    this.notice.set(null);
    this.completed.emit();
  }

  private sum(pred: (x: FamilyMember) => boolean) {
    return this.m().members.filter(pred).reduce((a, x) => a + (x.income ?? 0), 0);
  }
  private blankMember(): FamilyMember { return { name: '', relation: '', age: null, source: '', income: null }; }
}

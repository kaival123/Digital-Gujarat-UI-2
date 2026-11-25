import { Component, ChangeDetectionStrategy, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { ServiceDetails } from './certificate-service-details';

/** The step-1 fields the declaration quotes. */
export interface ApplicantInfo {
  salute: string; surname: string; firstName: string; middleName: string; mobile: string; email: string;
  motherName: string; fatherName: string; relation: string;
  permAddress: string; permDistrict: string; permTaluka: string; permVillage: string;
  currAddress: string; currDistrict: string; currTaluka: string; currVillage: string;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim());
const three = (n: number) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : '', two(n % 100)].filter(Boolean).join(' ');

/** Indian numbering in words: 1,25,000 → "One Lakh Twenty Five Thousand". */
export function rupeesInWords(n: number): string {
  n = Math.floor(Math.max(0, n));
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  if (crore) parts.push(`${rupeesInWords(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(' ');
}

/** "Self Declaration" popup opened by Submit on the last step; confirming it submits the application. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-certificate-declaration',
  imports: [FormsModule, ButtonDirective, Checkbox, Dialog],
  template: `
    <p-dialog [visible]="visible()" (visibleChange)="visible.set($event)" (onShow)="agree = false" [modal]="true" [draggable]="false" [closable]="!sending()" [closeOnEscape]="!sending()" [style]="{ width: 'min(94vw, 860px)' }" styleClass="decl-dialog">
      <ng-template #header>
        <span class="decl-title"><i class="pi pi-file-edit" aria-hidden="true"></i> Self Declaration</span>
      </ng-template>
      <label class="decl">
        <p-checkbox inputId="agree" [binary]="true" [(ngModel)]="agree" [disabled]="sending()" />
        <span class="decl-text">
          <span class="para">I, the undersigned, <strong>{{ name() }}</strong>, aged <strong>{{ age() }}</strong> years, by occupation <strong>{{ occupation() }}</strong>, resident of <strong>{{ addr('curr') }}</strong>, resident of the state of Gujarat, hereby solemnly declare that my family includes <strong>{{ s().familyCount }}</strong> members, out of which <strong>{{ s().earningCount }}</strong> members are earners, and the total annual income of our family from all sources in the previous financial year is <strong>Rs {{ inr(total()) }}</strong> (in words: <strong>{{ words() }} Rupees</strong>). We have not received any income certificate in the current financial year, and the details of all the members of the family and our total annual income from all sources as shown by us are true and correct. The information given by me and the documents/enclosures submitted in pursuance of the application are true to the best of my knowledge and belief and nothing has been concealed in them. I am aware that submission of false information or documents is punishable under the law and in such circumstances, the benefit received on the basis of false information or false documents is liable to be cancelled. If any of the information/documents submitted regarding the total annual income of our family is found to be false, legal action may be taken against us under the provisions of the Bharatiya Nyaya Sanhita. Submission of false information constitutes a criminal offence. We know that fact well.</span>
          <span class="para">Further, if any of the facts stated in the application is found to be false or if it is found that we have knowingly submitted false facts/details, the income certificate given to us will be cancelled and it will be binding on us.</span>
          <span class="para">Further, we also understand that the income certificate issued to us will be valid for three years including the financial year in which the certificate is issued. Therefore, during this period, if there is any change in my or my family's income, I undertake to voluntarily inform the competent authority who issued the income certificate. If I make any mistake or omission in voluntarily informing about the additional income, I will be fully responsible for it.</span>
        </span>
      </label>
      <ng-template #footer>
        <button pButton type="button" (click)="submit()" [disabled]="!agree" [loading]="sending()"><i class="pi pi-check"></i> Give Consent And Submit</button>
        <button pButton type="button" severity="secondary" [outlined]="true" (click)="visible.set(false)" [disabled]="sending()">Close</button>
      </ng-template>
    </p-dialog>
  `,
})
export class CertificateDeclaration {
  a = input.required<ApplicantInfo>();
  s = input.required<ServiceDetails>();
  visible = model(false);
  submitted = output<void>();

  agree = false;
  sending = signal(false);

  name() { const a = this.a(); return [a.salute, a.firstName, a.middleName, a.surname].filter(Boolean).join(' '); }
  age() { return this.s().members.find((m) => m.relation.startsWith('Self'))?.age ?? '—'; }
  occupation() {
    const s = this.s();
    return [s.occFarmer && 'Farmer', s.occBusiness && 'Business / Other Occupation', s.occJob && 'Job'].filter(Boolean).join(', ');
  }
  inr(n: number | null) { return (n ?? 0).toLocaleString('en-IN'); }
  total() { return this.s().members.reduce((t, m) => t + (m.income ?? 0), 0); }
  words() { return rupeesInWords(this.total()); }
  addr(k: 'perm' | 'curr') {
    const a = this.a();
    return [a[`${k}Address`], a[`${k}Village`], a[`${k}Taluka`] && `Ta. ${a[`${k}Taluka`]}`, a[`${k}District`] && `Dist. ${a[`${k}District`]}`].filter(Boolean).join(', ');
  }

  submit() {
    if (!this.agree) return;
    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.visible.set(false);
      this.submitted.emit();
    }, 900);
  }
}

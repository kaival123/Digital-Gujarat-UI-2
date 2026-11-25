/** District ▸ Taluka ▸ Village master (demo subset, bilingual labels as on the live portal). */
export interface Place { label: string; value: string }
export interface Taluka extends Place { villages: Place[] }
export interface District extends Place { talukas: Taluka[] }

const p = (en: string, gu: string): Place => ({ label: `${en} (${gu})`, value: en });
const t = (en: string, gu: string, villages: Place[]): Taluka => ({ ...p(en, gu), villages });

export const DISTRICTS: District[] = [
  { ...p('Panchmahals', 'પંચમહાલ'), talukas: [
    t('Kalol', 'કાલોલ', [p('Vejalpur', 'વેજલપુર'), p('Derol', 'ડેરોલ'), p('Bakrol', 'બાકરોલ'), p('Malav', 'માલવ')]),
    t('Godhra', 'ગોધરા', [p('Godhra (City)', 'ગોધરા શહેર'), p('Orwada', 'ઓરવાડા'), p('Vavdi Bujarg', 'વાવડી બુજર્ગ')]),
    t('Halol', 'હાલોલ', [p('Halol (City)', 'હાલોલ શહેર'), p('Champaner', 'ચાંપાનેર'), p('Pavagadh', 'પાવાગઢ')]),
  ] },
  { ...p('Ahmedabad', 'અમદાવાદ'), talukas: [
    t('Daskroi', 'દસક્રોઈ', [p('Bareja', 'બારેજા'), p('Kubadthal', 'કુબડથલ'), p('Hathijan', 'હાથીજણ')]),
    t('Sanand', 'સાણંદ', [p('Sanand (City)', 'સાણંદ શહેર'), p('Chharodi', 'છારોડી'), p('Bol', 'બોલ')]),
    t('Dholka', 'ધોળકા', [p('Dholka (City)', 'ધોળકા શહેર'), p('Koth', 'કોઠ'), p('Badarkha', 'બદરખા')]),
  ] },
  { ...p('Vadodara', 'વડોદરા'), talukas: [
    t('Padra', 'પાદરા', [p('Padra (City)', 'પાદરા શહેર'), p('Mobha', 'મોભા'), p('Masar', 'માસર')]),
    t('Savli', 'સાવલી', [p('Savli (City)', 'સાવલી શહેર'), p('Manjusar', 'મંજુસર'), p('Lasundra', 'લસુન્દ્રા')]),
  ] },
  { ...p('Gandhinagar', 'ગાંધીનગર'), talukas: [
    t('Gandhinagar', 'ગાંધીનગર', [p('Adalaj', 'અડાલજ'), p('Pethapur', 'પેથાપુર'), p('Uvarsad', 'ઉવારસદ')]),
    t('Kalol', 'કલોલ', [p('Kalol (City)', 'કલોલ શહેર'), p('Saij', 'સઈજ'), p('Rancharda', 'રણછોડપુરા')]),
  ] },
];

export function talukasOf(district: string): Taluka[] {
  return DISTRICTS.find((d) => d.value === district)?.talukas ?? [];
}
export function villagesOf(district: string, taluka: string): Place[] {
  return talukasOf(district).find((x) => x.value === taluka)?.villages ?? [];
}
/** Demo survey numbers for a village (the live portal reads these from AnyROR). */
export function surveysOf(village: string): string[] {
  if (!village) return [];
  const seed = [...village].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 1, 2, 3].map((i) => `${100 + ((seed * (i + 3)) % 400)}${i % 2 ? '/' + (i + 1) : ''}`);
}

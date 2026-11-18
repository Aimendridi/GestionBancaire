import { editableImportLines, validateImportLine } from './import-line';
import { ImportLine } from '../../core/models/import.model';

describe('import line validation', () => {
  const line: ImportLine = { numeroLigne: 1, date: '2026-11-18', libelle: 'Salaire', montant: 100, type: 'REVENU', valide: true, messageErreur: null, incluse: true };
  it('accepts a real ISO date and positive amount', () => expect(validateImportLine(line)).toBeNull());
  it('rejects impossible dates and non-positive amounts', () => {
    expect(validateImportLine({ ...line, date: '2026-02-31' })).toBe('Date invalide');
    expect(validateImportLine({ ...line, montant: 0 })).toBe('Montant invalide');
  });
  it('excludes invalid, deselected, or edited-invalid rows', () => {
    expect(editableImportLines([line, { ...line, numeroLigne: 2, valide: false }, { ...line, numeroLigne: 3, incluse: false }, { ...line, numeroLigne: 4, montant: null }])).toEqual([line]);
  });
  it('keeps a user-excluded valid row out of the confirmation payload', () => {
    expect(editableImportLines([{ ...line, incluse: false }])).toEqual([]);
  });
});

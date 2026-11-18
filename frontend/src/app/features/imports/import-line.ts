import { ImportLine } from '../../core/models/import.model';

export function validateImportLine(line: Pick<ImportLine, 'date' | 'montant'>): string | null {
  if (!line.date || !/^\d{4}-\d{2}-\d{2}$/.test(line.date)) return 'Date invalide';
  const date = new Date(`${line.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== line.date) return 'Date invalide';
  if (line.montant === null || !Number.isFinite(Number(line.montant)) || Number(line.montant) <= 0) return 'Montant invalide';
  return null;
}

export function editableImportLines(lines: ImportLine[]) {
  return lines.filter(line => line.valide && line.incluse !== false && !validateImportLine(line));
}

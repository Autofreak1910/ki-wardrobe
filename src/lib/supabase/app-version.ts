// Zentrale Versions-Konfiguration.
//
// WICHTIG: CURRENT_VERSION nur hochzaehlen, wenn Nutzer WIRKLICH zum Update
// gezwungen werden sollen (z.B. neues Feature, wichtiger Fix). Nicht bei jedem
// Deployment automatisch -- das entscheidest du bewusst, indem du diese Datei
// aenderst und einen neuen Eintrag hinzufuegst.
//
// Ablauf:
// 1. Du baust ein neues Feature / einen Fix.
// 2. Du erhoehst CURRENT_VERSION (z.B. '1.2.0' -> '1.3.0').
// 3. Du fuegst oben in CHANGELOG einen neuen Eintrag mit den Aenderungen hinzu.
// 4. Committen + pushen wie gewohnt.
// 5. Nutzer, die eine aeltere Version im localStorage gespeichert haben, sehen
//    beim naechsten App-Start die Sperr-Seite mit dem Changelog und muessen
//    auf "Jetzt aktualisieren" tippen, um weiterzumachen.

export const CURRENT_VERSION = '1.0.0'

export type ChangelogEntry = {
  version: string
  date: string // z.B. '2026-08-03'
  notesDe: string[]
  notesEn: string[]
}

// Neueste Version IMMER ganz oben einfuegen.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-08-03',
    notesDe: [
      'Erste Version des Update-Systems',
    ],
    notesEn: [
      'First version of the update system',
    ],
  },
]

export function getLatestChangelogEntry(): ChangelogEntry {
  return CHANGELOG[0]
}
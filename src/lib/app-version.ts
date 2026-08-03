export const CURRENT_VERSION = '1.0.0'

export type ChangelogEntry = {
  version: string
  date: string
  notesDe: string[]
  notesEn: string[]
}

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

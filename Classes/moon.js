import { moonphase, julian } from 'astronomia'

// The four principal phases, from Meeus' Astronomical Algorithms (chapter 49), accurate to about a minute.
// Times are instants; which calendar day a phase lands on depends on the time zone, so the day is worked out
// from the instant plus a whole-hour UTC offset (UTC by default).
const PHASES = [
    { name: 'new', find: moonphase.newMoon },
    { name: 'first', find: moonphase.first },
    { name: 'full', find: moonphase.full },
    { name: 'last', find: moonphase.last }
]

const decimalYear = (date) => date.getUTCFullYear() + (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 1)) / (365.25 * 86400000)

// every principal phase between two instants, in time order: [{ phase, time: Date }]
export function phasesBetween (start, end) {
    const seen = new Map()
    const step = 0.02 // years: well under half a lunation, so no phase is skipped (duplicates are merged below)
    for (let y = decimalYear(start) - 0.1; y <= decimalYear(end) + 0.1; y += step) {
        PHASES.forEach(({ name, find }) => {
            const time = julian.JDEToDate(find(y))
            if (time < start || time > end) return
            seen.set(`${name}-${Math.round(time.getTime() / 60000)}`, { phase: name, time })
        })
    }
    return [...seen.values()].sort((a, b) => a.time - b.time)
}

const key = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// Map of 'yyyy-mm-dd' -> phase name for the calendar days of `days` (local Dates at midnight).
// utcOffset is the time zone's whole-hour offset from UTC, e.g. -5 for New York in winter.
export function phaseDays (days, utcOffset = 0) {
    const first = days[0], last = days[days.length - 1]
    const pad = 2*86400000
    const start = new Date(Date.UTC(first.getFullYear(), first.getMonth(), first.getDate()) - utcOffset*3600000 - pad)
    const end = new Date(Date.UTC(last.getFullYear(), last.getMonth(), last.getDate() + 1) - utcOffset*3600000 + pad)
    const out = new Map()
    phasesBetween(start, end).forEach(({ phase, time }) => {
        const local = new Date(time.getTime() + utcOffset*3600000) // read back with the UTC getters
        out.set(key(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate()), phase)
    })
    return out
}

export const dayKey = (day) => key(day.getFullYear(), day.getMonth() + 1, day.getDate())

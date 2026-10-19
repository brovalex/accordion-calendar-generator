import * as dateFns from 'date-fns'

// Horizontal flow, day grain: every page is a row of day columns.
// A page here is `{ days: [Date, ...] }` (the classic layout's pages are arrays of weeks instead).
export default class PlannerData {
    constructor (settings) {
        const preset = settings.preset
        const pagination = preset.pagination
        const startOfMonth = new Date(settings.start.year, settings.start.month - 1, 1)

        let pages = (pagination.mode === 'fixed')
            ? PlannerData.fixedPages(settings, pagination, startOfMonth)
            : PlannerData.monthlyPages(settings, pagination, startOfMonth)

        // an explicit page count wins over number of months (e.g. to keep the page count even)
        if (settings.pages) pages = pages.slice(0, settings.pages)

        this.pages = pages
        this.preset = preset
        this.weekStartsOn = settings.week_starts_on
        this.paper = settings.paper
        this.fonts = settings.fonts
        this.notes = []
        if (pages.length % 2 === 1) {
            this.notes.push(`${pages.length} pages is odd; use --pages to get an even count if the ends need to fold shut`)
        }
    }

    // each month starts on a fresh page and is divided over `pagesPerMonth` pages (e.g. 15 + 16 days)
    static monthlyPages (settings, pagination, startOfMonth) {
        const perMonth = pagination.pagesPerMonth
        if (!Number.isInteger(perMonth) || perMonth < 1) throw new Error('pagination.pagesPerMonth must be a whole number of 1 or more')
        const months = settings.pages ? Math.ceil(settings.pages / perMonth) : settings.number_of_months
        const pages = []
        for (let m = 0; m < months; m++) {
            const first = dateFns.addMonths(startOfMonth, m)
            const days = dateFns.eachDayOfInterval({ start: first, end: dateFns.lastDayOfMonth(first) })
            const base = Math.floor(days.length / perMonth)
            const extra = days.length % perMonth // the last pages get the spare days: 31 -> 15 + 16
            let at = 0
            for (let p = 0; p < perMonth; p++) {
                const count = base + (p >= perMonth - extra ? 1 : 0)
                pages.push({ days: days.slice(at, at + count) })
                at += count
            }
        }
        return pages
    }

    // every page holds the same number of days, beginning with the week that contains the 1st
    static fixedPages (settings, pagination, startOfMonth) {
        const perPage = pagination.daysPerPage
        if (!Number.isInteger(perPage) || perPage < 1) throw new Error('pagination.daysPerPage must be a whole number of 1 or more')
        const first = dateFns.startOfWeek(startOfMonth, { weekStartsOn: settings.week_starts_on })
        let count = settings.pages
        if (!count) {
            const last = dateFns.lastDayOfMonth(dateFns.addMonths(startOfMonth, settings.number_of_months - 1))
            count = Math.ceil((dateFns.differenceInCalendarDays(last, first) + 1) / perPage)
        }
        return [...Array(count)].map((_, p) => ({
            days: [...Array(perPage)].map((_, d) => dateFns.addDays(first, p * perPage + d))
        }))
    }
}

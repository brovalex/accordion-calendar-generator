import CalendarData from './calendarData.js'
import SVGCalendar from './svgCalendar.js'
import PlannerData from './plannerData.js'
import SVGPlanner from './svgPlanner.js'

// A layout is a combination of flow (which way pages fill up), grain (the unit along the flow)
// and what the other axis holds. Only the combinations below are drawn so far.
const layouts = {
    grid: { flow: 'vertical', grain: 'week', Data: CalendarData, SVG: SVGCalendar, ownsPageCount: false },
    planner: { flow: 'horizontal', grain: 'day', Data: PlannerData, SVG: SVGPlanner, ownsPageCount: true }
}

export function buildCalendar (settings) {
    const preset = settings.preset
    const layout = layouts[preset.layout]
    if (!layout) throw new Error(`preset "${preset.name}" has layout "${preset.layout}", which must be one of: ${Object.keys(layouts).join(', ')}`)
    if (preset.flow !== layout.flow || preset.grain !== layout.grain) {
        throw new Error(`preset "${preset.name}" asks for ${preset.flow} flow with ${preset.grain} grain; layout "${preset.layout}" only draws ${layout.flow} flow with ${layout.grain} grain so far`)
    }
    const data = new layout.Data(settings)
    if (layout.ownsPageCount) settings.fitPaperToPages(data.pages.length)
    const svg = new layout.SVG(data, settings.template)
    return { data, svg }
}

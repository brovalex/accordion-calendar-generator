import * as dateFns from 'date-fns'

export default class CalendarData {
    // raw calendar _data_
    // ... dateFns
    constructor (settings) {
        // private date crunching
        var start_date = new Date(settings.start.year, settings.start.month-1, 1)
        var end_date = dateFns.lastDayOfMonth(dateFns.addMonths(start_date,settings.number_of_months-1))
        var calStart = dateFns.startOfWeek(start_date,{weekStartsOn:settings.week_starts_on})
        var calEnd = dateFns.endOfWeek(end_date,{weekStartsOn:settings.week_starts_on})
        var calDays = dateFns.eachDayOfInterval({start: calStart, end: calEnd})
        var calWeeks = ((days) => {
            calWeeks = []
            while (days.length) {
                calWeeks.push(days.splice(0, 7));
            }
            return calWeeks
        })(calDays)
        var daysOfWeekMondayStart = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        var daysOfWeek = daysOfWeekMondayStart.slice(settings.week_starts_on-1).concat(daysOfWeekMondayStart.slice(0,settings.week_starts_on-1))
        // I'm adding the splitting by pages here because even though it's not pure date data, it's relevant for the context
        // There is a change that someone want a digital calendar and they won't care about page, but it's a nice "API" feature for those who do
        var calPages = ((weeks) => {
            calPages = [[]]
            var i = 0, j=0
            while (i < weeks.length) {
                // if day0 > day6 (e.g. 28 > 4) then it's last week of month which is carried over to next month
                var isLastWeek = dateFns.getDate(weeks[i][0]) > dateFns.getDate(weeks[i][6])
                // if day0 is on 1st, OR if last week but not first or last week... then next page
                if( (j!=0?dateFns.isFirstDayOfMonth(weeks[i][0]):false) || (isLastWeek && i!=0 && i!=weeks.length-1)) {
                    j+=1
                    calPages[j]=[]
                }
                calPages[j].push(weeks[i])
                i++
            }
            return calPages
        })(calWeeks)
        // public values
        this.weeks = calWeeks // TODO not sure if weeks is needed as public value
        this.daysOfWeek = daysOfWeek
        this.pages = calPages
    }
}

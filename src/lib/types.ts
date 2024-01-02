export type TODO = {
    _id: string
    _rev?: string
    date: string
    desc: string
    durationDay?: number | null,
    durationHour?: number | null,
    durationMin?: number | null,
    isDone: boolean
    remScheduleId?: number | null
    remSchedule?: string | null
    isRemNotified?: boolean
    remScheduleRepeats?: boolean
    remScheduleEvery?: string | null
}

export interface GroupedByDate {
    [date: string]: TODO[];
  }

export type TODO = {
    _id: string
    dateIso: string
    tasks: Task[]
    _rev?: string
}

export interface Task {
    id: number
    desc: string
    isDone: boolean
}

export type TODO = {
    id: number
    date: string
    tasks: Task[]
}

export interface Task {
    id: number
    desc: string
    isDone: boolean
}

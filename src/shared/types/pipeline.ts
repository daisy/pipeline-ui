export type Alive = {
  alive: boolean
  localfs?: boolean
  authentication?: boolean
  version?: string
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'Error',
  IDLE = 'Idle',
  RUNNING = 'Running',
  FAIL = 'Fail',
}

export type ResultFile = {
  mimeType: string
  size: string
  file?: string
  href?: string
}
export type NamedResult = {
  from: string
  href: string
  mimeType: string
  name: string
  nicename: string
  files: Array<ResultFile>
}

export type Results = {
  href: string
  mimeType: string
  namedResults: Array<NamedResult>
}

export enum MessageLevel {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
}

export type Message = {
  level: MessageLevel
  content: string
  sequence: number
  timestamp: number
}

export type AbstractJob = {
  id: string
  nicename?: string
  type: string
}

export type Job = AbstractJob & {
  href: string
  priority?: Priority
  status: Status
  log?: string
  results?: Results
  messages?: Array<Message>
  progress?: number
  script?: Script
  type: 'Job'
}

export type ScriptInput = {
  desc?: string
  mediaType?: string
  name: string
  sequence?: boolean
  required?: boolean
  nicename?: string
}

export type ScriptOption = {
  desc?: string
  mediaType?: string
  name: string
  sequence?: boolean
  required?: boolean
  nicename?: string
  ordered?: boolean
  type?: string
}

export type Script = {
  id: string
  href: string
  nicename: string
  description: string
  version?: string
  inputs?: Array<ScriptInput>
  options?: Array<ScriptOption>
}

export type NewJob = AbstractJob & {
  type: 'NewJob'
}

export type NameValue = {
  name: string
  value: string
}
export type Callback = {
  href: string
  type: ['messages', 'status']
  frequency: string
}
export type JobRequest = {
  scriptHref: string
  nicename?: string
  priority?: ['high', 'medium', 'low']
  batchId?: string
  inputs?: Array<NameValue>
  options?: Array<NameValue>
  outputs?: Array<NameValue>
  callbacks?: Array<Callback>
}

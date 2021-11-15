export enum units {
    hour = "hr",
    minutes = "min",
    seconds = "sec"
}

export interface time {
    value: number,
    unit: units
}

export interface userAuthenticator {
    username: string,
    timestamp: Date
}

export interface serviceTicket {
    username: string, 
    serviceId: number,
    timestamp: Date,
    userIpAddress: string,
    lifeTimeForServiceTicket: time,
    serviceSessionKey: string
}

export interface I {
    serviceId: number,
    timestamp: Date,
    data: Array<String>
}
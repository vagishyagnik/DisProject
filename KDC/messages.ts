export enum units {
    hour = "hr",
    minutes = "min",
    seconds = "sec"
}

export interface time {
    value: number,
    unit: units
}

export interface userDetails {
    username: string,
    hashedPassword: string
}

export interface A {
    username: string,
    serviceId: number,
    userIpAddress: string,
    requestedLifeTimeForTGT: time
}

export interface B {
    TGSid: number,
    timestamp: Date,
    lifetime: time,
    TGSsk: string
}

export interface TGT {
    username: string,
    TGSid: number,
    timestamp: Date,
    userIpAddress: string,
    lifetimeForTGT: time,
    TGSsk: string
}

export interface D {
    serviceId: number,
    requestedLifeTimeForTGT: time
}

export interface userAuthenticator {
    username: string,
    timestamp: Date
}

export interface F {
    serviceId: number,
    timestamp: Date,
    lifetime: time,
    serviceSessionKey: string
}

export interface serviceTicket {
    username: string, 
    serviceId: number,
    timestamp: Date,
    userIpAddress: string,
    lifeTimeForServiceTicket: time,
    serviceSessionKey: string
}

export interface KeyEx{
    publicKey: string,
    random: string
}

export interface AuthSer{
    cipherB : B,
    cipherTGT : TGT
}
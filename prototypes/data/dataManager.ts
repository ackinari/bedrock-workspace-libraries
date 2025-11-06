import { Entity, Player, Vector3 } from "@minecraft/server"

type DynamicData = string | number | boolean | Vector3 | object | null

export type GetData = (this: Entity | Player, identifier: string) => DynamicData
export type SetData = (this: Entity | Player, identifier: string, data: DynamicData) => DynamicData
export type ResetData = (this: Entity | Player, identifier: string) => void
export type ClearData = (this: Entity | Player, identifier: string) => void

declare module "@minecraft/server" {
    interface Entity {
        getData: GetData
        setData: SetData
        resetData: ResetData
        clearData: ClearData
    }
}

const getData: GetData = function (this, identifier) {
    let value = this.getDynamicProperty(identifier)
    if (value === undefined) {
        this.setDynamicProperty(identifier, JSON.stringify(null))
        return null
    }
    try {
        return JSON.parse(value as string)
    } catch {
        return value
    }
}

const setData: SetData = function (this, identifier, data) {
    this.setDynamicProperty(identifier, JSON.stringify(data))
    return data
}

const resetData: ResetData = function (this, identifier) {
    this.setDynamicProperty(identifier, JSON.stringify(null))
}

const clearData: ClearData = function (this, identifier) {
    this.setDynamicProperty(identifier, undefined)
}

Entity.prototype.getData = getData
Entity.prototype.setData = setData
Entity.prototype.resetData = resetData
Entity.prototype.clearData = clearData
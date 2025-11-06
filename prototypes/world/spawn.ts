import { Dimension, Entity, EntityType } from '@minecraft/server'

type coordinate = number | '~'
type Vector3String = `${coordinate} ${coordinate} ${coordinate}`
export type Identifier = EntityType | string

export interface SpawnEntityByCommandOptions {
    location?: {x?: coordinate; y?: coordinate; z?: coordinate} | Vector3String
    rotation?: {x?: coordinate; y?: coordinate}
    spawnEvent?: string
    nameTag?: string
}

export type SpawnEntityByCommand = (this: Dimension | Entity, identifier: Identifier, options?: SpawnEntityByCommandOptions, debug?: boolean) => Entity | undefined

declare module '@minecraft/server' {
    interface Dimension {
        spawnEntityByCommand: SpawnEntityByCommand
    }
    interface Entity {
        spawnEntityByCommand: SpawnEntityByCommand
    }
}

const spawnEntityByCommand: SpawnEntityByCommand = function (this, identifier, options = {}, debug = false) {
    const location = options.location
    const loc = typeof location === 'object' && Object.keys(location).length > 0 ? `${location.x ?? '~'} ${location.y ?? '~'} ${location.z ?? '~'}` : typeof location === 'string' ? location : '~ ~ ~'

    const rot = `${options.rotation?.x ?? '~'} ${options.rotation?.y ?? '~'}`
    const event = options.spawnEvent ? `${options.spawnEvent}` : '""'
    const command = `summon ${identifier} ${loc} ${rot} ${event} spawned`

    if (debug) console.log(command)
    this.runCommand(command)

    const dimension = this instanceof Entity ? this.dimension : this
    const entity = dimension.getEntities({name: 'spawned'})?.[0]

    if (entity) entity.nameTag = options.nameTag ?? ''
    return entity
}

Dimension.prototype.spawnEntityByCommand = spawnEntityByCommand
Entity.prototype.spawnEntityByCommand = spawnEntityByCommand

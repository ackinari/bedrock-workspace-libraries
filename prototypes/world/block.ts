import {Vector3Utils} from '@minecraft/math'
import {Block, BlockRaycastOptions, Direction, Player, Vector3} from '@minecraft/server'

// ============ TYPE DECLARATIONS ============

type BlockRaycastResult = {
    block: Block
    face: Direction
    faceLocation: Vector3
    relativeLocation: Vector3
    adjacentBlock?: Block
    isHorizontalFace: boolean
    isVerticalFace: boolean
}

declare module '@minecraft/server' {
    interface Player {
        /**
         * Enhanced version of getBlockFromViewDirection with additional utilities
         */
        getRelativeBlockFromViewDirection(options?: BlockRaycastOptions): BlockRaycastResult | undefined

        /**
         * Gets the adjacent block from the player's view direction
         */
        getAdjacentBlockFromView(options?: BlockRaycastOptions): Block | undefined

        /**
         * Gets the block the player is looking at
         */
        getTargetBlock(options?: BlockRaycastOptions): Block | undefined

        /**
         * Gets the face vector the player is looking at
         */
        getViewFaceVector(options?: BlockRaycastOptions): Vector3 | undefined
    }

    interface Block {
        /**
         * Gets a block in a specific direction
         */
        getBlockAtDirection(direction: Direction, steps?: number): Block | undefined

        /**
         * Gets all adjacent blocks (6 directions)
         */
        getAdjacentBlocks(): {
            up?: Block
            down?: Block
            north?: Block
            south?: Block
            east?: Block
            west?: Block
        }

        /**
         * Checks if the block is on the ground (has solid block below)
         */
        isOnGround(): boolean

        /**
         * Gets the distance to another block or position
         */
        distanceTo(target: Vector3 | Block): number

        /**
         * Converts the block to Vector3
         */
        toVector3(): Vector3

        /**
         * Checks if the block is solid (not air and not liquid)
         */
        isSolid(): boolean

        /**
         * Gets blocks in a line from this block to target
         */
        getBlocksInLine(target: Vector3 | Block, maxDistance?: number): Block[]
    }
}

// ============ PLAYER PROTOTYPES ============

Player.prototype.getRelativeBlockFromViewDirection = function (options?: BlockRaycastOptions): BlockRaycastResult | undefined {
    const hitResult = this.getBlockFromViewDirection(options)

    if (!hitResult) return undefined

    const relativeLocation: Vector3 = {
        x: hitResult.face === Direction.East ? 1 : hitResult.face === Direction.West ? -1 : 0,
        y: hitResult.face === Direction.Up ? 1 : hitResult.face === Direction.Down ? -1 : 0,
        z: hitResult.face === Direction.South ? 1 : hitResult.face === Direction.North ? -1 : 0,
    }

    const adjacentBlock = hitResult.block.offset(relativeLocation)

    const isHorizontal = [Direction.North, Direction.South, Direction.East, Direction.West].includes(hitResult.face)

    const isVertical = hitResult.face === Direction.Up || hitResult.face === Direction.Down

    return {
        block: hitResult.block,
        face: hitResult.face,
        faceLocation: hitResult.faceLocation,
        relativeLocation,
        adjacentBlock,
        isHorizontalFace: isHorizontal,
        isVerticalFace: isVertical,
    }
}

Player.prototype.getAdjacentBlockFromView = function (options?: BlockRaycastOptions): Block | undefined {
    const result = this.getRelativeBlockFromViewDirection(options)
    return result?.adjacentBlock
}

Player.prototype.getTargetBlock = function (options?: BlockRaycastOptions): Block | undefined {
    const hitResult = this.getBlockFromViewDirection(options)
    return hitResult?.block
}

Player.prototype.getViewFaceVector = function (options?: BlockRaycastOptions): Vector3 | undefined {
    const result = this.getRelativeBlockFromViewDirection(options)
    return result?.relativeLocation
}

// ============ BLOCK PROTOTYPES ============

Block.prototype.getBlockAtDirection = function (direction: Direction, steps: number = 1): Block | undefined {
    switch (direction) {
        case Direction.Up:
            return this.above(steps)
        case Direction.Down:
            return this.below(steps)
        case Direction.North:
            return this.north(steps)
        case Direction.South:
            return this.south(steps)
        case Direction.East:
            return this.east(steps)
        case Direction.West:
            return this.west(steps)
        default:
            return undefined
    }
}

Block.prototype.getAdjacentBlocks = function () {
    return {
        up: this.above(),
        down: this.below(),
        north: this.north(),
        south: this.south(),
        east: this.east(),
        west: this.west(),
    }
}

Block.prototype.isOnGround = function (): boolean {
    const blockBelow = this.below()
    if (!blockBelow) return false

    try {
        return !blockBelow.isAir && !blockBelow.isLiquid
    } catch {
        return false
    }
}

Block.prototype.distanceTo = function (target: Vector3 | Block): number {
    const targetPos = 'location' in target ? target.location : target
    return Vector3Utils.distance(this.location, targetPos)
}

Block.prototype.toVector3 = function (): Vector3 {
    return {x: this.x, y: this.y, z: this.z}
}

Block.prototype.isSolid = function (): boolean {
    try {
        return !this.isAir && !this.isLiquid
    } catch {
        return false
    }
}

Block.prototype.getBlocksInLine = function (target: Vector3 | Block, maxDistance: number = 100): Block[] {
    const targetPos = 'location' in target ? target.location : target
    const startPos = this.location

    const distance = Vector3Utils.distance(startPos, targetPos)
    if (distance > maxDistance) return []

    const blocks: Block[] = []
    const steps = Math.ceil(distance)

    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const pos = Vector3Utils.lerp(startPos, targetPos, t)
        const flooredPos = Vector3Utils.floor(pos)

        const block = this.dimension.getBlock(flooredPos)
        if (block && !blocks.some((b) => b.location.x === block.location.x && b.location.y === block.location.y && b.location.z === block.location.z)) {
            blocks.push(block)
        }
    }

    return blocks
}

// ============ HELPER FUNCTIONS ============

/**
 * Converts Direction to Vector3
 */
export function directionToVector(direction: Direction): Vector3 {
    switch (direction) {
        case Direction.Up:
            return {x: 0, y: 1, z: 0}
        case Direction.Down:
            return {x: 0, y: -1, z: 0}
        case Direction.North:
            return {x: 0, y: 0, z: -1}
        case Direction.South:
            return {x: 0, y: 0, z: 1}
        case Direction.East:
            return {x: 1, y: 0, z: 0}
        case Direction.West:
            return {x: -1, y: 0, z: 0}
        default:
            return {x: 0, y: 0, z: 0}
    }
}

/**
 * Gets the opposite direction
 */
export function getOppositeDirection(direction: Direction): Direction {
    const opposites: Record<Direction, Direction> = {
        [Direction.Up]: Direction.Down,
        [Direction.Down]: Direction.Up,
        [Direction.North]: Direction.South,
        [Direction.South]: Direction.North,
        [Direction.East]: Direction.West,
        [Direction.West]: Direction.East,
    }
    return opposites[direction]
}

/**
 * Checks if two directions are opposite
 */
export function areDirectionsOpposite(dir1: Direction, dir2: Direction): boolean {
    return getOppositeDirection(dir1) === dir2
}

/**
 * Gets all horizontal directions
 */
export function getHorizontalDirections(): Direction[] {
    return [Direction.North, Direction.South, Direction.East, Direction.West]
}

/**
 * Gets all vertical directions
 */
export function getVerticalDirections(): Direction[] {
    return [Direction.Up, Direction.Down]
}

/**
 * Gets all directions
 */
export function getAllDirections(): Direction[] {
    return [Direction.Up, Direction.Down, Direction.North, Direction.South, Direction.East, Direction.West]
}

export {}

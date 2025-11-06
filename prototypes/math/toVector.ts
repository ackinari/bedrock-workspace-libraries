import { Vector2, Vector3, VectorXZ } from '@minecraft/server';

type Vector = {x: number} | VectorXZ | Vector2 | Vector3

declare global {
    interface String {
        toVector(options: {offset?: Partial<Vector3> | number; xz: true}): VectorXZ
        toVector(options?: {offset?: Partial<Vector3> | number; xz?: false}): Vector3
        toVector(options?: {offset?: Partial<Vector3> | number; xz?: boolean}): Vector
    }
}

String.prototype.toVector = function (options?: {offset?: Partial<Vector3> | number; xz?: boolean}): any {
    const offset = typeof options?.offset == 'object' ? (options?.offset ?? {}) : {x: options?.offset, y: options?.offset, z: options?.offset}
    const xz = options?.xz ?? false
    const parts = this.trim().split(/\s+/).map(Number)

    if (parts.some(isNaN)) throw new Error(`Invalid vector string: "${this}"`)

    if (xz) {
        if (parts.length < 2) throw new Error(`XZ vector requires at least 2 values: "${this}"`)
        return {
            x: parts[0] + (offset.x ?? 0),
            z: parts[1] + (offset.z ?? 0),
        } satisfies VectorXZ
    }

    if (parts.length === 1) {
        return {x: parts[0] + (offset.x ?? 0)}
    }

    if (parts.length === 2) {
        return {
            x: parts[0] + (offset.x ?? 0),
            y: parts[1] + (offset.y ?? 0),
        } satisfies Vector2
    }

    return {
        x: parts[0] + (offset.x ?? 0),
        y: parts[1] + (offset.y ?? 0),
        z: parts[2] + (offset.z ?? 0),
    } satisfies Vector3
}

export { };


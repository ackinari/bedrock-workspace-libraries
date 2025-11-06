import * as debug from '@minecraft/debug-utilities'
import { RGB, Vector3 } from '@minecraft/server'

// ==================== TYPES ====================
type ShapeCallback<T> = (shape: T, dt: number) => void

interface DrawOptionsBase {
    id?: string
    color?: RGB
    scale?: number
    location?: Vector3
    duration?: number
}

interface LineOptions extends DrawOptionsBase {
    start: Vector3
    end: Vector3
}

interface ArrowOptions extends DrawOptionsBase {
    start: Vector3
    end: Vector3
}

interface TextOptions extends DrawOptionsBase {
    text: string
}

// ==================== SHAPE MANAGER ====================
class ShapeManager<T extends debug.DebugShape> {
    private shapes = new Map<string, {shape: T; callback?: ShapeCallback<T>; duration?: number}>()
    private lastTime = Date.now()

    constructor(private createShape: (loc: Vector3) => T) {}

    private genId(): string {
        return Math.random().toString(36).slice(2)
    }

    // draw supports either options object (including id) or a callback
    draw(arg: DrawOptionsBase | ShapeCallback<T>): T {
        const now = Date.now()
        const dt = (now - this.lastTime) / 1000
        this.lastTime = now

        // callback mode
        if (typeof arg === 'function') {
            const tempId = this.genId()
            const loc = {x: 0, y: 0, z: 0}
            const shape = this.createShape(loc)

            debug.debugDrawer.addShape(shape)
            const entry = {shape, callback: arg, duration: undefined}
            this.shapes.set(tempId, entry)

            // run callback once immediately
            arg(shape, dt)

            // allow callback to set shape.id to rename it
            const maybeId = (shape as any).id
            if (typeof maybeId === 'string' && maybeId !== tempId) {
                // avoid id collision: if exists remove old and rekey
                this.shapes.delete(tempId)
                if (this.shapes.has(maybeId)) this.remove(maybeId)
                this.shapes.set(maybeId, entry)
            }

            return shape
        }

        // options mode
        const opt = arg as DrawOptionsBase
        const id = opt.id ?? this.genId()
        let entry = this.shapes.get(id)

        if (!entry) {
            const loc = opt.location ?? {x: 0, y: 0, z: 0}
            const shape = this.createShape(loc)

            if (opt.color) (shape as any).color = opt.color
            if (opt.scale !== undefined) (shape as any).scale = opt.scale
            if (opt.duration !== undefined) {
                // use DebugShape.timeLeft (seconds) as the API expects
                try {
                    ;(shape as any).timeLeft = opt.duration
                } catch {}
            }

            debug.debugDrawer.addShape(shape)
            entry = {shape, callback: undefined, duration: opt.duration}
            this.shapes.set(id, entry)
        } else {
            // update existing basic props if provided
            const shape = entry.shape
            if (opt.color) (shape as any).color = opt.color
            if (opt.scale !== undefined) (shape as any).scale = opt.scale
            if (opt.location) {
                try {
                    ;(shape as any).setLocation(opt.location)
                } catch {}
            }
            if (opt.duration !== undefined) {
                entry.duration = opt.duration
                try {
                    ;(shape as any).timeLeft = opt.duration
                } catch {}
            }
        }

        return entry.shape
    }

    remove(id: string): boolean {
        const entry = this.shapes.get(id)
        if (!entry) return false
        try {
            debug.debugDrawer.removeShape(entry.shape)
        } catch {}
        this.shapes.delete(id)
        return true
    }

    clear(): void {
        this.shapes.forEach((e) => {
            try {
                debug.debugDrawer.removeShape(e.shape)
            } catch {}
        })
        this.shapes.clear()
    }

    get(id: string): T | undefined {
        return this.shapes.get(id)?.shape
    }

    update(): void {
        const now = Date.now()
        const dt = (now - this.lastTime) / 1000
        this.lastTime = now

        // iterate a copy of entries to avoid modification-during-iteration issues
        for (const [id, entry] of Array.from(this.shapes.entries())) {
            entry.callback?.(entry.shape, dt)

            // if DebugShape exposes timeLeft, remove when it reaches 0 or less
            const timeLeft = (entry.shape as any).timeLeft
            if (typeof timeLeft === 'number' && timeLeft <= 0) {
                // defensive: ensure the debug drawer also doesn't keep it
                this.remove(id)
                continue
            }

            // Defensive: if the shape was removed externally (debugDrawer), try to detect and clean
            // some DebugShape implementations may expose an 'isRemoved' or similar; we can't rely on it,
            // so as a fallback, if the shape field is falsy, remove the entry.
            if (!entry.shape) {
                this.shapes.delete(id)
            }
        }
    }
}

// ==================== DRAW API ====================
export class Draw {
    private static boxManager = new ShapeManager((loc) => new debug.DebugBox(loc))
    private static circleManager = new ShapeManager((loc) => new debug.DebugCircle(loc))
    private static lineManager = new ShapeManager((loc) => new debug.DebugLine(loc, loc))
    private static sphereManager = new ShapeManager((loc) => new debug.DebugSphere(loc))
    private static arrowManager = new ShapeManager((loc) => new debug.DebugArrow(loc, loc))
    private static textManager = new ShapeManager((loc) => new debug.DebugText(loc, ''))

    // Box / Circle / Sphere keep previous overload style but no id-first arg
    static box(arg: DrawOptionsBase | ShapeCallback<debug.DebugBox>) {
        return this.boxManager.draw(arg)
    }
    static circle(arg: DrawOptionsBase | ShapeCallback<debug.DebugCircle>) {
        return this.circleManager.draw(arg)
    }
    static sphere(arg: DrawOptionsBase | ShapeCallback<debug.DebugSphere>) {
        return this.sphereManager.draw(arg)
    }

    // Line expects options with start & end or a callback
    static line(arg: LineOptions | ShapeCallback<debug.DebugLine>) {
        if (typeof arg === 'function') {
            return this.lineManager.draw(arg)
        }
        const opts = arg as LineOptions
        // create/update using location=start, and ensure endLocation set
        const shape = this.lineManager.draw({
            id: opts.id,
            color: opts.color,
            scale: opts.scale,
            location: opts.start,
            duration: opts.duration,
        })
        try {
            ;(shape as any).endLocation = opts.end
        } catch {}
        return shape
    }

    // Arrow expects options with start & end or a callback
    static arrow(arg: ArrowOptions | ShapeCallback<debug.DebugArrow>) {
        if (typeof arg === 'function') {
            return this.arrowManager.draw(arg)
        }
        const opts = arg as ArrowOptions
        const shape = this.arrowManager.draw({
            id: opts.id,
            color: opts.color,
            scale: opts.scale,
            location: opts.start,
            duration: opts.duration,
        })
        try {
            ;(shape as any).endLocation = opts.end
        } catch {}
        return shape
    }

    // Text expects options with text and location or a callback
    static text(arg: TextOptions | ShapeCallback<debug.DebugText>) {
        if (typeof arg === 'function') {
            return this.textManager.draw(arg)
        }
        const opts = arg as TextOptions
        const shape = this.textManager.draw({
            id: opts.id,
            color: opts.color,
            scale: opts.scale,
            location: opts.location,
            duration: opts.duration,
        })
        try {
            ;(shape as any).text = opts.text
        } catch {}
        return shape
    }

    static remove(id: string): boolean {
        return (
            this.boxManager.remove(id) || this.circleManager.remove(id) || this.lineManager.remove(id) || this.sphereManager.remove(id) || this.arrowManager.remove(id) || this.textManager.remove(id)
        )
    }

    static clear(): void {
        this.boxManager.clear()
        this.circleManager.clear()
        this.lineManager.clear()
        this.sphereManager.clear()
        this.arrowManager.clear()
        this.textManager.clear()
    }

    static update(): void {
        this.boxManager.update()
        this.circleManager.update()
        this.lineManager.update()
        this.sphereManager.update()
        this.arrowManager.update()
        this.textManager.update()
    }

    static get(id: string) {
        return this.boxManager.get(id) || this.circleManager.get(id) || this.lineManager.get(id) || this.sphereManager.get(id) || this.arrowManager.get(id) || this.textManager.get(id)
    }
}

// ==================== HELPERS ====================
export const Colors = {
    RED: {red: 1, green: 0, blue: 0},
    GREEN: {red: 0, green: 1, blue: 0},
    BLUE: {red: 0, green: 0, blue: 1},
    YELLOW: {red: 1, green: 1, blue: 0},
    CYAN: {red: 0, green: 1, blue: 1},
    MAGENTA: {red: 1, green: 0, blue: 1},
    WHITE: {red: 1, green: 1, blue: 1},
    BLACK: {red: 0, green: 0, blue: 0},
    ORANGE: {red: 1, green: 0.5, blue: 0},
    PURPLE: {red: 0.5, green: 0, blue: 1},
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpColor = (a: RGB, b: RGB, t: number): RGB => ({
    red: lerp(a.red, b.red, t),
    green: lerp(a.green, b.green, t),
    blue: lerp(a.blue, b.blue, t),
})
export const getVelocityColor = (speed: number, maxSpeed = 1): RGB => ({
    red: Math.min(speed / maxSpeed, 1),
    green: 1 - Math.min(speed / maxSpeed, 1),
    blue: 0,
})

/**
 * @author aKiNaRi, 2025
 * @discord akinari.
 * @name DebugAPI - aKiNaRi Object DebugAPI
 * @version 0.1.4
 * @license OPL-1.0
 * @description Debug Tool for JS Objects with text highlighting and UI
 * @notice Licensed under the Open Productivity License (OPL)
 */

import { InputButton, Player, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

export const Colors = {
    black: '§0', dark_blue: '§1', dark_green: '§2', dark_aqua: '§3',
    dark_red: '§4', dark_purple: '§5', gold: '§6', gray: '§7',
    dark_gray: '§8', blue: '§9', green: '§a', aqua: '§b',
    red: '§c', light_purple: '§d', yellow: '§e', white: '§f',
    minecoin_gold: '§g', material_quartz: '§h', material_iron: '§i',
    material_netherite: '§j', material_redstone: '§m', material_copper: '§n',
    material_gold: '§p', material_emerald: '§q', material_diamond: '§s',
    material_lapis: '§t', material_amethyst: '§u',
} as const;
export type Colors = (typeof Colors)[keyof typeof Colors];

const DEFAULT_CONFIG: DebugOptions = {
    title: "DEBUG.A",
    maxLines: 28,
    indentSize: 4,
    highlight: {
        enabled: true,
        palette: "default",
        onChange: {
            enabled: true,
            cooldown: 0.25,
            format: { bold: false, italic: false, colored: true, fullLine: false, },
        },
    },
    indicators: {
        enabled: true,
        centered: true,
        position: "top",
        show: {
            densityMap: false,
            scrollVelocity: false,
            statistics: false,
            progress: { number: false, style: "brackets", bar: false, percentage: true, },
        },
        sound: { enabled: true, sound: "random.click", pitch: 2, volume: 0.25, },
    },
    visual: {
        alternateLineNumbers: true,
        border: false,
        indentGuides: 'bracketColor',
        lineNumbers: true,
        separators: false,
        typeIndicators: false,
    },
    braces: {
        hideFirstLast: true,
        hide: false
    },
    scroll: {
        enabled: true,
        invert: false,
        shiftLock: { enabled: true, lockSlot: false, invert: false },
        fastMultiplier: 3,
        fastThreshold: 2,
        momentum: true,
        scrollAmount: 1,
    },
    bookmarks: {
        enabled: true,
        marks: []
    },
    selection: {
        enabled: true,
        mode: "doubleShift",
        delay: 0.35,
        showDelay: false,
        sound: { enabled: true, sound: "random.click", pitch: 3, volume: 0.5, },
    },
    filter: {
        enabled: false,
        keys: [],
        mode: "include",
        recursive: false
    },
    autoScroll: {
        enabled: false,
        scrollAmount: 1,
        speed: 20,
        direction: "down",
    },
    changeHistory: {
        enabled: false,
        maxEntries: 10
    },
};

interface ColorPalette {
    braces: (string | Colors)[];
    key: string | Colors;
    string: string | Colors;
    number: string | Colors;
    boolean: string | Colors;
    null: string | Colors;
    default: string | Colors;
    highlight: string | Colors;
}

interface BookmarkMark { name: string; position?: number; }

interface HighlightConfig {
    enabled?: boolean;
    palette?: 'default' | 'dark' | 'vibrant' | 'retro' | 'neon' | ColorPalette;
    onChange?: { enabled?: boolean; cooldown?: number; format?: { bold?: boolean; italic?: boolean; colored?: boolean | Colors; fullLine?: boolean; }; };
}

interface IndicatorConfig {
    enabled?: boolean;
    centered?: boolean;
    position?: "top" | "bottom" | number;
    show?: {
        densityMap?: boolean;
        scrollVelocity?: boolean;
        statistics?: boolean;
        progress?: { number?: boolean | "brackets" | "parentheses" | "minimal"; style?: "brackets" | "parentheses" | "minimal"; bar?: boolean | "blocks" | "dots" | "arrows" | "slim" | "thick" | "modern" | "gradient" | "retro" | "wave" | "fire" | "minimap"; percentage?: boolean; };
    };
    sound?: { enabled?: boolean; sound?: string; pitch?: number; volume?: number };
}

interface VisualConfig {
    alternateLineNumbers?: boolean;
    border?: boolean | "simple" | "double" | "thick" | "rounded" | "ascii" | "dots";
    indentGuides?: boolean | 'bracketColor';
    lineNumbers?: boolean;
    separators?: boolean;
    typeIndicators?: boolean;
}

interface BraceConfig { hideFirstLast?: boolean; hide?: boolean | "all"; }
interface ScrollConfig { enabled?: boolean; invert?: boolean; shiftLock?: { enabled?: boolean; lockSlot?: boolean; invert?: boolean; }; fastMultiplier?: number; fastThreshold?: number; momentum?: boolean; scrollAmount?: number; }
interface BookmarkConfig { enabled?: boolean; marks?: BookmarkMark[]; }
interface SelectionConfig { enabled?: boolean; mode?: "doubleShift"; delay?: number; showDelay?: boolean; highlight?: boolean | Colors; sound?: { enabled?: boolean; sound?: string; pitch?: number; volume?: number }; }
interface FilterConfig { enabled?: boolean; keys?: string[]; mode?: 'include' | 'exclude'; recursive?: boolean; }
interface AutoScrollConfig { enabled?: boolean; scrollAmount?: number; speed?: number; direction?: 'up' | 'down' | 'backAndForth'; }
interface ChangeHistoryConfig { enabled?: boolean; maxEntries?: number; }

interface DebugOptions {
    maxLines?: number; indentSize?: number; title?: string;
    highlight?: HighlightConfig; indicators?: IndicatorConfig; visual?: VisualConfig;
    braces?: BraceConfig; scroll?: ScrollConfig; bookmarks?: BookmarkConfig;
    selection?: SelectionConfig; startLine?: number; filter?: FilterConfig;
    autoScroll?: AutoScrollConfig; changeHistory?: ChangeHistoryConfig;
}

interface ScrollState {
    currentSlot: number; scrollPosition: number; totalLines: number; maxScroll: number;
    lastUsed: number; isLocked: boolean; lockedSlot: number; lastScrollTime: number;
    scrollVelocity: number; bookmarks: Map<string, number>; startLine: number;
    lastContent: any; changedPaths: Set<string>; highlightedChanges: Map<string, number>;
    selectionMode: boolean; selectedLine: number; cursorPosition: number;
    lastShiftTime?: number; shiftDelayTimer?: number; showingDelayIndicator?: boolean;
    lastShiftState?: boolean; changeHistory?: Array<{ timestamp: number; paths: string[] }>;
    autoScrollTimer?: number; autoScrollDirection?: number;
}

interface DebugResult {
    totalLines: number; maxScroll: number; scroll: number; canScroll: boolean;
    isLocked: boolean; selectionMode: boolean; selectedLine: number;
    stats?: ContentStats; changedPaths: string[]; error?: Error;
}

interface ContentStats {
    totalLines: number; totalCharacters: number; visibleCharacters: number;
    avgLineLength: number; maxLineLength: number; objectKeys: number; nestingDepth: number;
}

interface SelectionInfo { selectionMode: boolean; selectedLine: number; cursorPosition: number; }
type PresetType = 'default' | 'minimal' | 'compact';

export class DebugAPI {
    private static readonly DEFAULT_PALETTE: ColorPalette = Object.freeze({
        braces: ["§e", "§d", "§9"], key: "§b", string: "§a", number: "§6", boolean: "§g", null: "§8", default: "§f", highlight: "§c"
    });

    private static readonly PALETTES: Record<string, ColorPalette> = Object.freeze({
        default: { braces: ["§e", "§d", "§9"], key: "§b", string: "§a", number: "§6", boolean: "§g", null: "§8", default: "§f", highlight: "§c" },
        dark: { braces: ["§8", "§7", "§f"], key: "§f", string: "§a", number: "§6", boolean: "§e", null: "§8", default: "§7", highlight: "§e" },
        vibrant: { braces: ["§c", "§a", "§b"], key: "§d", string: "§e", number: "§c", boolean: "§a", null: "§8", default: "§f", highlight: "§c" },
        retro: { braces: ["§2", "§a", "§6"], key: "§a", string: "§2", number: "§6", boolean: "§e", null: "§8", default: "§f", highlight: "§6" },
        neon: { braces: ["§5", "§d", "§b"], key: "§b", string: "§d", number: "§5", boolean: "§b", null: "§8", default: "§f", highlight: "§d" }
    });

    private static readonly PRESETS: Record<PresetType, Partial<DebugOptions>> = {
        default: DEFAULT_CONFIG,
        minimal: {
            title: "DEBUG", maxLines: 20, indentSize: 2,
            highlight: { enabled: true, palette: 'default', onChange: { enabled: false } },
            indicators: { enabled: true, centered: false, position: "top", show: { progress: { percentage: true, bar: false, number: false } }, sound: { enabled: false } },
            visual: { lineNumbers: false, indentGuides: false, alternateLineNumbers: false, border: false, separators: false, typeIndicators: false },
            braces: { hideFirstLast: true, hide: false }, scroll: { enabled: true, scrollAmount: 1, fastMultiplier: 2 },
            bookmarks: { enabled: false }, selection: { enabled: false }
        },
        compact: {
            title: "", maxLines: 35, indentSize: 2,
            highlight: { enabled: true, palette: 'dark', onChange: { enabled: false } },
            indicators: { enabled: true, centered: false, position: "top", show: { progress: { number: true, style: "minimal", bar: false, percentage: false } }, sound: { enabled: false } },
            visual: { lineNumbers: true, indentGuides: false, alternateLineNumbers: true, border: false, separators: false, typeIndicators: false },
            braces: { hideFirstLast: true, hide: true }, scroll: { enabled: true, scrollAmount: 2, fastMultiplier: 4 },
            bookmarks: { enabled: false }, selection: { enabled: false }
        }
    };

    private static readonly COLOR_REGEX = /§./g;
    private static readonly NUMBER_REGEX = /^[0-9.eE+-]+$/;
    private static lengthCache = new Map<string, number>();
    private static scrollStates = new Map<string, ScrollState>();

    private static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    private static getScrollState(player: Player): ScrollState {
        const playerId = player.id;
        if (!this.scrollStates.has(playerId)) {
            this.scrollStates.set(playerId, {
                currentSlot: player.selectedSlotIndex, scrollPosition: 0, totalLines: 0, maxScroll: 0,
                lastUsed: Date.now(), isLocked: false, lockedSlot: 4, lastScrollTime: 0, scrollVelocity: 0,
                bookmarks: new Map(), startLine: 0, lastContent: null, changedPaths: new Set(),
                highlightedChanges: new Map(), selectionMode: false, selectedLine: 0, cursorPosition: 0,
                changeHistory: [], autoScrollDirection: 1
            });
        }
        const state = this.scrollStates.get(playerId)!;
        state.lastUsed = Date.now();
        return state;
    }

    private static getSlotDelta(oldSlot: number, newSlot: number): number {
        let delta = newSlot - oldSlot;
        if (oldSlot === 8 && newSlot === 0) delta = 1;
        else if (oldSlot === 0 && newSlot === 8) delta = -1;
        else if (Math.abs(delta) > 4) delta = delta > 0 ? delta - 9 : delta + 9;
        return delta;
    }

    private static detectChanges(player: Player, currentObj: any, highlightConfig: HighlightConfig, historyConfig?: ChangeHistoryConfig): Set<string> {
        if (!highlightConfig.onChange?.enabled) return new Set();
        const state = this.getScrollState(player);
        const changes = new Set<string>();
        const currentTime = Date.now();
        const cooldownTime = (highlightConfig.onChange.cooldown || 0.5) * 1000;
        if (state.lastContent) this.compareObjects("", state.lastContent, currentObj, changes);
        changes.forEach(path => state.highlightedChanges.set(path, currentTime + cooldownTime));
        for (const [path, expireTime] of state.highlightedChanges.entries()) {
            if (currentTime > expireTime) state.highlightedChanges.delete(path);
        }
        if (historyConfig?.enabled && changes.size > 0) {
            if (!state.changeHistory) state.changeHistory = [];
            state.changeHistory.push({ timestamp: currentTime, paths: Array.from(changes) });
            if (state.changeHistory.length > (historyConfig.maxEntries || 10)) state.changeHistory.shift();
        }
        state.lastContent = JSON.parse(JSON.stringify(currentObj));
        state.changedPaths = new Set(state.highlightedChanges.keys());
        return state.changedPaths;
    }

    private static compareObjects(path: string, oldObj: any, newObj: any, changes: Set<string>): void {
        if (typeof oldObj !== typeof newObj) { changes.add(path); return; }
        if (typeof newObj === 'object' && newObj !== null) {
            if (Array.isArray(newObj)) {
                if (oldObj.length !== newObj.length) changes.add(path);
                for (let i = 0; i < Math.max(oldObj.length || 0, newObj.length); i++) {
                    this.compareObjects(`${path}[${i}]`, oldObj[i], newObj[i], changes);
                }
            } else {
                const oldKeys = Object.keys(oldObj || {});
                const newKeys = Object.keys(newObj);
                if (oldKeys.length !== newKeys.length) changes.add(path);
                for (const key of new Set([...oldKeys, ...newKeys])) {
                    const newPath = path ? `${path}.${key}` : key;
                    this.compareObjects(newPath, oldObj?.[key], newObj[key], changes);
                }
            }
        } else if (oldObj !== newObj) changes.add(path);
    }

    static handleDoubleShift(player: Player, selectionConfig: SelectionConfig): boolean {
        if (!selectionConfig.enabled || selectionConfig.mode !== "doubleShift") return false;
        const currentTime = Date.now();
        const state = this.getScrollState(player);
        const delayMs = (selectionConfig.delay || 1) * 1000;
        const isShiftPressed = player.inputInfo.getButtonState(InputButton.Sneak) === "Pressed";
        if (state.lastShiftState === undefined) { state.lastShiftState = isShiftPressed; return false; }
        if (isShiftPressed && !state.lastShiftState) {
            if (!state.lastShiftTime) {
                state.lastShiftTime = currentTime;
                if (selectionConfig.showDelay) {
                    state.showingDelayIndicator = true;
                    if (state.shiftDelayTimer) system.clearRun(state.shiftDelayTimer);
                    state.shiftDelayTimer = system.runTimeout(() => {
                        if (state) { state.showingDelayIndicator = false; state.lastShiftTime = undefined; }
                    }, Math.floor(delayMs / 50));
                }
            } else {
                const timeDiff = currentTime - state.lastShiftTime;
                if (state.shiftDelayTimer) { system.clearRun(state.shiftDelayTimer); state.shiftDelayTimer = undefined; }
                state.showingDelayIndicator = false;
                state.lastShiftTime = undefined;
                if (timeDiff <= delayMs) { state.lastShiftState = isShiftPressed; return this.toggleSelectionMode(player); }
            }
        }
        state.lastShiftState = isShiftPressed;
        return false;
    }

    static toggleSelectionMode(player: Player): boolean {
        const state = this.getScrollState(player);
        state.selectionMode = !state.selectionMode;
        if (state.selectionMode) { state.selectedLine = state.scrollPosition; state.cursorPosition = 0; }
        return state.selectionMode;
    }

    private static processScroll(player: Player, scrollConfig: ScrollConfig, soundConfig?: { enabled?: boolean; sound?: string; pitch?: number; volume?: number }, selectionSoundConfig?: { enabled?: boolean; sound?: string; pitch?: number; volume?: number }): number {
        const { scrollAmount = 5, fastThreshold = 2, fastMultiplier = 4, momentum = true, invert = false, shiftLock = { enabled: true, lockSlot: true, invert: false } } = scrollConfig;
        const state = this.getScrollState(player);
        const currentSlot = player.selectedSlotIndex;
        const currentTime = Date.now();
        const isShiftPressed = player.isSneaking;
        const shouldLock = shiftLock.enabled && (shiftLock.invert ? !isShiftPressed : isShiftPressed);
        if (shouldLock) {
            if (!state.isLocked) { state.isLocked = true; if (shiftLock.lockSlot) state.lockedSlot = currentSlot; }
            if (shiftLock.lockSlot) player.selectedSlotIndex = state.lockedSlot;
            return 0;
        } else {
            if (state.isLocked) { state.isLocked = false; state.currentSlot = currentSlot; }
        }
        if (state.currentSlot !== currentSlot) {
            let delta = this.getSlotDelta(state.currentSlot, currentSlot);
            if (invert) delta = -delta;
            const timeDelta = currentTime - state.lastScrollTime;
            let scrollAmountCalc = Math.abs(delta) * scrollAmount;
            if (Math.abs(delta) >= fastThreshold) scrollAmountCalc = Math.abs(delta) * fastMultiplier;
            if (momentum && timeDelta < 100) {
                const velocityBonus = Math.floor(3 - (timeDelta / 50));
                scrollAmountCalc += Math.max(0, velocityBonus);
            }
            const direction = delta > 0 ? 1 : -1;
            const newScrollPosition = state.scrollPosition + (direction * scrollAmountCalc);
            const clampedPosition = this.clamp(newScrollPosition, 0, state.maxScroll);
            state.currentSlot = currentSlot;
            const oldPosition = state.scrollPosition;
            state.scrollPosition = clampedPosition;
            state.lastScrollTime = currentTime;
            state.scrollVelocity = scrollAmountCalc;
            const didScroll = oldPosition !== clampedPosition;
            if (state.selectionMode) {
                const oldSelectedLine = state.selectedLine;
                state.selectedLine = this.clamp(state.selectedLine + (direction * scrollAmountCalc), 0, state.totalLines - 1);
                const didMoveSelection = oldSelectedLine !== state.selectedLine;
                if (selectionSoundConfig?.enabled && didMoveSelection) {
                    try { player.playSound(selectionSoundConfig.sound || "random.click", { pitch: selectionSoundConfig.pitch || 3, volume: selectionSoundConfig.volume || 0.5 }); } catch (error) {}
                }
            } else {
                if (soundConfig?.enabled && didScroll) {
                    try { player.playSound(soundConfig.sound || "random.click", { pitch: soundConfig.pitch || 2, volume: soundConfig.volume || 0.5 }); } catch (error) {}
                }
            }
            return direction * scrollAmountCalc;
        }
        return 0;
    }

    private static handleAutoScroll(player: Player, autoScrollConfig: AutoScrollConfig): void {
        if (!autoScrollConfig.enabled) return;
        const state = this.getScrollState(player);
        const scrollAmount = autoScrollConfig.scrollAmount || 1;
        const speed = autoScrollConfig.speed || 20;
        const direction = autoScrollConfig.direction || 'down';
        
        if (!state.autoScrollTimer) {
            if (direction === 'backAndForth') {
                state.autoScrollDirection = 1;
                state.autoScrollTimer = system.runInterval(() => {
                    const newPos = state.scrollPosition + (state.autoScrollDirection! * scrollAmount);
                    if (newPos >= state.maxScroll) {
                        state.scrollPosition = state.maxScroll;
                        state.autoScrollDirection = -1;
                    } else if (newPos <= 0) {
                        state.scrollPosition = 0;
                        state.autoScrollDirection = 1;
                    } else {
                        state.scrollPosition = newPos;
                    }
                }, speed);
            } else {
                const dir = direction === 'up' ? -1 : 1;
                state.autoScrollTimer = system.runInterval(() => {
                    const newPos = state.scrollPosition + (dir * scrollAmount);
                    state.scrollPosition = this.clamp(newPos, 0, state.maxScroll);
                }, speed);
            }
        }
    }

    static setBookmark(player: Player, name: string, position?: number): number {
        const state = this.getScrollState(player);
        const pos = position !== undefined ? position : state.scrollPosition;
        state.bookmarks.set(name, pos);
        return pos;
    }

    static gotoBookmark(player: Player, name: string): boolean {
        const state = this.getScrollState(player);
        if (state.bookmarks.has(name)) {
            state.scrollPosition = this.clamp(state.bookmarks.get(name)!, 0, state.maxScroll);
            return true;
        }
        return false;
    }

    private static initializeBookmarks(player: Player, bookmarkConfig: BookmarkConfig): void {
        if (!bookmarkConfig.marks || bookmarkConfig.marks.length === 0) return;
        const state = this.getScrollState(player);
        bookmarkConfig.marks.forEach(mark => {
            const position = mark.position !== undefined ? mark.position : state.scrollPosition;
            state.bookmarks.set(mark.name, position);
        });
    }

    private static getPalette(paletteOption?: string | ColorPalette): ColorPalette {
        if (typeof paletteOption === 'string') return this.PALETTES[paletteOption] || this.DEFAULT_PALETTE;
        return paletteOption || this.DEFAULT_PALETTE;
    }

    private static getVisibleLength(str: string): number {
        if (this.lengthCache.has(str)) return this.lengthCache.get(str)!;
        const length = str.replace(this.COLOR_REGEX, "").length;
        this.lengthCache.set(str, length);
        return length;
    }

    private static centerText(text: string, width: number, fillChar = " "): string {
        const textLength = this.getVisibleLength(text);
        if (textLength >= width) return text;
        const totalPadding = width - textLength;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        return fillChar.repeat(leftPadding) + text + fillChar.repeat(rightPadding);
    }

    static getContentStats(obj: any, braceConfig?: BraceConfig): ContentStats {
        let json = JSON.stringify(obj, null, 4);
        let lines = json.split("\n");
        if (braceConfig?.hideFirstLast && lines.length > 2) {
            const firstLine = lines[0].trim();
            const lastLine = lines[lines.length - 1].trim();
            if ((firstLine === '{' || firstLine === '[') && (lastLine === '}' || lastLine === ']')) lines = lines.slice(1, -1);
        }
        return {
            totalLines: lines.length, totalCharacters: json.length,
            visibleCharacters: json.replace(this.COLOR_REGEX, "").length,
            avgLineLength: Math.round(json.replace(/\n/g, "").length / lines.length),
            maxLineLength: Math.max(...lines.map(line => this.getVisibleLength(line))),
            objectKeys: this.countKeys(obj), nestingDepth: this.getMaxDepth(obj)
        };
    }

    private static countKeys(obj: any, count = 0): number {
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) obj.forEach(item => count = this.countKeys(item, count));
            else {
                count += Object.keys(obj).length;
                Object.values(obj).forEach(value => count = this.countKeys(value, count));
            }
        }
        return count;
    }

    private static getMaxDepth(obj: any, currentDepth = 0): number {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        if (Array.isArray(obj)) return Math.max(...obj.map(item => this.getMaxDepth(item, currentDepth + 1)));
        return Math.max(...Object.values(obj).map(value => this.getMaxDepth(value, currentDepth + 1)));
    }

    private static createProgressBar(current: number, max: number, width = 20, style = "blocks"): string {
        if (max === 0) return "§8" + "─".repeat(width) + "§r";
        const progress = current / max;
        const filled = Math.floor(progress * width);
        const empty = width - filled;
        if (style === "minimap") return this.createMiniMap(current, max, max, width);
        const styles: Record<string, { filled: string; empty: string; color: string }> = {
            blocks: { filled: "█", empty: "─", color: "§a" }, dots: { filled: "●", empty: "○", color: "§b" },
            arrows: { filled: "►", empty: "─", color: "§e" }, slim: { filled: "│", empty: "┆", color: "§d" },
            thick: { filled: "┃", empty: "┊", color: "§6" }, modern: { filled: "▰", empty: "▱", color: "§3" },
            gradient: { filled: "█", empty: "░", color: "§a" }, retro: { filled: "#", empty: "-", color: "§2" },
            wave: { filled: "~", empty: ".", color: "§b" }, fire: { filled: "▲", empty: "▽", color: "§c" }
        };
        const s = styles[style] || styles.blocks;
        return s.color + s.filled.repeat(filled) + "§8" + s.empty.repeat(empty) + "§r";
    }

    private static createMiniMap(scrollPos: number, maxScroll: number, totalLines: number, width = 10): string {
        if (maxScroll === 0) return "";
        const mapHeight = width;
        const progress = scrollPos / maxScroll;
        const currentChar = Math.floor(progress * (mapHeight - 1));
        let miniMap = "§8[";
        for (let i = 0; i < mapHeight; i++) {
            if (i === currentChar) miniMap += "§a█§8";
            else if (i < currentChar) miniMap += "§7▓§8";
            else miniMap += "░";
        }
        miniMap += "]§r";
        return miniMap;
    }

    private static createDensityMap(text: string, width = 15): string {
        const lines = text.split("\n");
        const chunkSize = Math.ceil(lines.length / width);
        let densityMap = "§8[";
        for (let i = 0; i < width; i++) {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min(chunkStart + chunkSize, lines.length);
            const chunkLines = lines.slice(chunkStart, chunkEnd);
            let totalDepth = 0, validLines = 0;
            for (const line of chunkLines) {
                const cleanLine = line.replace(this.COLOR_REGEX, '');
                const match = cleanLine.match(/^(\s*)/);
                if (match && match[1].length > 0) {
                    const depth = Math.floor(match[1].length / 4);
                    totalDepth += depth;
                    validLines++;
                }
            }
            const avgDepth = validLines > 0 ? totalDepth / validLines : 0;
            if (avgDepth >= 4) densityMap += "§c█§8";
            else if (avgDepth >= 3) densityMap += "§6▓§8";
            else if (avgDepth >= 2) densityMap += "§e▓§8";
            else if (avgDepth >= 1) densityMap += "§a░§8";
            else densityMap += "§7·§8";
        }
        densityMap += "]§r";
        return densityMap;
    }

    static highlightJSON(obj: any, space = 4, palette: ColorPalette = this.DEFAULT_PALETTE, braceConfig: BraceConfig): string {
        let json = JSON.stringify(obj, null, space);
        if (braceConfig.hideFirstLast) {
            const lines = json.split('\n');
            if (lines.length > 2) {
                if (lines[0].trim() === '{' || lines[0].trim() === '[') lines.shift();
                const lastLine = lines[lines.length - 1];
                if (lastLine.trim() === '}' || lastLine.trim() === ']') lines.pop();
                const adjustedLines = lines.map(line => line.startsWith('    ') ? line.substring(4) : line);
                json = adjustedLines.join('\n');
            }
        }
        if (braceConfig.hide === "all") json = json.replace(/[{}[\]]/g, '');
        else if (braceConfig.hide === true) {
            json = json.replace(/\{\s*\}/g, '___EMPTY_OBJECT___').replace(/\[\s*\]/g, '___EMPTY_ARRAY___');
            json = json.replace(/[{}[\]]/g, '');
            json = json.replace(/___EMPTY_OBJECT___/g, '{}').replace(/___EMPTY_ARRAY___/g, '[]');
        }
        const result: string[] = [];
        let depth = 0, inString = false, current = "", i = 0;
        const flushString = (isValue: boolean) => {
            const color = isValue ? palette.string : palette.key;
            result.push(`${color}"${current}"${palette.default}`);
            current = "";
        };
        while (i < json.length) {
            const ch = json[i];
            if (ch === '"') {
                if (inString) { inString = false; flushString(json[i + 1] !== ":"); }
                else inString = true;
            } else if (inString) current += ch;
            else if (/\d/.test(ch)) {
                let num = "";
                while (i < json.length && this.NUMBER_REGEX.test(json[i])) num += json[i++];
                i--;
                result.push(`${palette.number}${num}${palette.default}`);
            } else if (ch === "{" || ch === "[") {
                const braceColor = palette.braces[depth % palette.braces.length];
                result.push(`${braceColor}${ch}${palette.default}`);
                depth++;
            } else if (ch === "}" || ch === "]") {
                depth--;
                const braceColor = palette.braces[depth % palette.braces.length];
                result.push(`${braceColor}${ch}${palette.default}`);
            } else if (ch === ":" || ch === ",") result.push(palette.default + ch);
            else {
                const remaining = json.slice(i);
                if (remaining.startsWith("true")) { result.push(`${palette.boolean}true${palette.default}`); i += 3; }
                else if (remaining.startsWith("false")) { result.push(`${palette.boolean}false${palette.default}`); i += 4; }
                else if (remaining.startsWith("null")) { result.push(`${palette.null}null${palette.default}`); i += 3; }
                else result.push(ch);
            }
            i++;
        }
        return result.join("");
    }

    static debugObject(player: Player, obj: any, optionsOrPreset: DebugOptions | PresetType = 'default'): DebugResult {
        let config: DebugOptions;
        if (typeof optionsOrPreset === 'string') config = this.mergeConfig(DEFAULT_CONFIG, this.PRESETS[optionsOrPreset] || {});
        else config = this.mergeConfig(DEFAULT_CONFIG, optionsOrPreset);
        try {
            this.initializeBookmarks(player, config.bookmarks!);
            const changedPaths = this.detectChanges(player, obj, config.highlight!, config.changeHistory);
            const stats = config.indicators!.show?.statistics ? this.getContentStats(obj, config.braces) : undefined;
            const palette = this.getPalette(config.highlight!.palette);
            let filteredObj = obj;
            if (config.filter?.enabled && config.filter.keys && config.filter.keys.length > 0) {
                filteredObj = this.filterObject(obj, config.filter.keys, config.filter.mode || 'include', config.filter.recursive || false);
            }
            const debugText = config.highlight!.enabled ? this.highlightJSON(filteredObj, config.indentSize, palette, config.braces!) : JSON.stringify(filteredObj, null, config.indentSize);
            const lines = debugText.split("\n");
            const totalLines = lines.length;
            const effectiveMaxLines = config.maxLines!;
            const maxScrollValue = Math.max(0, totalLines - effectiveMaxLines);
            let scrollPosition = 0;
            const finalComponents: string[] = [];
            if (config.title && config.title.trim()) finalComponents.push(config.title);
            if (config.scroll!.enabled && totalLines > effectiveMaxLines) {
                const state = this.getScrollState(player);
                state.totalLines = totalLines;
                state.maxScroll = maxScrollValue;
                if (config.startLine && config.startLine > 0 && state.scrollPosition === 0) state.scrollPosition = config.startLine;
                if (config.autoScroll?.enabled) this.handleAutoScroll(player, config.autoScroll);
                this.processScroll(player, config.scroll!, config.indicators!.sound, config.selection!.sound);
                scrollPosition = state.scrollPosition;
                const indicators = this.createIndicators(scrollPosition, maxScrollValue, state, config, stats, debugText);
                const visibleLines = lines.slice(scrollPosition, scrollPosition + effectiveMaxLines);
                const maxWidth = Math.max(...visibleLines.map(line => this.getVisibleLength(line)));
                const processedLines = this.applyVisualEffects(visibleLines, config, state, scrollPosition, maxWidth, palette);
                if (indicators.length > 0 && config.indicators!.enabled) {
                    const position = config.indicators!.position || "top";
                    if (position === "top") {
                        if (config.indicators!.centered) {
                            const finalMaxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
                            finalComponents.push(...indicators.map(ind => this.centerText(ind, finalMaxWidth)));
                        } else finalComponents.push(...indicators);
                        finalComponents.push(...processedLines);
                    } else if (position === "bottom") {
                        finalComponents.push(...processedLines);
                        if (config.indicators!.centered) {
                            const finalMaxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
                            finalComponents.push(...indicators.map(ind => this.centerText(ind, finalMaxWidth)));
                        } else finalComponents.push(...indicators);
                    } else if (typeof position === "number") {
                        const insertIndex = Math.min(position, processedLines.length);
                        finalComponents.push(...processedLines.slice(0, insertIndex));
                        if (config.indicators!.centered) {
                            const finalMaxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
                            finalComponents.push(...indicators.map(ind => this.centerText(ind, finalMaxWidth)));
                        } else finalComponents.push(...indicators);
                        finalComponents.push(...processedLines.slice(insertIndex));
                    }
                } else finalComponents.push(...processedLines);
                if (config.selection!.enabled) this.handleDoubleShift(player, config.selection!);
                let finalText = finalComponents.join("\n");
                if (finalText.startsWith('\n')) finalText = finalText.substring(1);
                player.onScreenDisplay.setActionBar(finalText.replace('\n', ''));
                return { totalLines, maxScroll: maxScrollValue, scroll: scrollPosition, canScroll: totalLines > effectiveMaxLines, isLocked: state.isLocked, selectionMode: state.selectionMode, selectedLine: state.selectedLine, stats, changedPaths: Array.from(changedPaths) };
            } else {
                const visibleLines = lines.slice(0, config.maxLines!);
                const state = this.getScrollState(player);
                const maxWidth = Math.max(...visibleLines.map(line => this.getVisibleLength(line)));
                const processedLines = this.applyVisualEffects(visibleLines, config, state, 0, maxWidth, palette);
                finalComponents.push(...processedLines);
                let finalText = finalComponents.join("\n");
                if (finalText.startsWith('\n')) finalText = finalText.substring(1);
                player.onScreenDisplay.setActionBar(finalText.replace('\n', ''));
                return { totalLines, maxScroll: 0, scroll: 0, canScroll: false, isLocked: false, selectionMode: state.selectionMode, selectedLine: state.selectedLine, stats, changedPaths: Array.from(changedPaths) };
            }
        } catch (error) {
            const errorText = config.title && config.title.trim() ? `${config.title}\n§cError: ${(error as Error).message}` : `§cError: ${(error as Error).message}`;
            player.onScreenDisplay.setActionBar(errorText.replace('\n', ''));
            return { totalLines: 0, maxScroll: 0, scroll: 0, error: error as Error, canScroll: false, isLocked: false, selectionMode: false, selectedLine: 0, changedPaths: [] };
        }
    }

    private static filterObject(obj: any, keys: string[], mode: 'include' | 'exclude', recursive: boolean): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(item => this.filterObject(item, keys, mode, recursive));
        const filtered: any = {};
        for (const key in obj) {
            const shouldInclude = mode === 'include' ? keys.includes(key) : !keys.includes(key);
            if (shouldInclude) {
                filtered[key] = (recursive && typeof obj[key] === 'object') ? this.filterObject(obj[key], keys, mode, recursive) : obj[key];
            }
        }
        return filtered;
    }

    private static mergeConfig(defaultConfig: DebugOptions, userConfig: DebugOptions): DebugOptions {
        const merged = { ...defaultConfig, ...userConfig };
        if (userConfig.highlight) {
            merged.highlight = { ...defaultConfig.highlight, ...userConfig.highlight };
            if (userConfig.highlight.onChange) {
                merged.highlight!.onChange = { ...defaultConfig.highlight!.onChange, ...userConfig.highlight.onChange };
                if (userConfig.highlight.onChange.format) merged.highlight!.onChange!.format = { ...defaultConfig.highlight!.onChange!.format, ...userConfig.highlight.onChange.format };
            }
        }
        if (userConfig.indicators) {
            merged.indicators = { ...defaultConfig.indicators, ...userConfig.indicators };
            if (userConfig.indicators.show) {
                merged.indicators!.show = { ...defaultConfig.indicators!.show, ...userConfig.indicators.show };
                if (userConfig.indicators.show.progress) merged.indicators!.show!.progress = { ...defaultConfig.indicators!.show!.progress, ...userConfig.indicators.show.progress };
            }
            if (userConfig.indicators.sound) merged.indicators!.sound = { ...defaultConfig.indicators!.sound, ...userConfig.indicators.sound };
        }
        if (userConfig.visual) merged.visual = { ...defaultConfig.visual, ...userConfig.visual };
        if (userConfig.braces) merged.braces = { ...defaultConfig.braces, ...userConfig.braces };
        if (userConfig.scroll) {
            merged.scroll = { ...defaultConfig.scroll, ...userConfig.scroll };
            if (userConfig.scroll.shiftLock) merged.scroll!.shiftLock = { ...defaultConfig.scroll!.shiftLock, ...userConfig.scroll.shiftLock };
        }
        if (userConfig.bookmarks) merged.bookmarks = { ...defaultConfig.bookmarks, ...userConfig.bookmarks };
        if (userConfig.selection) {
            merged.selection = { ...defaultConfig.selection, ...userConfig.selection };
            if (userConfig.selection.sound) merged.selection!.sound = { ...defaultConfig.selection!.sound, ...userConfig.selection.sound };
        }
        if (userConfig.filter) merged.filter = { ...defaultConfig.filter, ...userConfig.filter };
        if (userConfig.autoScroll) merged.autoScroll = { ...defaultConfig.autoScroll, ...userConfig.autoScroll };
        if (userConfig.changeHistory) merged.changeHistory = { ...defaultConfig.changeHistory, ...userConfig.changeHistory };
        return merged;
    }

    private static createIndicators(scrollPos: number, maxScroll: number, state: ScrollState, options: DebugOptions, stats?: ContentStats, debugText?: string): string[] {
        const indicators: string[] = [];
        const indicatorConfig = options.indicators!;
        if (!indicatorConfig.enabled) return indicators;
        const scrollPercent = maxScroll > 0 ? Math.round((scrollPos / maxScroll) * 100) : 0;
        if (indicatorConfig.show?.progress) {
            const progressConfig = indicatorConfig.show.progress;
            const style = progressConfig.style || "parentheses";
            let numberInfo = "";
            if (progressConfig.number !== false) {
                const numberStyle = typeof progressConfig.number === "string" ? progressConfig.number : style;
                if (numberStyle === "brackets") numberInfo = `§7[${scrollPos}/${maxScroll}]§r`;
                else if (numberStyle === "parentheses") numberInfo = `§7(${scrollPos}/${maxScroll})§r`;
                else if (numberStyle === "minimal") numberInfo = `§8${scrollPos}§7/§8${maxScroll}§r`;
            }
            if (progressConfig.percentage) {
                let percentageInfo = "";
                if (style === "brackets") percentageInfo = `§7[${scrollPercent}%]§r`;
                else if (style === "parentheses") percentageInfo = `§7(${scrollPercent}%)§r`;
                else percentageInfo = `§7${scrollPercent}%§r`;
                if (numberInfo) numberInfo += ` ${percentageInfo}`;
                else indicators.push(percentageInfo);
            }
            if (numberInfo) indicators.push(numberInfo);
            if (progressConfig.bar) {
                const barWidth = 18;
                const barStyle = typeof progressConfig.bar === "string" ? progressConfig.bar : "blocks";
                indicators.push(this.createProgressBar(scrollPos, maxScroll, barWidth, barStyle));
            }
        }
        const statusParts: string[] = [];
        if (state.isLocked) statusParts.push("§e[LOCK]§r");
        if (indicatorConfig.show?.scrollVelocity) statusParts.push(`§b×${state.scrollVelocity}§r`);
        if (state.selectionMode) statusParts.push(`§d[SEL:${state.selectedLine}]§r`);
        if (state.showingDelayIndicator) statusParts.push(`§e[SHIFT]§r`);
        if (statusParts.length > 0) indicators.push(statusParts.join(" "));
        if (indicatorConfig.show?.densityMap && maxScroll > 0 && debugText) indicators.push(this.createDensityMap(debugText, 12));
        if (indicatorConfig.show?.statistics && stats) indicators.push(`§8Lines: ${stats.totalLines} Keys: ${stats.objectKeys} Depth: ${stats.nestingDepth}§r`);
        return indicators;
    }

    private static applyVisualEffects(lines: string[], options: DebugOptions, state: ScrollState, scrollPosition: number, maxWidth: number, palette: ColorPalette): string[] {
        let processedLines = [...lines];
        const visualConfig = options.visual || {};
        const highlightConfig = options.highlight || {};
        const bookmarkConfig = options.bookmarks || {};
        if (visualConfig.typeIndicators) {
            processedLines = processedLines.map(line => {
                const trimmed = line.trim();
                if (trimmed.includes('"') && trimmed.includes(':')) return `§9○§r ${line}`;
                else if (trimmed.startsWith('[') || trimmed.endsWith(',')) return `§e□§r ${line}`;
                else if (trimmed.match(/^\d/)) return `§6#§r ${line}`;
                else if (trimmed.includes('"')) return `§a"§r ${line}`;
                return `§7·§r ${line}`;
            });
        }
        if (visualConfig.separators) {
            const newLines: string[] = [];
            for (let i = 0; i < processedLines.length; i++) {
                newLines.push(processedLines[i]);
                if (processedLines[i].includes('}') || processedLines[i].includes(']')) {
                    if (i < processedLines.length - 1 && !processedLines[i + 1].trim().startsWith(',')) newLines.push('§8' + '─'.repeat(20) + '§r');
                }
            }
            processedLines = newLines;
        }
        if (visualConfig.indentGuides) {
            const useBracketColor = visualConfig.indentGuides === 'bracketColor';
            processedLines = processedLines.map(line => {
                const match = line.match(/^(\s*)/);
                if (match && match[1].length >= 4) {
                    const indentLevel = Math.floor(match[1].length / 4);
                    const guides: string[] = [];
                    for (let i = 0; i < indentLevel; i++) {
                        const color = useBracketColor ? palette.braces[i % palette.braces.length] : (i % 2 === 0 ? '§8' : '§7');
                        guides.push(`${color}│§r   `);
                    }
                    return guides.join('') + line.substring(match[1].length);
                }
                return line;
            });
        }
        if (visualConfig.lineNumbers) {
            const maxLineNum = scrollPosition + processedLines.length;
            const padWidth = maxLineNum.toString().length;
            processedLines = processedLines.map((line, idx) => {
                const lineNum = (scrollPosition + idx + 1).toString().padStart(padWidth);
                const color = visualConfig.alternateLineNumbers && idx % 2 === 1 ? "§8" : "§7";
                return `${color}${lineNum}§r │ ${line}`;
            });
        }
        if (highlightConfig.onChange?.enabled && state.changedPaths.size > 0) {
            const format = highlightConfig.onChange.format || {};
            processedLines = processedLines.map(line => {
                let hasChange = false;
                for (const path of state.changedPaths) {
                    const key = path.split('.').pop();
                    if (key && line.includes(`"${key}"`)) { hasChange = true; break; }
                }
                if (hasChange) {
                    let formatting = typeof format.colored === "string" ? format.colored : (format.colored !== false ? palette.highlight : "§f");
                    if (format.bold) formatting += "§l";
                    if (format.italic) formatting += "§o";
                    if (format.fullLine) return `${formatting}${line.replace(/§./g, '')}§r`;
                    else {
                        for (const path of state.changedPaths) {
                            const key = path.split('.').pop();
                            if (key && line.includes(`"${key}"`)) return line.replace(new RegExp(`("${key}"[^,}\\]]*)`), `${formatting}$1§r`);
                        }
                    }
                }
                return line;
            });
        }
        if (state.selectionMode) {
            const relativeSelectedLine = state.selectedLine - scrollPosition;
            if (relativeSelectedLine >= 0 && relativeSelectedLine < processedLines.length) {
                const originalLine = processedLines[relativeSelectedLine];
                const selectionConfig = options.selection;
                if (selectionConfig?.highlight) {
                    const cleanLine = originalLine.replace(/§./g, '');
                    const highlightColor = typeof selectionConfig.highlight === "string" ? selectionConfig.highlight : palette.highlight;
                    processedLines[relativeSelectedLine] = `${highlightColor}${cleanLine}§r`;
                } else {
                    if (visualConfig.lineNumbers) processedLines[relativeSelectedLine] = originalLine.replace(' │ ', ' §e►§r ');
                    else processedLines[relativeSelectedLine] = `§e►§r ${originalLine}`;
                }
            }
        }
        if (visualConfig.border && processedLines.length > 0) {
            const borderStyle = typeof visualConfig.border === "string" ? visualConfig.border : "simple";
            const borders: Record<string, { char: string; color: string }> = {
                simple: { char: "─", color: "§8" }, double: { char: "═", color: "§8" }, thick: { char: "━", color: "§7" },
                rounded: { char: "─", color: "§8" }, ascii: { char: "-", color: "§7" }, dots: { char: "·", color: "§8" }
            };
            const border = borders[borderStyle] || borders.simple;
            const finalMaxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
            const borderLine = border.color + border.char.repeat(finalMaxWidth) + "§r";
            processedLines = [borderLine, ...processedLines, borderLine];
        }
        if (bookmarkConfig.enabled && state.bookmarks.size > 0) {
            const result = [...processedLines];
            state.bookmarks.forEach((position, name) => {
                const lineIndex = position - scrollPosition;
                if (lineIndex >= 0 && lineIndex < result.length) {
                    const bookmarkContent = `<${name}>`;
                    const totalPadding = Math.max(0, maxWidth - bookmarkContent.length);
                    const sidePadding = Math.floor(totalPadding / 2);
                    const rightPadding = totalPadding - sidePadding;
                    const bookmarkLine = `§e${"=".repeat(sidePadding)}§6${bookmarkContent}§e${"=".repeat(rightPadding)}§r`;
                    result.splice(lineIndex, 0, bookmarkLine);
                }
            });
            processedLines = result;
        }
        return processedLines;
    }

    static resetScroll(player: Player): void {
        const playerId = player.id;
        if (this.scrollStates.has(playerId)) {
            const state = this.scrollStates.get(playerId)!;
            state.scrollPosition = 0;
            state.isLocked = false;
            state.scrollVelocity = 0;
            state.startLine = 0;
            state.selectionMode = false;
            state.selectedLine = 0;
            if (state.autoScrollTimer) { system.clearRun(state.autoScrollTimer); state.autoScrollTimer = undefined; }
        }
    }

    static cleanupScrollStates(): void {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        for (const [playerId, state] of this.scrollStates.entries()) {
            if (!state.lastUsed || state.lastUsed < fiveMinutesAgo) {
                if (state.autoScrollTimer) system.clearRun(state.autoScrollTimer);
                this.scrollStates.delete(playerId);
            }
        }
    }

    static getSelectionInfo(player: Player): SelectionInfo {
        const state = this.getScrollState(player);
        return { selectionMode: state.selectionMode, selectedLine: state.selectedLine, cursorPosition: state.cursorPosition };
    }

    static enableSelectionMode(player: Player): boolean {
        const state = this.getScrollState(player);
        state.selectionMode = true;
        state.selectedLine = state.scrollPosition;
        return true;
    }

    static disableSelectionMode(player: Player): boolean {
        const state = this.getScrollState(player);
        state.selectionMode = false;
        return true;
    }

    static moveCursor(player: Player, direction: "up" | "down"): boolean {
        const state = this.getScrollState(player);
        if (!state.selectionMode) return false;
        if (direction === "up" && state.selectedLine > 0) state.selectedLine--;
        else if (direction === "down" && state.selectedLine < state.totalLines - 1) state.selectedLine++;
        return true;
    }

    static async openTextEditor(player: Player, lines: string[]): Promise<boolean> {
        const state = this.getScrollState(player);
        if (!state.selectionMode || state.selectedLine >= lines.length) return false;
        const selectedLineText = lines[state.selectedLine].replace(this.COLOR_REGEX, "").trim();
        const modalForm = new ModalFormData().title("§eText Editor - Debug").textField("Edit line:", "Enter new content", { defaultValue: selectedLineText });
        try {
            const response = await modalForm.show(player as any);
            if (response.canceled || !response.formValues) return false;
            const newText = response.formValues[0] as string;
            if (newText !== selectedLineText) {
                player.sendMessage(`§aLine edited: §f${newText}`);
                return true;
            }
        } catch (error) {
            player.sendMessage(`§cError opening editor: ${(error as Error).message}`);
        }
        return false;
    }

    static getChangeHistory(player: Player): Array<{ timestamp: number; paths: string[] }> {
        const state = this.getScrollState(player);
        return state.changeHistory || [];
    }

    static stopAutoScroll(player: Player): void {
        const state = this.getScrollState(player);
        if (state.autoScrollTimer) { system.clearRun(state.autoScrollTimer); state.autoScrollTimer = undefined; }
    }
}

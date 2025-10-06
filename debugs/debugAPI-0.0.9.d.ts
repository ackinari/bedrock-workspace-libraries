import { Player } from "@minecraft/server";

/**
 * Debug API - Sistema Avançado de Debug com Scroll
 * @author aKiNaRi, 2025
 * @version 0.0.9
 */
export declare class DebugAPI {
    static DEFAULT_PALETTE: Readonly<{
        braces: string[];
        key: string;
        string: string;
        number: string;
        boolean: string;
        null: string;
        default: string;
    }>;

    static PALETTES: Readonly<{
        default: any;
        dark: any;
        vibrant: any;
        retro: any;
        neon: any;
    }>;

    /**
     * Função principal de debug com scroll automático
     */
    static debugObject(player: Player, obj: any, options?: {
        maxLines?: number;
        indentSize?: number;
        title?: string;
        highlight?: boolean;
        scroll?: boolean | number;
        shiftLock?: boolean;
        shiftLockSlot?: boolean;
        scrollSpeed?: number;
        fastScrollThreshold?: number;
        fastScrollMultiplier?: number;
        enableMomentum?: boolean;
        startLine?: number;
        showLineNumbers?: boolean;
        showProgressBar?: boolean;
        progressStyle?: "blocks" | "dots" | "arrows" | "slim" | "thick" | "modern" | "gradient" | "retro" | "wave" | "fire";
        hideNumbers?: boolean;
        centerIndicators?: boolean;
        showBorder?: boolean;
        borderStyle?: "simple" | "double" | "thick" | "rounded" | "ascii" | "dots";
        compactMode?: boolean;
        indicatorStyle?: "brackets" | "parentheses" | "minimal";
        alternateLines?: boolean;
        showPercentage?: boolean;
        showLockStatus?: boolean;
        showStats?: boolean;
        showMiniMap?: boolean;
        showDensityMap?: boolean;
        showVelocity?: boolean;
        highlightErrors?: boolean;
        showIndentGuides?: boolean;
        showBookmarks?: boolean;
        showSeparators?: boolean;
        showTypeIndicators?: boolean;
        highlightChanges?: boolean;
        palette?: "default" | "dark" | "vibrant" | "retro" | "neon" | object;
    }): {
        totalLines: number;
        maxScroll: number;
        scroll: number;
        canScroll: boolean;
        isLocked: boolean;
        stats?: any;
        changedPaths?: string[];
        error?: Error;
    };

    /**
     * Sistema de bookmarks com indicadores visuais
     */
    static setBookmark(player: Player, name: string, position?: number | null): number;
    static gotoBookmark(player: Player, name: string): boolean;
    static listBookmarks(player: Player): [string, number][];

    /**
     * Controle de scroll
     */
    static resetScroll(player: Player): void;
    static setScrollPosition(player: Player, position: number): void;
    static scrollToBottom(player: Player): void;
    static scrollByPages(player: Player, pages: number): void;
    static setStartLine(player: Player, line: number): void;

    /**
     * Utilitários de texto
     */
    static getVisibleLength(str: string): number;
    static padEndVisible(str: string, targetLength: number, padChar?: string): string;
    static centerText(text: string, width: number, fillChar?: string): string;
    static getMaxLineWidth(text: string): number;

    /**
     * Busca e estatísticas
     */
    static searchInContent(text: string, searchTerm: string, caseSensitive?: boolean): Array<{
        line: number;
        text: string;
        preview: string;
    }>;
    
    static getContentStats(obj: any): {
        totalLines: number;
        totalCharacters: number;
        visibleCharacters: number;
        avgLineLength: number;
        maxLineLength: number;
        objectKeys: number;
        nestingDepth: number;
    };

    /**
     * Limpeza de estados
     */
    static cleanupScrollStates(): void;

    /**
     * Criação de elementos visuais
     */
    static createProgressBar(current: number, max: number, width?: number, style?: string): string;
    static createMiniMap(scrollPos: number, maxScroll: number, totalLines: number, currentMaxLines: number, width?: number): string;
    static createDensityMap(text: string, width?: number): string;

    /**
     * Destacar JSON com cores
     */
    static highlightJSON(obj: any, space?: number, palette?: any): string;

    /**
     * Divisão em colunas e corte de linhas
     */
    static splitColumns(text: string, maxLines?: number, separator?: string): string;
    static sliceLines(text: string, start?: number, end?: number): string;
}

/**
 * @author aKiNaRi, 2025
 * @discord akinari.
 * 
 * @name DebugAPI - aKiNaRi Object DebugAPI
 * @version 0.0.9
 * @license OPL-1.0
 * 
 * @description 
 * This Debug Tool allows the visualization of JS Objects clearly 
 * with the help of text highlighting and @Xubom assisted UI.
 * 
 * @notice Licensed under the Open Productivity License (OPL).
 * You are free to use, modify, and distribute this software
 * for any purpose, provided that proper credit is given
 * to the original author.
 */

import { Player } from "@minecraft/server";
/**
 * @todo
 * adicionar scroll por player com dynamic property ao inves de fazer uma variavel global com o valor. isso pode ser feito usando o:
 * player.setDynamicProperty('lb:scroll', value)
 * player.getDynamicProperty('lb:scroll')
 * 
 * Opção de mostrar ou não o primeiro e ultimo bracket, exemplo:
 * {
 *     player_isSneaking: player.isSneaking
 * }
 * mudaria para:
 * player_isSneaking: player.isSneaking (isso seria util apenas para quando quiser debugar objetos pequenos sem outros objetos dentro e etc)
 * 
 * o indicador de shift lock deve ficar na ultima linha ao inves da segunda
 * 
 * o bookmark deve adicionar uma linha nova ao inves de ser adicionado no inicio da linha, ele pode mostrar o nome, algo como:
 * §e= = = =<NOME>= = = =§r tendo um caractere do inicio ate o fim parecido com a forma que foi usado no showBorder (o emoji ★ nao aparece pois a fonte nao suporta emojis)
 * 
 * highlightChanges pode ter um tempo de cooldown (configuravel) que ao acabar ele para de destacar, o destaque pode ser tanto italico quanto bold ao mesmo tempo, e ele deve funcionar para qualquer valor que foi alterado, exemplo:
 * "cooldowns": [
 *     0,
 *     0,
 *     0
 * ]
 * mudaria para:
 * "cooldowns": [
 *     0,
 *     §l§i10§r,
 *     0
 * ] (fica por um tempo curto)
 */

//! Debug API - Sistema Avançado de Debug com Scroll
export class DebugAPI {
    static DEFAULT_PALETTE = Object.freeze({
        braces: ["§e", "§d", "§9"],
        key: "§b",
        string: "§a",
        number: "§6",
        boolean: "§g",
        null: "§8",
        default: "§f"
    });

    static PALETTES = Object.freeze({
        default: {
            braces: ["§e", "§d", "§9"],
            key: "§b",
            string: "§a",
            number: "§6",
            boolean: "§g",
            null: "§8",
            default: "§f"
        },
        dark: {
            braces: ["§7", "§8", "§7"],
            key: "§f",
            string: "§7",
            number: "§8",
            boolean: "§f",
            null: "§8",
            default: "§7"
        },
        vibrant: {
            braces: ["§c", "§a", "§b"],
            key: "§d",
            string: "§e",
            number: "§c",
            boolean: "§a",
            null: "§8",
            default: "§f"
        },
        retro: {
            braces: ["§2", "§a", "§2"],
            key: "§a",
            string: "§2",
            number: "§6",
            boolean: "§e",
            null: "§8",
            default: "§f"
        },
        neon: {
            braces: ["§5", "§d", "§5"],
            key: "§b",
            string: "§d",
            number: "§5",
            boolean: "§b",
            null: "§8",
            default: "§f"
        }
    });

    static COLOR_REGEX = /§./g;
    static NUMBER_REGEX = /^[0-9.eE+-]+$/;

    // Caches para performance
    static lengthCache = new Map();
    static widthCache = new Map();
    static changeCache = new Map();
    
    // Estados de scroll por player
    static scrollStates = new Map();

    /**
     * Obtém o estado de scroll para um player
     */
    static getScrollState(player) {
        const playerId = player.id;
        if (!this.scrollStates.has(playerId)) {
            this.scrollStates.set(playerId, {
                currentSlot: player.selectedSlotIndex,
                scrollPosition: 0,
                totalLines: 0,
                maxScroll: 0,
                lastUsed: Date.now(),
                isLocked: false,
                lockedSlot: 4,
                lastScrollTime: 0,
                scrollVelocity: 0,
                bookmarks: new Map(),
                startLine: 0,
                lastContent: null,
                changedPaths: new Set()
            });
        }
        const state = this.scrollStates.get(playerId);
        state.lastUsed = Date.now();
        return state;
    }

    /**
     * Calcula mudança de slot considerando o loop 0-8
     */
    static getSlotDelta(oldSlot, newSlot) {
        let delta = newSlot - oldSlot;
        
        // Detecta loops da hotbar
        if (oldSlot === 8 && newSlot === 0) {
            delta = 1;
        } else if (oldSlot === 0 && newSlot === 8) {
            delta = -1;
        } else if (Math.abs(delta) > 4) {
            delta = delta > 0 ? delta - 9 : delta + 9;
        }
        
        return delta;
    }

    /**
     * Detecta mudanças no objeto comparando com versão anterior
     */
    static detectChanges(player, currentObj, highlightChanges = false) {
        if (!highlightChanges) return new Set();
        
        const state = this.getScrollState(player);
        const changes = new Set();
        
        if (state.lastContent) {
            this.compareObjects("", state.lastContent, currentObj, changes);
        }
        
        state.lastContent = JSON.parse(JSON.stringify(currentObj));
        state.changedPaths = changes;
        
        return changes;
    }

    /**
     * Compara objetos recursivamente para detectar mudanças
     */
    static compareObjects(path, oldObj, newObj, changes) {
        if (typeof oldObj !== typeof newObj) {
            changes.add(path);
            return;
        }
        
        if (typeof newObj === 'object' && newObj !== null) {
            if (Array.isArray(newObj)) {
                if (oldObj.length !== newObj.length) {
                    changes.add(path);
                }
                for (let i = 0; i < Math.max(oldObj.length || 0, newObj.length); i++) {
                    this.compareObjects(`${path}[${i}]`, oldObj[i], newObj[i], changes);
                }
            } else {
                const oldKeys = Object.keys(oldObj || {});
                const newKeys = Object.keys(newObj);
                
                if (oldKeys.length !== newKeys.length) {
                    changes.add(path);
                }
                
                for (const key of new Set([...oldKeys, ...newKeys])) {
                    const newPath = path ? `${path}.${key}` : key;
                    this.compareObjects(newPath, oldObj?.[key], newObj[key], changes);
                }
            }
        } else if (oldObj !== newObj) {
            changes.add(path);
        }
    }

    /**
     * Processa o scroll com velocidade adaptativa e controle de travamento
     */
    static processScroll(player, options = {}) {
        const { 
            shiftLock = true, 
            shiftLockSlot = false,
            scrollSpeed = 1, 
            fastScrollThreshold = 2,
            fastScrollMultiplier = 4,
            enableMomentum = false
        } = options;
        
        const state = this.getScrollState(player);
        const currentSlot = player.selectedSlotIndex;
        const currentTime = Date.now();
        const isSneaking = shiftLock && player.inputInfo.getButtonState("Sneak") === "Pressed";
        
        // Sistema de travamento
        if (isSneaking) {
            if (!state.isLocked) {
                state.isLocked = true;
                if (shiftLockSlot) {
                    state.lockedSlot = currentSlot;
                }
            }
            if (shiftLockSlot) {
                player.selectedSlotIndex = state.lockedSlot;
            }
            return 0; // Não processa scroll quando travado
        } else {
            if (state.isLocked) {
                state.isLocked = false;
                state.currentSlot = currentSlot;
            }
        }
        
        // Processa mudança de slot
        if (state.currentSlot !== currentSlot) {
            const delta = this.getSlotDelta(state.currentSlot, currentSlot);
            const timeDelta = currentTime - state.lastScrollTime;
            
            // Calcula velocidade baseada no tempo e distância
            let scrollAmount = Math.abs(delta) * scrollSpeed;
            
            // Scroll rápido baseado em distância
            if (Math.abs(delta) >= fastScrollThreshold) {
                scrollAmount = Math.abs(delta) * fastScrollMultiplier;
            }
            
            // Momentum scroll (baseado em velocidade temporal)
            if (enableMomentum && timeDelta < 100) {
                const velocityBonus = Math.floor(3 - (timeDelta / 50));
                scrollAmount += Math.max(0, velocityBonus);
            }
            
            const direction = delta > 0 ? 1 : -1;
            const newScrollPosition = state.scrollPosition + (direction * scrollAmount);
            
            state.currentSlot = currentSlot;
            state.scrollPosition = clamp(newScrollPosition, 0, state.maxScroll);
            state.lastScrollTime = currentTime;
            state.scrollVelocity = scrollAmount;
            
            return direction * scrollAmount;
        }
        
        return 0;
    }

    /**
     * Sistema de bookmarks com indicadores visuais
     */
    static setBookmark(player, name, position = null) {
        const state = this.getScrollState(player);
        const pos = position !== null ? position : state.scrollPosition;
        state.bookmarks.set(name, pos);
        return pos;
    }

    static gotoBookmark(player, name) {
        const state = this.getScrollState(player);
        if (state.bookmarks.has(name)) {
            state.scrollPosition = clamp(state.bookmarks.get(name), 0, state.maxScroll);
            return true;
        }
        return false;
    }

    static setStartLine(player, line) {
        const state = this.getScrollState(player);
        state.startLine = Math.max(0, line);
        state.scrollPosition = state.startLine;
    }

    static listBookmarks(player) {
        const state = this.getScrollState(player);
        return Array.from(state.bookmarks.entries());
    }

    /**
     * Adiciona indicadores de bookmark nas linhas
     */
    static addBookmarkIndicators(lines, scrollPosition, bookmarks) {
        const result = [...lines];
        
        bookmarks.forEach((position, name) => {
            const lineIndex = position - scrollPosition;
            if (lineIndex >= 0 && lineIndex < result.length) {
                const bookmarkIcon = `§c★§r`;
                result[lineIndex] = `${bookmarkIcon} ${result[lineIndex]}`;
            }
        });
        
        return result;
    }

    /**
     * Busca texto no conteúdo
     */
    static searchInContent(text, searchTerm, caseSensitive = false) {
        const lines = text.split("\n");
        const results = [];
        
        lines.forEach((line, index) => {
            const searchText = caseSensitive ? line : line.toLowerCase();
            const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
            
            if (searchText.includes(term)) {
                results.push({
                    line: index,
                    text: line.trim(),
                    preview: line.substring(0, 50) + (line.length > 50 ? "..." : "")
                });
            }
        });
        
        return results;
    }

    /**
     * Calcula estatísticas do conteúdo
     */
    static getContentStats(obj) {
        const json = JSON.stringify(obj, null, 4);
        const lines = json.split("\n");
        
        return {
            totalLines: lines.length,
            totalCharacters: json.length,
            visibleCharacters: json.replace(this.COLOR_REGEX, "").length,
            avgLineLength: Math.round(json.replace(/\n/g, "").length / lines.length),
            maxLineLength: Math.max(...lines.map(line => this.getVisibleLength(line))),
            objectKeys: this.countKeys(obj),
            nestingDepth: this.getMaxDepth(obj)
        };
    }

    static countKeys(obj, count = 0) {
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                obj.forEach(item => count = this.countKeys(item, count));
            } else {
                count += Object.keys(obj).length;
                Object.values(obj).forEach(value => count = this.countKeys(value, count));
            }
        }
        return count;
    }

    static getMaxDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        
        if (Array.isArray(obj)) {
            return Math.max(...obj.map(item => this.getMaxDepth(item, currentDepth + 1)));
        } else {
            return Math.max(...Object.values(obj).map(value => this.getMaxDepth(value, currentDepth + 1)));
        }
    }

    /**
     * Calcula o comprimento visível de uma string (sem códigos de cor)
     */
    static getVisibleLength(str) {
        if (this.lengthCache.has(str)) {
            return this.lengthCache.get(str);
        }
        const length = str.replace(this.COLOR_REGEX, "").length;
        this.lengthCache.set(str, length);
        return length;
    }

    /**
     * Preenche string até um comprimento específico
     */
    static padEndVisible(str, targetLength, padChar = " ") {
        const padding = Math.max(0, targetLength - this.getVisibleLength(str));
        return str + padChar.repeat(padding);
    }

    /**
     * Centraliza texto em uma largura específica
     */
    static centerText(text, width, fillChar = " ") {
        const textLength = this.getVisibleLength(text);
        if (textLength >= width) return text;
        
        const totalPadding = width - textLength;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        
        return fillChar.repeat(leftPadding) + text + fillChar.repeat(rightPadding);
    }

    /**
     * Obtém a largura máxima das linhas de um texto
     */
    static getMaxLineWidth(text) {
        if (this.widthCache.has(text)) {
            return this.widthCache.get(text);
        }
        
        const lines = text.split("\n");
        const maxWidth = Math.max(...lines.map(line => this.getVisibleLength(line)));
        this.widthCache.set(text, maxWidth);
        return maxWidth;
    }

    /**
     * Cria barra de progresso com diferentes estilos
     */
    static createProgressBar(current, max, width = 20, style = "blocks") {
        if (max === 0) return "§8" + "─".repeat(width) + "§r";
        
        const progress = current / max;
        const filled = Math.floor(progress * width);
        const empty = width - filled;
        
        const styles = {
            blocks: { filled: "█", empty: "─", color: "§a" },
            dots: { filled: "●", empty: "○", color: "§b" },
            arrows: { filled: "►", empty: "─", color: "§e" },
            slim: { filled: "│", empty: "┆", color: "§d" },
            thick: { filled: "┃", empty: "┊", color: "§6" },
            modern: { filled: "▰", empty: "▱", color: "§3" },
            gradient: { filled: "█", empty: "░", color: "§a" },
            retro: { filled: "#", empty: "-", color: "§2" },
            wave: { filled: "~", empty: ".", color: "§b" },
            fire: { filled: "▲", empty: "▽", color: "§c" }
        };
        
        const s = styles[style] || styles.blocks;
        return s.color + s.filled.repeat(filled) + "§8" + s.empty.repeat(empty) + "§r";
    }

    /**
     * Cria mini-mapa de navegação
     */
    static createMiniMap(scrollPos, maxScroll, totalLines, currentMaxLines, width = 10) {
        if (maxScroll === 0) return "";
        
        const mapHeight = width;
        const linesPerChar = Math.ceil(totalLines / mapHeight);
        const currentChar = Math.floor(scrollPos / linesPerChar);
        
        let miniMap = "§8[";
        for (let i = 0; i < mapHeight; i++) {
            if (i === currentChar) {
                miniMap += "§a█§8";
            } else if (i < currentChar) {
                miniMap += "§7▓§8";
            } else {
                miniMap += "░";
            }
        }
        miniMap += "]§r";
        
        return miniMap;
    }

    /**
     * Cria indicador de densidade (quantos dados por área)
     */
    static createDensityMap(text, width = 15) {
        const lines = text.split("\n");
        const chunkSize = Math.ceil(lines.length / width);
        
        let densityMap = "§8[";
        for (let i = 0; i < width; i++) {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min(chunkStart + chunkSize, lines.length);
            const chunkLines = lines.slice(chunkStart, chunkEnd);
            
            const avgLength = chunkLines.reduce((sum, line) => sum + this.getVisibleLength(line), 0) / chunkLines.length || 0;
            
            if (avgLength > 50) {
                densityMap += "§c█§8";
            } else if (avgLength > 30) {
                densityMap += "§e▓§8";
            } else if (avgLength > 15) {
                densityMap += "§a░§8";
            } else {
                densityMap += "·";
            }
        }
        densityMap += "]§r";
        
        return densityMap;
    }

    /**
     * Cria indicadores visuais avançados
     */
    static createIndicators(scrollPos, maxScroll, state, options, stats = null) {
        const { 
            hideNumbers = false, 
            compactMode = false, 
            showPercentage = true,
            showLockStatus = true,
            showStats = false,
            showMiniMap = false,
            showDensityMap = false,
            showVelocity = false,
            indicatorStyle = "brackets"
        } = options;
        
        const indicators = [];
        const scrollPercent = maxScroll > 0 ? Math.round((scrollPos / maxScroll) * 100) : 0;
        
        // Informações numéricas
        if (!hideNumbers) {
            let numberInfo = "";
            if (indicatorStyle === "brackets") {
                numberInfo = compactMode ? 
                    `§7${scrollPos}/${maxScroll}§r` :
                    `§7[${scrollPos}/${maxScroll}]§r`;
            } else if (indicatorStyle === "parentheses") {
                numberInfo = `§7(${scrollPos}/${maxScroll})§r`;
            } else if (indicatorStyle === "minimal") {
                numberInfo = `§8${scrollPos}§7/§8${maxScroll}§r`;
            }
            
            if (showPercentage && !compactMode) {
                numberInfo += ` §7${scrollPercent}%§r`;
            }
            
            indicators.push(numberInfo);
        }
        
        // Status de travamento e velocidade
        const statusParts = [];
        if (showLockStatus && state.isLocked) {
            statusParts.push(compactMode ? "§eL§r" : "§e[LOCK]§r");
        }
        if (showVelocity && state.scrollVelocity > 1) {
            statusParts.push(`§b×${state.scrollVelocity}§r`);
        }
        if (statusParts.length > 0) {
            indicators.push(statusParts.join(" "));
        }
        
        // Mini-mapa
        if (showMiniMap && maxScroll > 0) {
            const miniMap = this.createMiniMap(scrollPos, maxScroll, state.totalLines, options.maxLines || 26);
            indicators.push(miniMap);
        }
        
        // Mapa de densidade
        if (showDensityMap && maxScroll > 0) {
            const densityMap = this.createDensityMap(options.debugText || "", 12);
            indicators.push(densityMap);
        }
        
        // Estatísticas
        if (showStats && stats) {
            const statText = compactMode ? 
                `§8${stats.totalLines}L §7${stats.objectKeys}K §8D${stats.nestingDepth}§r` :
                `§8Lines: ${stats.totalLines} Keys: ${stats.objectKeys} Depth: ${stats.nestingDepth}§r`;
            indicators.push(statText);
        }
        
        return indicators;
    }

    /**
     * Aplica efeitos visuais ao texto
     */
    static applyVisualEffects(lines, options) {
        const { 
            showLineNumbers = false, 
            scrollPosition = 0, 
            showBorder = false, 
            borderStyle = "simple",
            alternateLines = false,
            highlightErrors = false,
            showIndentGuides = false,
            showBookmarks = false,
            showSeparators = false,
            showTypeIndicators = false,
            highlightChanges = false,
            bookmarks = new Map(),
            changedPaths = new Set(),
            maxWidth 
        } = options;
        
        let processedLines = [...lines];
        
        // Indicadores de tipo de dados
        if (showTypeIndicators) {
            processedLines = processedLines.map(line => {
                const trimmed = line.trim();
                if (trimmed.includes('"') && trimmed.includes(':')) {
                    return `§9○§r ${line}`; // Objeto
                } else if (trimmed.startsWith('[') || trimmed.endsWith(',')) {
                    return `§e□§r ${line}`; // Array
                } else if (trimmed.match(/^\d/)) {
                    return `§6#§r ${line}`; // Número
                } else if (trimmed.includes('"')) {
                    return `§a"§r ${line}`; // String
                }
                return `§7·§r ${line}`;
            });
        }
        
        // Separadores entre seções
        if (showSeparators) {
            const newLines = [];
            for (let i = 0; i < processedLines.length; i++) {
                newLines.push(processedLines[i]);
                
                // Adiciona separador após objetos fechados
                if (processedLines[i].includes('}') || processedLines[i].includes(']')) {
                    if (i < processedLines.length - 1 && !processedLines[i + 1].trim().startsWith(',')) {
                        newLines.push('§8' + '─'.repeat(20) + '§r');
                    }
                }
            }
            processedLines = newLines;
        }
        
        // Guias de indentação melhoradas
        if (showIndentGuides) {
            processedLines = processedLines.map(line => {
                const match = line.match(/^(\s*)/);
                if (match && match[1].length >= 4) {
                    const indentLevel = Math.floor(match[1].length / 4);
                    const colors = ['§8', '§7', '§8', '§7'];
                    const guides = [];
                    
                    for (let i = 0; i < indentLevel; i++) {
                        const color = colors[i % colors.length];
                        guides.push(`${color}│§r   `);
                    }
                    
                    return guides.join('') + line.substring(match[1].length);
                }
                return line;
            });
        }
        
        // Destacar mudanças usando formatação
        if (highlightChanges && changedPaths.size > 0) {
            processedLines = processedLines.map(line => {
                // Verifica se a linha contém alguma das chaves modificadas
                for (const path of changedPaths) {
                    const key = path.split('.').pop();
                    if (line.includes(`"${key}"`)) {
                        return line.replace(new RegExp(`("${key}"[^,}\\]]*)`), '§l$1§r');
                    }
                }
                return line;
            });
        }
        
        // Destacar erros (linhas com "error", "null", "undefined")
        if (highlightErrors) {
            processedLines = processedLines.map(line => {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes("error")) {
                    return `§c${line}§r`;
                } else if (lowerLine.includes("null")) {
                    return `§8${line}§r`;
                } else if (lowerLine.includes("undefined")) {
                    return `§7${line}§r`;
                }
                return line;
            });
        }
        
        // Bookmarks
        if (showBookmarks && bookmarks.size > 0) {
            processedLines = this.addBookmarkIndicators(processedLines, scrollPosition, bookmarks);
        }
        
        // Números de linha
        if (showLineNumbers) {
            const maxLineNum = scrollPosition + processedLines.length;
            const padWidth = maxLineNum.toString().length;
            
            processedLines = processedLines.map((line, idx) => {
                const lineNum = (scrollPosition + idx + 1).toString().padStart(padWidth);
                const color = alternateLines && idx % 2 === 1 ? "§8" : "§7";
                return `${color}${lineNum}§r │ ${line}`;
            });
        }
        
        // Linhas alternadas
        if (alternateLines && !showLineNumbers) {
            processedLines = processedLines.map((line, idx) => {
                return idx % 2 === 1 ? `§8${line}§r` : line;
            });
        }
        
        // Recalcula largura após modificações
        const finalMaxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
        
        // Bordas
        if (showBorder && processedLines.length > 0) {
            const borders = {
                simple: { char: "─", color: "§8" },
                double: { char: "═", color: "§8" },
                thick: { char: "━", color: "§7" },
                rounded: { char: "─", color: "§8" },
                ascii: { char: "-", color: "§7" },
                dots: { char: "·", color: "§8" }
            };
            
            const border = borders[borderStyle] || borders.simple;
            const borderLine = border.color + border.char.repeat(finalMaxWidth) + "§r";
            
            processedLines = [borderLine, ...processedLines, borderLine];
        }
        
        return processedLines;
    }

    /**
     * Destaca JSON com cores usando paleta customizada
     */
    static highlightJSON(obj, space = 4, palette = null) {
        const colors = palette || this.DEFAULT_PALETTE;
        const json = JSON.stringify(obj, null, space);
        const result = [];
        let depth = 0, inString = false, current = "", i = 0;
        
        const flushString = (isValue) => {
            const color = isValue ? colors.string : colors.key;
            result.push(`${color}"${current}"${colors.default}`);
            current = "";
        };
        
        while (i < json.length) {
            const ch = json[i];
            
            if (ch === '"') {
                if (inString) {
                    inString = false;
                    flushString(json[i + 1] !== ":");
                } else {
                    inString = true;
                }
            } else if (inString) {
                current += ch;
            } else if (/\d/.test(ch)) {
                let num = "";
                while (i < json.length && this.NUMBER_REGEX.test(json[i])) {
                    num += json[i++];
                }
                i--;
                result.push(`${colors.number}${num}${colors.default}`);
            } else if (ch === "{" || ch === "[") {
                const braceColor = colors.braces[depth % colors.braces.length];
                result.push(`${braceColor}${ch}${colors.default}`);
                depth++;
            } else if (ch === "}" || ch === "]") {
                depth--;
                const braceColor = colors.braces[depth % colors.braces.length];
                result.push(`${braceColor}${ch}${colors.default}`);
            } else if (ch === ":" || ch === ",") {
                result.push(colors.default + ch);
            } else {
                const remaining = json.slice(i);
                if (remaining.startsWith("true")) {
                    result.push(`${colors.boolean}true${colors.default}`);
                    i += 3;
                } else if (remaining.startsWith("false")) {
                    result.push(`${colors.boolean}false${colors.default}`);
                    i += 4;
                } else if (remaining.startsWith("null")) {
                    result.push(`${colors.null}null${colors.default}`);
                    i += 3;
                } else {
                    result.push(ch);
                }
            }
            i++;
        }
        
        return result.join("");
    }

    /**
     * Divide texto em colunas
     */
    static splitColumns(text, maxLines = 48, separator = " | ") {
        const lines = text.split("\n");
        
        if (lines.length <= maxLines) return text;
        
        const numBlocks = Math.ceil(lines.length / maxLines);
        const blocks = Array.from({ length: numBlocks }, (_, i) =>
            lines.slice(i * maxLines, Math.min((i + 1) * maxLines, lines.length))
        );
        
        const maxLengths = blocks.map(block =>
            block.reduce((max, line) => Math.max(max, this.getVisibleLength(line)), 0)
        );
        
        const resultLines = [];
        for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
            const rowParts = blocks.map((block, blockIdx) => {
                const line = block[lineIdx] || "";
                return this.padEndVisible(line, maxLengths[blockIdx]);
            });
            
            while (rowParts.length > 0 && !rowParts[rowParts.length - 1].trim()) {
                rowParts.pop();
            }
            
            if (rowParts.length > 0) {
                resultLines.push(rowParts.join(separator));
            }
        }
        
        return resultLines.join("\n");
    }

    /**
     * Corta linhas de texto
     */
    static sliceLines(text, start = 0, end) {
        const lines = text.split("\n");
        const clampedStart = Math.max(0, start);
        const clampedEnd = end !== undefined ? Math.min(lines.length, end + 1) : lines.length;
        return lines.slice(clampedStart, clampedEnd).join("\n");
    }

    /**
     * Função principal de debug com scroll automático
     * @param {Player} player 
     * @param {Object} obj 
     * @param {{
     *     maxLines?: number,
     *     indentSize?: number,
     *     title?: string,
     *     highlight?: boolean,
     *     scroll?: boolean | number,
     *     shiftLock?: boolean,
     *     shiftLockSlot?: boolean,
     *     scrollSpeed?: number,
     *     fastScrollThreshold?: number,
     *     fastScrollMultiplier?: number,
     *     enableMomentum?: boolean,
     *     startLine?: number,
     *     showLineNumbers?: boolean,
     *     showProgressBar?: boolean,
     *     progressStyle?: "blocks" | "dots" | "arrows" | "slim" | "thick" | "modern" | "gradient" | "retro" | "wave" | "fire",
     *     hideNumbers?: boolean,
     *     centerIndicators?: boolean,
     *     showBorder?: boolean,
     *     borderStyle?: "simple" | "double" | "thick" | "rounded" | "ascii" | "dots",
     *     compactMode?: boolean,
     *     indicatorStyle?: "brackets" | "parentheses" | "minimal",
     *     alternateLines?: boolean,
     *     showPercentage?: boolean,
     *     showLockStatus?: boolean,
     *     showStats?: boolean,
     *     showMiniMap?: boolean,
     *     showDensityMap?: boolean,
     *     showVelocity?: boolean,
     *     highlightErrors?: boolean,
     *     showIndentGuides?: boolean,
     *     showBookmarks?: boolean,
     *     showSeparators?: boolean,
     *     showTypeIndicators?: boolean,
     *     highlightChanges?: boolean,
     *     palette?: "default" | "dark" | "vibrant" | "retro" | "neon" | Object
     * }} options 
     */
    static debugObject(player, obj, options = {}) {
        const defaults = {
            maxLines: 26,
            indentSize: 4,
            title: "DEBUG.A",
            highlight: true,
            scroll: true,
            shiftLock: true,
            shiftLockSlot: false,
            scrollSpeed: 1,
            fastScrollThreshold: 2,
            fastScrollMultiplier: 3,
            enableMomentum: false,
            startLine: 0,
            showLineNumbers: true,
            showProgressBar: false,
            progressStyle: "blocks",
            hideNumbers: false,
            centerIndicators: true,
            showBorder: false,
            borderStyle: "simple",
            compactMode: false,
            indicatorStyle: "brackets",
            alternateLines: false,
            showPercentage: true,
            showLockStatus: true,
            showStats: false,
            showMiniMap: false,
            showDensityMap: false,
            showVelocity: false,
            highlightErrors: true,
            showIndentGuides: true,
            showBookmarks: true,
            showSeparators: false, //!
            showTypeIndicators: false, //!
            highlightChanges: false, //!
            palette: "default"
        };

        const config = { ...defaults, ...options };

        try {
            // Detecta mudanças se habilitado
            const changedPaths = this.detectChanges(player, obj, config.highlightChanges);
            
            // Gera estatísticas se necessário
            const stats = config.showStats ? this.getContentStats(obj) : null;
            
            // Obtém paleta de cores
            const palette = typeof config.palette === 'string' ? 
                this.PALETTES[config.palette] || this.DEFAULT_PALETTE : 
                config.palette || this.DEFAULT_PALETTE;
            
            // Gera o texto de debug
            const debugText = config.highlight ? 
                this.highlightJSON(obj, config.indentSize, palette) : 
                JSON.stringify(obj, null, config.indentSize);
                
            const debugTextColumn = this.splitColumns(debugText, config.scroll ? Infinity : config.maxLines);
            
            const lines = debugTextColumn.split("\n");
            const totalLines = lines.length;
            const effectiveMaxLines = config.compactMode ? config.maxLines + 3 : config.maxLines;
            const maxScrollValue = Math.max(0, totalLines - effectiveMaxLines);
            
            let scrollPosition = 0;
            const finalComponents = [];
            
            // Adiciona título apenas se não estiver vazio
            if (config.title && config.title.trim()) {
                finalComponents.push(config.title);
            }
            
            if (config.scroll && totalLines > effectiveMaxLines) {
                const state = this.getScrollState(player);
                state.totalLines = totalLines;
                state.maxScroll = maxScrollValue;
                
                // Define linha inicial se especificada
                if (config.startLine > 0 && state.scrollPosition === 0) {
                    this.setStartLine(player, config.startLine);
                }
                
                this.processScroll(player, config);
                scrollPosition = state.scrollPosition;
                
                // Cria indicadores
                const indicators = this.createIndicators(scrollPosition, maxScrollValue, state, {
                    ...config,
                    debugText: debugTextColumn
                }, stats);
                
                // Adiciona barra de progresso se habilitada
                if (config.showProgressBar) {
                    const barWidth = config.compactMode ? 12 : 18;
                    const progressBar = this.createProgressBar(scrollPosition, maxScrollValue, barWidth, config.progressStyle);
                    indicators.push(progressBar);
                }
                
                // Extrai linhas visíveis
                const visibleLines = this.sliceLines(debugTextColumn, scrollPosition, scrollPosition + effectiveMaxLines - 1).split("\n");
                
                // Aplica efeitos visuais
                const processedLines = this.applyVisualEffects(visibleLines, {
                    ...config,
                    scrollPosition,
                    bookmarks: state.bookmarks,
                    changedPaths
                });
                
                // Adiciona indicadores
                if (indicators.length > 0) {
                    if (config.centerIndicators) {
                        const maxWidth = Math.max(...processedLines.map(line => this.getVisibleLength(line)));
                        const centeredIndicators = indicators.map(indicator => this.centerText(indicator, maxWidth));
                        finalComponents.push(...centeredIndicators);
                    } else {
                        finalComponents.push(...indicators);
                    }
                }
                
                // Adiciona conteúdo processado
                finalComponents.push(...processedLines);
                
                // Corrige linha em branco no início
                let finalText = finalComponents.join("\n");
                if (finalText.startsWith('\n')) {
                    finalText = finalText.substring(1);
                }
                
                player.onScreenDisplay.setActionBar(finalText.replace('\n', ''));
                
                return { 
                    totalLines, 
                    maxScroll: maxScrollValue, 
                    scroll: scrollPosition,
                    canScroll: totalLines > effectiveMaxLines,
                    isLocked: state.isLocked,
                    stats,
                    changedPaths: Array.from(changedPaths)
                };
            } else {
                // Sem scroll
                const visibleLines = this.sliceLines(debugTextColumn, 0, config.maxLines - 1).split("\n");
                const state = this.getScrollState(player);
                
                const processedLines = this.applyVisualEffects(visibleLines, { 
                    ...config, 
                    scrollPosition: 0,
                    bookmarks: state.bookmarks,
                    changedPaths 
                });
                
                finalComponents.push(...processedLines);
                
                // Corrige linha em branco no início
                let finalText = finalComponents.join("\n");
                if (finalText.startsWith('\n')) {
                    finalText = finalText.substring(1);
                }
                
                player.onScreenDisplay.setActionBar(finalText.replace('\n', ''));
                
                return { totalLines, maxScroll: 0, scroll: 0, canScroll: false, isLocked: false, stats, changedPaths: Array.from(changedPaths) };
            }
            
        } catch (error) {
            const errorText = config.title && config.title.trim() ? 
                `${config.title}\n§cError: ${error.message}` : 
                `§cError: ${error.message}`;
            player.onScreenDisplay.setActionBar(errorText);
            return { totalLines: 0, maxScroll: 0, scroll: 0, error, canScroll: false, isLocked: false };
        }
    }

    // Métodos utilitários expandidos
    static resetScroll(player) {
        const playerId = player.id;
        if (this.scrollStates.has(playerId)) {
            const state = this.scrollStates.get(playerId);
            state.scrollPosition = 0;
            state.isLocked = false;
            state.scrollVelocity = 0;
            state.startLine = 0;
        }
    }

    static setScrollPosition(player, position) {
        const state = this.getScrollState(player);
        state.scrollPosition = clamp(position, 0, state.maxScroll);
    }

    static scrollToBottom(player) {
        const state = this.getScrollState(player);
        state.scrollPosition = state.maxScroll;
    }

    static scrollByPages(player, pages) {
        const state = this.getScrollState(player);
        const pageSize = 20; // linhas por página
        const newPosition = state.scrollPosition + (pages * pageSize);
        state.scrollPosition = clamp(newPosition, 0, state.maxScroll);
    }

    static cleanupScrollStates() {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        for (const [playerId, state] of this.scrollStates.entries()) {
            if (!state.lastUsed || state.lastUsed < fiveMinutesAgo) {
                this.scrollStates.delete(playerId);
            }
        }
    }
}
let clamp = (value, min, max) => Math.min(Math.max(value, min), max)
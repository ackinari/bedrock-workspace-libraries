import { ItemStack } from "@minecraft/server"

type itemLore = (this: ItemStack, lore: string) => ItemStack
type item = (this: ItemStack) => ItemStack

declare module '@minecraft/server' {
    interface ItemStack {
        addLore: itemLore,
        removeLore: itemLore,
        _setLore: itemLore,
        resetLore: item,
    }
}

const addLore: itemLore = function (this, lore) {
    const newItemStack = this.clone()
    const itemLore = newItemStack.getLore()
    newItemStack.setLore([...itemLore, lore])
    return newItemStack
}
const removeLore: itemLore = function (this, lore) {
    const newItemStack = this.clone()
    let itemLore = newItemStack.getLore()
    itemLore = itemLore.filter((k, i) => k != lore )
    newItemStack.setLore([...itemLore])
    return newItemStack
}
const setLore: itemLore = function (this, lore) {
    const newItemStack = this.clone()
    newItemStack.setLore([lore])
    return newItemStack
}
const resetLore: item = function (this) {
    const newItemStack = this.clone()
    newItemStack.setLore([])
    return newItemStack
}

ItemStack.prototype.addLore = addLore
ItemStack.prototype.removeLore = removeLore
ItemStack.prototype._setLore = setLore
ItemStack.prototype.resetLore = resetLore
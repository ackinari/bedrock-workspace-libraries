import { CommandResult, Entity, ItemType } from '@minecraft/server';

type EntityEquipmentSlot =
    | 'slot.armor'
    | 'slot.armor.body'
    | 'slot.armor,chest'
    | 'slot.armor.feet'
    | 'slot.armor.head'
    | 'slot.armor.legs'
    | 'slot.chest'
    | 'slot.enderchest'
    | 'slot.equippable'
    | 'slot.hotbar'
    | 'slot,inventory'
    | 'slot.saddle'
    | 'slot.weapon.mainhand'
    | 'slot.weapon.offhand'
type SetItem = (this: Entity, itemType: ItemType | string, options?: {slotType?: EntityEquipmentSlot; slotId?: number; amount?: number}, debug?: boolean) => CommandResult

declare module '@minecraft/server' {
    interface Entity {
        setItem: SetItem
    }
}

const setItem: SetItem = function (this, itemType, options = {}, debug = false) {
    const command = `replaceitem entity @s ${options.slotType ?? 'slot.weapon.mainhand'} ${options.slotId ?? 0} ${itemType} ${options.amount ?? 1}`

    if (debug) console.log(command)
    return this.runCommand(command)
}

Entity.prototype.setItem = setItem

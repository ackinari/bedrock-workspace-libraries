import { EntityComponentTypes, EquipmentSlot, ItemStack, Player, system } from "@minecraft/server"

export type GetEquipment = (this: Player, slot?: EquipmentSlot) => ItemStack | undefined
export type SetEquipment = (this: Player, item: ItemStack, slot?: EquipmentSlot) => boolean | undefined

declare module "@minecraft/server" {
    interface Player {
        getEquipment: GetEquipment
        setEquipment: SetEquipment
    }
}

const getEquipment: GetEquipment = function (this, slot = EquipmentSlot.Mainhand) {
    return this.getComponent(EntityComponentTypes.Equippable)?.getEquipment(slot)
}

const setEquipment: SetEquipment = function (this, item, slot = EquipmentSlot.Mainhand) {
    let result: boolean | undefined = undefined
    system.run(() => {
        result = this.getComponent(EntityComponentTypes.Equippable)?.setEquipment(slot, item)
    })
    return result
}

Player.prototype.getEquipment = getEquipment
Player.prototype.setEquipment = setEquipment

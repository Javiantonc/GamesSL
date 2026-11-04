import Phaser from 'phaser';

/**
 * Bus de eventos global. La lógica del juego (modelo) emite eventos y la UI
 * (vista) se suscribe. Así la UI en HTML no depende de Phaser y viceversa.
 *
 * Eventos principales:
 *  inventory:changed, equipment:changed, actionbar:changed,
 *  stats:changed(newStats, oldStats), xp:changed, player:levelup({level, learned}),
 *  abilities:learned(list), target:changed(mob|null),
 *  ui:error(msg), ui:toast(msg, color), ui:loot(item)
 */
export const bus = new Phaser.Events.EventEmitter();

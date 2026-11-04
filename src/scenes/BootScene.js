import Phaser from 'phaser';
import { generateTextures } from '../gfx/textures.js';

/** Prepara las texturas (procedurales) y arranca el juego. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Aquí cargarías tus assets reales, p. ej.:
    // this.load.atlas('chars', 'assets/chars.png', 'assets/chars.json');
  }

  create() {
    generateTextures(this);
    this.scene.start('Game');
  }
}

import Phaser from 'phaser';
import './ui/styles.css';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1f5f9e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  render: { antialias: true, roundPixels: true },
  scene: [BootScene, GameScene],
});

// Útil para depurar desde la consola del navegador: __game.scene.keys.Game.state
window.__game = game;

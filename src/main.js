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

// ---------- PWA ----------
// Registra el service worker (solo funciona servido por http(s), no abriendo el archivo)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
// Guarda el aviso de instalación para mostrar el botón "Instalar como app"
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  dispatchEvent(new Event('mini-realms:installable'));
});

// Útil para depurar desde la consola del navegador: __game.scene.keys.Game.state
window.__game = game;

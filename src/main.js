import './style.css';
import { Game } from './engine/Game.js';
import { UIManager } from './ui/UIManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas3d');
  const game = new Game(canvas);
  const uiManager = new UIManager(game);
  game.uiManager = uiManager;

  console.log('🚀 FRONTIER: MISSION ACADEMY Engine Initialized.');
});

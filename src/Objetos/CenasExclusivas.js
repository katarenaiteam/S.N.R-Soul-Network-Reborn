// As telas atuais do jogo sao exclusivas (o HUD pertence a propria luta).
export function encerrarOutrasCenas(scene) {
  const manager = scene.game.scene;
  for (const outra of manager.getScenes(false)) {
    if (outra === scene) continue;
    if (outra.sys.isActive() || outra.sys.isPaused() || outra.sys.isSleeping()) {
      manager.stop(outra.sys.settings.key);
    }
  }
}

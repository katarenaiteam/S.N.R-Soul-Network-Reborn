export function carregarGradeMenu(scene) {
  for (let parte = 1; parte <= 7; parte++) {
    scene.load.spritesheet(
      `grade${parte}`,
      `./assets/Menus/Char_menu/Sprites/grade${parte}.png`,
      { frameWidth: 1920, frameHeight: 1080 },
    );
  }
}

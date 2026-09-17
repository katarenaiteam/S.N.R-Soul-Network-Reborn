// Divide a folha antes de envia-la ao WebGL, mantendo a chave e os frames do menu.
export function carregarGradeMenu(scene) {
  const arquivo = new Phaser.Loader.FileTypes.ImageFile(scene.load, "grade",
    "/assets/Menus/Char_menu/Sprites/grade.png");
  arquivo.addToCache = function () {
    const largura = 1920;
    const altura = 1080;
    const quantidade = 41;
    const gl = scene.game.renderer.gl;
    const limite = Math.min(4096, gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096);
    const colunas = Math.max(1, Math.floor(limite / largura));
    const linhas = Math.max(1, Math.floor(limite / altura));
    const porPagina = colunas * linhas;
    const colunasOriginais = Math.floor(this.data.width / largura);
    const fontes = [];
    const paginas = [];
    for (let inicio = 0; inicio < quantidade; inicio += porPagina) {
      const total = Math.min(porPagina, quantidade - inicio);
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(colunas, total) * largura;
      canvas.height = Math.ceil(total / colunas) * altura;
      const ctx = canvas.getContext("2d");
      const frames = [];
      for (let i = 0; i < total; i++) {
        const indice = inicio + i;
        const x = (i % colunas) * largura;
        const y = Math.floor(i / colunas) * altura;
        ctx.drawImage(this.data, (indice % colunasOriginais) * largura,
          Math.floor(indice / colunasOriginais) * altura, largura, altura,
          x, y, largura, altura);
        frames.push({ filename: String(indice), rotated: false, trimmed: false,
          frame: { x, y, w: largura, h: altura },
          spriteSourceSize: { x: 0, y: 0, w: largura, h: altura },
          sourceSize: { w: largura, h: altura } });
      }
      fontes.push(canvas);
      paginas.push({ frames });
    }
    this.cache.addAtlasJSONArray(this.key, fontes, paginas);
  };
  scene.load.addFile(arquivo);
}

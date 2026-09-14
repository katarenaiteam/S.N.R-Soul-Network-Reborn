import test from 'node:test';
import assert from 'node:assert/strict';
import IA from '../src/Objetos/Spider_IA.js';
import Controller from '../src/Objetos/BotController.js';

function plataforma(left,right,top) { return {body:{left,right,top,width:right-left,enable:true}}; }
function preparar() {
  const timers=[];
  const scene={time:{now:1000,delayedCall(ms,fn){ const t={ms,fn,remove(){this.removido=true;}};timers.push(t);return t;}},
    physics:{world:{gravity:{y:900}}},mapaAtual:{plataformas:{getChildren:()=>[plataforma(850,1750,900),plataforma(1575,2025,650),plataforma(575,1025,500),plataforma(1275,1725,380)]}}};
  const bot={scene,sprite:{x:1600,y:900,active:true,flipX:false,setFlipX(v){this.flipX=v;},body:{bottom:900,width:60,velocity:{x:0,y:0},blocked:{down:true}}},
    pulos:0,maxPulos:3,forcaPulo:-600,velocidade:240,dashs:0,maxDash:2,podeDash:true,
    maquinaEstados:{estadoAtual:{nome:'idle'}},ult:{},ultEstaCarregada:()=>false,
    specials:Object.fromEntries(['neutro','lado','agachado','air_neutro','air_agachado','air_lado','air_cima'].map(k=>[k,{animacao:k}])),
    golpes:Object.fromEntries(['neutro1','side','agachado','air_neutro','air_side','air_cima','air_agachado'].map(k=>[k,{}])),
    podeUsarAtaque:()=>true,podeUsarSpecial:()=>true};
  const alvo={sprite:{x:1650,y:650,active:true},maquinaEstados:{estadoAtual:{nome:'idle'}}};
  scene.jogador1=alvo;
  const ctrl=new Controller(scene);ctrl.bot=bot;const ia=new IA(ctrl);ctrl.setCerebro(ia);
  return {bot,alvo,scene,ctrl,ia,timers};
}

test('alvo acima: contorna plataforma, segura salto e nao soca o ar',()=>{
  const {bot,ctrl,ia,timers}=preparar();
  ia.update(1000);assert.equal(ctrl.teclas.esquerda.isDown,true);assert.equal(ctrl.teclas.atack.isDown,false);
  bot.sprite.x=1520;ia.update(1100);
  assert.equal(ctrl.teclas.cima.justDown,true);assert.equal(timers.at(-1).ms,550);
  bot.sprite.body.blocked.down=false;bot.sprite.body.velocity.y=-400;
  ia.update(1200);assert.equal(ctrl.teclas.cima.isDown,true);
});

test('rota usa plataforma intermediaria para destino alto demais',()=>{
  const {bot,alvo,ia}=preparar();alvo.sprite.y=380;
  const rota=ia.escolherRota(bot,alvo,ia.plataformas());
  assert.notEqual(rota.top,380);assert.ok(rota.top<900);
});

test('estar em y=750 sobre plataforma nao e cair fora da arena',()=>{
  const {bot,ia}=preparar();bot.sprite.y=750;bot.sprite.body.bottom=750;bot.sprite.body.blocked.down=false;
  assert.equal(ia.processarRecuperacaoBorda(bot,1000),false);
});

test('queda lateral: volta em direcao a uma plataforma e usa pulo',()=>{
  const {bot,ctrl,ia}=preparar();bot.sprite.x=2150;bot.sprite.y=950;bot.sprite.body.bottom=950;bot.sprite.body.blocked.down=false;bot.sprite.body.velocity.y=180;
  assert.equal(ia.processarRecuperacaoBorda(bot,1000),true);
  assert.equal(ctrl.teclas.esquerda.isDown,true);assert.equal(ctrl.teclas.cima.justDown,true);
  ctrl.teclas.cima.justDown=false;ia.processarRecuperacaoBorda(bot,1100);
  assert.equal(ctrl.teclas.cima.justDown,false);
});

test('teia neutra solta direcionais e nao vira agarrao',()=>{
  const {bot,alvo,ia,ctrl}=preparar();alvo.sprite.x=1950;alvo.sprite.y=900;
  ctrl.segurar('direita');ia.tomarDecisao(bot,alvo,1000);
  assert.equal(ctrl.teclas.special.justDown,true);
  for(const k of ['esquerda','direita','cima','baixo'])assert.equal(ctrl.teclas[k].isDown,false);
  assert.equal(ia.usos.has('neutro'),true);
});

test('ult carregada usa ataque+special e respeita bloqueio global',()=>{
  const {bot,alvo,scene,ia,ctrl}=preparar();alvo.sprite.y=900;bot.ultEstaCarregada=()=>true;
  ia.tomarDecisao(bot,alvo,1000);assert.equal(ctrl.teclas.atack.justDown,true);assert.equal(ctrl.teclas.special.justDown,true);
  ctrl.soltarTudo();scene.ultEmAndamento=alvo;ia.tomarDecisao(bot,alvo,1200);
  assert.equal(ctrl.teclas.atack.justDown && ctrl.teclas.special.justDown,false);
});

test('counter reage a ataque proximo; cooldown impede sua escolha',()=>{
  const {bot,alvo,ia,ctrl}=preparar();alvo.sprite.y=900;alvo.maquinaEstados.estadoAtual.nome='atack';
  ia.tomarDecisao(bot,alvo,1000);assert.equal(ctrl.teclas.baixo.isDown,true);assert.equal(ctrl.teclas.special.justDown,true);
  ctrl.soltarTudo();bot.podeUsarSpecial=()=>false;ia.tomarDecisao(bot,alvo,1200);assert.equal(ctrl.teclas.special.justDown,false);
});

test('ataque aereo e teia aerea usam as respectivas direcoes',()=>{
  const {bot,alvo,ia,ctrl}=preparar();bot.sprite.body.blocked.down=false;
  alvo.sprite.y=950;ia.tomarDecisao(bot,alvo,1000);
  assert.equal(ctrl.teclas.atack.justDown,true);assert.equal(ctrl.teclas.baixo.isDown,true);
  ctrl.soltarTudo();alvo.sprite.x=2000;alvo.sprite.y=980;ia.tomarDecisao(bot,alvo,1300);
  assert.equal(ctrl.teclas.special.justDown,true);assert.equal(ia.usos.has('air_agachado'),true);
});

test('pulso renovado cancela timer anterior e preserva duracao do pulo',()=>{
  const {ctrl,timers}=preparar();ctrl.pulsar('cima',550);ctrl.pulsar('cima',550);
  assert.equal(timers[0].removido,true);assert.equal(timers[1].ms,550);
  ctrl.soltarTudo();assert.equal(timers[1].removido,true);
});

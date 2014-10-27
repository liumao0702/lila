var Chess = require('chessli.js').Chess;
var chessground = require('chessground');
var data = require('./data');
var ground = require('./ground');
var keyboard = require('./keyboard');

module.exports = function(cfg, router, i18n, onChange) {

  this.data = data({}, cfg);

  this.vm = {
    flip: false,
    ply: 1,
    situation: null,
    continue: false
  };

  var situationCache = {};

  var showFen = function() {
    var ply, move, cached, fen, hash, h, lm;
    for (ply = 1; ply <= this.vm.ply; ply++) {
      move = this.data.game.moves[ply - 1];
      h += move;
      cached = situationCache[h];
      if (!cached) break;
      hash = h;
      fen = cached.fen;
    }
    if (!cached || ply < this.vm.ply) {
      var chess = new Chess(
        fen || this.data.game.initialFen,
        this.data.game.variant.key == 'chess960' ? 1 : 0
      );
      for (ply = ply; ply <= this.vm.ply; ply++) {
        move = this.data.game.moves[ply - 1];
        hash += move;
        lm = chess.move(move);
        situationCache[hash] = {
          fen: chess.fen(),
          check: chess.in_check(),
          lastMove: [lm.from, lm.to]
        };
      }
    }
    this.vm.situation = situationCache[hash];
    if (this.chessground) this.chessground.set(this.vm.situation);
    else this.chessground = ground.make(this.data, this.vm.situation);
    onChange(this.vm.situation.fen, this.vm.ply);
  }.bind(this);

  this.jump = function(ply) {
    if (this.vm.ply == ply || ply < 1 || ply > this.data.game.moves.length) return;
    this.vm.ply = ply;
    showFen();
  }.bind(this);

  this.flip = function() {
    this.vm.flip = !this.vm.flip;
    this.chessground.set({
      orientation: this.vm.flip ? this.data.opponent.color : this.data.player.color
    });
  }.bind(this);

  this.router = router;

  this.trans = function() {
    var str = i18n[arguments[0]]
    Array.prototype.slice.call(arguments, 1).forEach(function(arg) {
      str = str.replace('%s', arg);
    });
    return str;
  };

  keyboard.init(this);
  showFen();
};
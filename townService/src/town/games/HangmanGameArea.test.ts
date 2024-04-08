import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import HangmanGameArea from './HangmanGameArea';
import HangmanGame from './HangmanGame';
import Player from '../../lib/Player';
import { HangmanLetter, TownEmitter } from '../../types/CoveyTownSocket';
import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_ID_MISSMATCH_MESSAGE,
} from '../../lib/InvalidParametersError';

describe('HangmanGameArea', () => {
  let gameArea: HangmanGameArea;
  let player: Player;
  let player2: Player;
  let mockEmitter: TownEmitter;
  let game: HangmanGame;

  beforeEach(() => {
    player = createPlayerForTesting();
    player2 = createPlayerForTesting();

    mockEmitter = mock<TownEmitter>();
    gameArea = new HangmanGameArea(nanoid(), { x: 0, y: 0, width: 100, height: 100 }, mockEmitter);
    game = new HangmanGame('testword');
    // jest.spyOn(gameArea, '_emitAreaChanged').mockImplementation();
  });

  describe('[H1.1] JoinGame command', () => {
    it('should start a new game if none is in progress', () => {
      expect(gameArea.game).toBeUndefined();
      gameArea.handleCommand({ type: 'JoinGame' }, player);
      expect(gameArea.game).toBeDefined();
      expect(gameArea.game?.state.status).toEqual('WAITING_TO_START');
    });
    it('should throw an error if no game is in progress', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'StartGame', gameID: 'invalid' }, player),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });
  });

  describe('[H1.2] StartGame command', () => {
    beforeEach(() => {
      gameArea.handleCommand({ type: 'JoinGame' }, player);
      game.join(player);
    });

    it('should start the game', () => {
      console.log(`${gameArea.game?.id} ${game.id}`);
      gameArea.handleCommand({ type: 'StartGame', gameID: gameArea.game!.id }, player);
      expect(gameArea.game?.state.status).toEqual('IN_PROGRESS');
    });
    it('should start the game with multiple players', () => {
      gameArea.handleCommand({ type: 'JoinGame' }, player2);
      game.join(player2);
      gameArea.handleCommand({ type: 'StartGame', gameID: gameArea.game!.id }, player);
      expect(gameArea.game?.state.status).toEqual('IN_PROGRESS');
    });

    it('should throw an error for invalid game ID', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'StartGame', gameID: 'invalid' }, player),
      ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
    });
  });

  describe('[H1.3] GameMove command', () => {
    beforeEach(() => {
      gameArea.handleCommand({ type: 'JoinGame' }, player);
      game.join(player);
    });

    it('should apply a move', () => {
      const move = { gamePiece: 'T' as HangmanLetter };
      gameArea.handleCommand({ type: 'StartGame', gameID: gameArea.game!.id }, player);
      gameArea.handleCommand({ type: 'GameMove', move, gameID: gameArea.game!.id }, player);
      expect(gameArea.game?.state.guessedLetters.includes('T')).toBeTruthy();
    });
  });

  
  describe('[H1.4] LeaveGame command', () => {
    beforeEach(() => {
      gameArea.handleCommand({ type: 'JoinGame' }, player);
      game.join(player);
    });

    it('should process a leave game command', () => {
      gameArea.handleCommand({ type: 'LeaveGame', gameID: gameArea.game!.id }, player);
      expect(gameArea.game?.state.status).toBe('WAITING_FOR_PLAYERS');
      expect(gameArea.game?.state.gamePlayersById.length).toBe(0);
      expect(gameArea.game?.state.turnIndex).toBe(0);
      expect(gameArea.game?.state.incorrectGuessesLeft).toBe(6);

    });

    it('should throw an error for invalid game ID', () => {
      expect(() => gameArea.handleCommand({ type: 'LeaveGame', gameID: 'invalid' }, player))
        .toThrowError(GAME_ID_MISSMATCH_MESSAGE);
    });
  });
});

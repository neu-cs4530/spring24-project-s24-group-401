import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  LETTER_ALREADY_GUESSED_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import HangmanGame from './HangmanGame';
import { HangmanLetter } from '../../types/CoveyTownSocket';

describe('HangmanGame', () => {
  let game: HangmanGame;

  beforeEach(() => {
    game = new HangmanGame('test');
  });

  describe('[T1.1] _join', () => {
    it('should throw an error if the player is already in the game', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      const player2 = createPlayerForTesting();

      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    it('should throw an error if the game is full', () => {
      for (let i = 0; i < 4; i++) {
        const player = createPlayerForTesting();
        game.join(player);
      }
      const fifthPlayer = createPlayerForTesting();
      expect(() => game.join(fifthPlayer)).toThrowError(GAME_FULL_MESSAGE);
    });
    describe('When the player can be added', () => {
      it('should have the correct game state after player joins. Should be WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.gamePlayersById[0]).toEqual(player.id);
        expect(game.state.gamePlayersById[1]).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      describe('When the second player joins', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
        });
        it('should correctly keep track of players after joining', () => {
          expect(game.state.gamePlayersById[0]).toEqual(player1.id);
          expect(game.state.gamePlayersById[1]).toEqual(player2.id);
        });
        it('sets the game status to WAITING_TO_START', () => {
          expect(game.state.status).toEqual('WAITING_TO_START');
          expect(game.state.winner).toBeUndefined();
        });
      });
    });
  });
  describe('[T1.2] Starting the game', () => {
    it('should update the game state to IN_PROGRESS when a player starts the game', () => {
      const player = createPlayerForTesting();
      game.join(player);
      game.startGame(player);
      expect(game.state.status).toEqual('IN_PROGRESS');
    });

    it('should throw an error if a player not in the game tries to start it', () => {
      const player = createPlayerForTesting();
      expect(() => game.startGame(player)).toThrowError(GAME_NOT_STARTABLE_MESSAGE);
    });
  });
  describe('[T2.1] Making a guess', () => {
    it('should allow a correct guess and update the board appropriately', () => {
      const player = createPlayerForTesting();
      game.join(player);
      game.startGame(player);
      game.applyMove({
        playerID: player.id,
        move: { gamePiece: 'R' as HangmanLetter },
        gameID: 'test',
      });
      expect(game.state.guessedLetters.includes('R')).toBeTruthy();
    });

    it('should reject a guess if it is not the player’s turn', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.startGame(player1);
      expect(() =>
        game.applyMove({
          playerID: player2.id,
          move: { gamePiece: 'E' as HangmanLetter },
          gameID: 'test',
        }),
      ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
    });

    it('should throw an error for a guessed letter that has already been guessed', () => {
      const player = createPlayerForTesting();
      game.join(player);
      game.startGame(player);
      game.applyMove({
        playerID: player.id,
        move: { gamePiece: 'A' as HangmanLetter },
        gameID: 'test',
      });
      expect(() =>
        game.applyMove({
          playerID: player.id,
          move: { gamePiece: 'A' as HangmanLetter },
          gameID: 'test',
        }),
      ).toThrowError(LETTER_ALREADY_GUESSED_MESSAGE);
    });
  });
  describe('[T2.2] Incorrect guesses', () => {
    it('should decrement the incorrect guesses left counter on a wrong guess', () => {
      const player = createPlayerForTesting();
      game.join(player);
      game.startGame(player);
      game.applyMove({
        playerID: player.id,
        move: { gamePiece: 'z' as HangmanLetter },
        gameID: 'test',
      });
      expect(game.state.incorrectGuessesLeft).toBe(5);
      expect(game.state.incorrectGuesses.includes('Z')).toBeTruthy();
    });

    it('should end the game when incorrect guesses left reaches zero', () => {
      const player = createPlayerForTesting();
      game.join(player);
      game.startGame(player);
      for (const letter of ['z', 'y', 'q', 'w', 'm', 'p']) {
        game.applyMove({
          playerID: player.id,
          move: { gamePiece: letter as HangmanLetter },
          gameID: 'test',
        });
      }
      expect(game.state.status).toBe('OVER');
      expect(game.state.winner).toBe('NO_WINNER');
    });
  });
});

import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { GameArea, HangmanGameState } from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import HangmanAreaController from './HangmanAreaController';

describe('HangmanAreaController', () => {
  const ourPlayer = new PlayerController(nanoid(), nanoid(), {
    x: 0,
    y: 0,
    moving: false,
    rotation: 'front',
  });
  const otherPlayers = [
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
  ];

  const mockTownController = mock<TownController>();
  const gameAreaId = nanoid();
  const gameArea: GameArea<HangmanGameState> = {
    id: gameAreaId,
    game: undefined,
    history: [],
    type: 'HangmanArea',
    occupants: [],
  };

  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });

  let hangmanAreaController: HangmanAreaController;

  /*
  beforeEach(() => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'WAITING_TO_START', [
      ourPlayer.id,
    ]);
  });
  **/

  it('initialises correctly with default values', () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'WAITING_TO_START', [
      ourPlayer.id,
    ]);
    assert.strictEqual(
      hangmanAreaController.isActive(),
      false,
      'Game should not be active initially',
    );
  });
  /*
  it('should update the game state correctly when starting the game', async () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'WAITING_TO_START', [
      ourPlayer.id,
    ]);
    await hangmanAreaController.joinGame();
    await hangmanAreaController.startGame();
    assert.strictEqual(hangmanAreaController.status, 'IN_PROGRESS');
  });

  it('should correctly make a move and update the game state', async () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'WAITING_TO_START', [
      ourPlayer.id,
    ]);
    await hangmanAreaController.joinGame();
    await hangmanAreaController.startGame();
    const letter = 'A';
    await hangmanAreaController.makeMove(letter);
    assert(
      hangmanAreaController.guessedLetters.includes(letter),
      'Letter should be in guessed letters',
    );
  });

  it('should not allow starting a game when it is already in progress', async () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'WAITING_TO_START', [
      ourPlayer.id,
    ]);
    await hangmanAreaController.joinGame();
    await hangmanAreaController.startGame();
    await assert.rejects(async () => {
      await hangmanAreaController.startGame();
    }, 'Should not start a game already in progress');
  });

  it('should handle a game win correctly', async () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    await hangmanAreaController.joinGame();
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 3, 'IN_PROGRESS', [
      ourPlayer.id,
    ]);
    await hangmanAreaController.makeMove('T');
    assert.strictEqual(hangmanAreaController.status, 'OVER');
    assert.strictEqual(
      hangmanAreaController.winner,
      ourPlayer.id,
      'The player should be marked as the winner',
    );
  });

  it('should handle a game loss correctly', async () => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
    await hangmanAreaController.joinGame();
    hangmanAreaController.updateGameState('TEST', ['T', 'E', 'S'], 1, 'IN_PROGRESS', [
      ourPlayer.id,
    ]);
    await hangmanAreaController.makeMove('X');
    assert.strictEqual(hangmanAreaController.status, 'OVER');
    assert.strictEqual(hangmanAreaController.winner, undefined, 'There should be no winner');
  }); */
});

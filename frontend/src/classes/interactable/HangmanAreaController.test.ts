import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { HangmanMove, GameArea, HangmanGameState } from '../../types/CoveyTownSocket';
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
  const initialGameState: HangmanGameState = {
    word: '',
    guessedLetters: [],
    incorrectGuesses: [],
    incorrectGuessesLeft: 6,
    gamePlayersById: [],
    status: 'WAITING_FOR_PLAYERS',
    winner: undefined,
    turnIndex: 0,
    databasePlayers: [],
  };
  const gameArea: GameArea<HangmanGameState> = {
    id: gameAreaId,
    game: undefined,
    history: [],
    type: 'HangmanArea',
    occupants: []
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

  beforeEach(() => {
    hangmanAreaController = new HangmanAreaController(gameAreaId, gameArea, mockTownController);
  });

  it('initialises correctly with default values', () => {
    assert.strictEqual(hangmanAreaController.isActive(), false, 'Game should not be active initially');
  });

  it('should update the game state correctly when starting the game', async () => {
    await hangmanAreaController.startGame();
    assert.strictEqual(hangmanAreaController.status, 'IN_PROGRESS');
  });

  it('should correctly make a move and update the game state', async () => {
    await hangmanAreaController.startGame();
    const letter = 'A';
    await hangmanAreaController.makeMove(letter);
    assert(
      hangmanAreaController.guessedLetters.includes(letter),
      'Letter should be in guessed letters',
    );    
  });

  it('should not allow starting a game when it is already in progress', async () => {
    await hangmanAreaController.startGame();
    await assert.rejects(async () => {
      await hangmanAreaController.startGame();
    }, 'Should not start a game already in progress');
  });

  it('should handle a game win correctly', async () => {
    hangmanAreaController.updateGameState('TEST',['T', 'E', 'S'],3,'IN_PROGRESS');
  
    await hangmanAreaController.makeMove('T');
  
    assert.strictEqual(hangmanAreaController.status, 'OVER');
    assert.strictEqual(hangmanAreaController.winner, ourPlayer.id, 'The player should be marked as the winner');
  });
  
  it('should handle a game loss correctly', async () => {
    hangmanAreaController.updateGameState('TEST',['T', 'E', 'S'],1,'IN_PROGRESS');

    await hangmanAreaController.makeMove('X');
    
    assert.strictEqual(hangmanAreaController.status, 'OVER');
    assert.strictEqual(hangmanAreaController.winner, undefined, 'There should be no winner');
  });
  
  function updateGameWithMove(controller: HangmanAreaController, _nextMove: HangmanMove): void {
    const nextState = Object.assign({}, controller.toInteractableAreaModel());
    const nextGame = Object.assign({}, nextState.game);
    nextState.game = nextGame;
    const newState = Object.assign({}, nextGame.state);
    nextGame.state = newState;
    controller.updateFrom(nextState, controller.occupants);
  }

  it('processes a player move correctly', () => {
    const testMove: HangmanMove = { gamePiece: 'A' };
    updateGameWithMove(hangmanAreaController, testMove);
  });
});

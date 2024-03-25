import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { HangmanMove } from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import HangmanAreaController from './HangmanAreaController';

// Co-Pilot generated tests, will be edited as we build functionality

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

  function updateGameWithMove(controller: HangmanAreaController, nextMove: HangmanMove): void {
    const nextState = Object.assign({}, controller.toInteractableAreaModel());
    const nextGame = Object.assign({}, nextState.game);
    nextState.game = nextGame;
    const newState = Object.assign({}, nextGame.state);
    nextGame.state = newState;
    newState.moves = newState.moves.concat([nextMove]);
    controller.updateFrom(nextState, controller.occupants);
  }
});

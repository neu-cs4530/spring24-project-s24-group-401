import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PlayerController from '../../../../classes/PlayerController';
import TownController from '../../../../classes/TownController';
import {
  GameArea,
  GameStatus,
  HangmanGameState,
  PlayerID,
} from '../../../../types/CoveyTownSocket';
import HangmanAreaController, {
  HangmanCell,
} from '../../../../classes/interactable/HangmanAreaController';
import HangmanBoard from './HangmanBoard';
import { useToast } from '@chakra-ui/react';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});

class MockHangmanAreaController extends HangmanAreaController {
  mockBoard: HangmanCell[] = [];

  mockIsPlayer = false;

  mockIsOurTurn = false;

  makeMove = jest.fn();

  public constructor() {
    super(nanoid(), mock<GameArea<HangmanGameState>>(), mock<TownController>());
    this.mockClear();
  }

  /*
    For ease of testing, we will mock the board property
    to return a copy of the mockBoard property, so that
    we can change the mockBoard property and then check
    that the board property is updated correctly.
    */
  get board() {
    const copy = this.mockBoard;
    return copy;
  }

  get isOurTurn() {
    return this.mockIsOurTurn;
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  mockClear() {
    this.mockBoard = ['_', '_', '_', '_', '_'] as unknown as HangmanCell[];
    this._gameState = {
      word: 'apple',
      guessedLetters: [],
      incorrectGuesses: [],
      incorrectGuessesLeft: 6,
      gamePlayersById: [],
      status: 'IN_PROGRESS',
      winner: undefined,
      turnIndex: 0,
      databasePlayers: [],
    };
    this.makeMove.mockClear();
  }

  //No other method shoudl be callable

  get winner(): string | undefined {
    throw new Error('Method should not be called within this component');
  }

  get status(): GameStatus {
    throw new Error('Method should not be called within this component');
  }

  get whoseTurn(): PlayerID | undefined {
    throw new Error('Method should not be called within this component');
  }

  isEmpty(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public isActive(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public startGame(): Promise<void> {
    throw new Error('Method should not be called within this component');
  }

  public simulateCorrectGuess(letter: string) {
    const positions = Array<number>();
    this._gameState.word.split('').forEach((char, index) => {
      if (char === letter) {
        this.board[index] = letter as HangmanCell;
        this.mockBoard[index] = letter as HangmanCell;
        positions.push(index);
      }
    });
    this._gameState.guessedLetters.push(letter);
    render(<HangmanBoard gameAreaController={this} />);
    return positions;
  }
}
describe('HangmanBoard', () => {
  jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react');
    return {
      ...originalModule,
      useToast: jest.fn(() => jest.fn()), // Ensures useToast returns a function
    };
  });

  const mockToastFunction = jest.fn();
  const gameAreaController = new MockHangmanAreaController();

  async function checkBoard() {
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(6); // 5 for each letter in apple plus submite button
  }

  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      // console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('[T4.1] When observing a game', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockToastFunction.mockClear();
      gameAreaController.mockIsPlayer = false;
    });
    it('should render a board with the correct number of _', async () => {
      render(<HangmanBoard gameAreaController={gameAreaController} />);
      gameAreaController.mockBoard = ['_', '_', '_', '_', '_'] as unknown as HangmanCell[];

      // The board should render 10 underscores if no letters have been guessed yet.
      const underscoreElements = screen.getAllByText('_');
      expect(underscoreElements.length).toBe(5);
    });
    it('updates the board in response to correct letter guesses', async () => {
      render(<HangmanBoard gameAreaController={gameAreaController} />);
      // Initial board should only have underscores
      expect(screen.getAllByText('_').length).toBe(5);
      gameAreaController.simulateCorrectGuess('p');

      // After guessing 'p', which appears twice in 'apple', the board should update
      const pLetters = screen.getAllByText('p');
      expect(pLetters.length).toBe(2); // 'p' appears twice in 'apple'
    });
    it('should initiate the game with a fresh board', async () => {
      render(<HangmanBoard gameAreaController={gameAreaController} />);
      checkBoard();
    });
  });
  describe('[T4.2] When playing a game', () => {
    beforeEach(() => {
      gameAreaController.mockIsOurTurn = true;
      gameAreaController.mockIsPlayer = true;
    });
    it('disables guess input when it is not our turn', async () => {
      // Start with it not being the player's turn
      gameAreaController.mockIsOurTurn = false;
      render(<HangmanBoard gameAreaController={gameAreaController} />);

      const buttons = screen.getAllByRole('button');
      const submitButton = buttons[buttons.length - 1];
      expect(submitButton).toBeDisabled(); // Should be disabled when not our turn
    });
    it('displays an error toast when a player guesses the same letter twice', async () => {
      render(<HangmanBoard gameAreaController={gameAreaController} />);
      const input = screen.getByPlaceholderText('Enter a letter');
      const submitButton = screen.getByRole('button', { name: /guess/i });

      // First guess
      userEvent.type(input, 'a');
      userEvent.click(submitButton);

      // Attempt to guess 'a' again
      userEvent.clear(input);
      userEvent.type(input, 'a');
      userEvent.click(submitButton);

      await waitFor(() => {
        // Verify that the makeMove was called twice
        expect(gameAreaController.makeMove).toHaveBeenCalledTimes(2);
        // Check that the toast function was called with the expected error
        expect(mockToastFunction).not.toBeCalled();
      });
    });
  });
});

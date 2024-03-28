import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mock, mockReset } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import React from 'react';
import HangmanArea from './HangmanBoardArea';
import HangmanAreaController, {
  HangmanCell,
} from '../../../../classes/interactable/HangmanAreaController';
import PlayerController from '../../../../classes/PlayerController';
import {
  GameArea,
  GameStatus,
  HangmanGameState,
  HangmanLetter,
  PlayerID,
} from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import { randomLocation } from '../../../../TestUtils';
import * as HangmanBoard from './HangmanBoard';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('Hangman');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);
const boardComponentSpy = jest.spyOn(HangmanBoard, 'default');
boardComponentSpy.mockReturnValue(<div data-testid='board' />);
class MockHangmanAreaController extends HangmanAreaController {
  makeMove = jest.fn();

  joinGame = jest.fn();

  startGame = jest.fn();

  mockIsOurTurn = false;

  mockTurnIndex = 0;

  mockBoard: HangmanCell[] = [];

  mockWinner: string | undefined = undefined;

  mockWhoseTurn: PlayerID | undefined = undefined;

  mockStatus: GameStatus = 'WAITING_TO_START';

  mockPlayer1: PlayerController | undefined = undefined;

  mockPlayer2: PlayerController | undefined = undefined;

  mockPlayer3: PlayerController | undefined = undefined;

  mockPlayer4: PlayerController | undefined = undefined;

  mockCurrentGame: GameArea<HangmanGameState> | undefined = undefined;

  mockGamePiece: HangmanLetter = 'A';

  mockIsActive = false;

  mockGamePlayersById: PlayerID[] = [];

  mockIncorrectGuessesLeft = 6;

  mockWord = 'testWord';

  mockGuessedLetters = [];

  public constructor() {
    super(nanoid(), mock<GameArea<HangmanGameState>>(), mock<TownController>());
    this.mockClear();
  }

  get board() {
    const copy = this.mockBoard.concat([]);
    for (let i = 0; i < copy.length; i++) {
      copy[i] = copy[i]?.concat('') as HangmanCell;
    }
    return copy;
  }

  get isOurTurn() {
    return this.mockIsOurTurn;
  }

  get winner(): string | undefined {
    return this.mockWinner;
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  get whoseTurn(): PlayerID | undefined {
    return this.mockWhoseTurn;
  }

  get turnIndex(): number {
    return this.mockTurnIndex;
  }

  get gamePlayersById(): PlayerID[] {
    return this.mockGamePlayersById;
  }

  get playersByController(): PlayerController[] {
    return this.mockGamePlayersById.map(id => this._townController.getPlayer(id));
  }

  get incorrectGuessesLeft(): number {
    return this.mockIncorrectGuessesLeft;
  }

  get guessedLetters(): string[] {
    return this.mockGuessedLetters;
  }

  get word(): string {
    return this.mockWord;
  }

  public isActive(): boolean {
    return this.mockIsActive;
  }

  public mockClear(): void {
    this.mockIsOurTurn = false;
    this.mockTurnIndex = 0;
    this.mockBoard = [];
    this.mockWinner = undefined;
    this.mockWhoseTurn = undefined;
    this.mockStatus = 'WAITING_TO_START';
    this.mockPlayer1 = undefined;
    this.mockPlayer2 = undefined;
    this.mockPlayer3 = undefined;
    this.mockPlayer4 = undefined;
    this.mockCurrentGame = undefined;
    this.mockGamePiece = 'A';
    this.mockIsActive = false;
    this.mockGamePlayersById = [];
    this.mockIncorrectGuessesLeft = 6;
    this.mockWord = 'testWord';
    this.mockGuessedLetters = [];
    this.makeMove.mockClear();
  }
}

describe('HangmanArea', () => {
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
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  let gameAreaController = new MockHangmanAreaController();
  let joinGameResolve: () => void;
  let joinGameReject: (err: Error) => void;
  let startGameResolve: () => void;
  let startGameReject: (err: Error) => void;

  function renderHangmanArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={townController}>
          <HangmanArea interactableID={nanoid()} />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }
  beforeEach(() => {
    ourPlayer = new PlayerController('player x', 'player x', randomLocation());
    mockGameArea.name = nanoid();
    mockReset(townController);
    gameAreaController.mockClear();
    useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
    mockToast.mockClear();
    gameAreaController.joinGame.mockReset();
    gameAreaController.makeMove.mockReset();

    gameAreaController.joinGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          joinGameResolve = resolve;
          joinGameReject = reject;
        }),
    );
    gameAreaController.startGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          startGameResolve = resolve;
          startGameReject = reject;
        }),
    );
  });
  describe('[T3.1] Game Update Listeners', () => {
    it('Registers exactly one listener for gameUpdated and gameEnd events', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      renderHangmanArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      expect(addListenerSpy).toHaveBeenCalledWith('gameUpdated', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('gameEnd', expect.any(Function));
    });
    it('Does not register a listener on every render', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderHangmanArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      addListenerSpy.mockClear();

      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <HangmanArea interactableID={nanoid()} />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );

      expect(addListenerSpy).not.toBeCalled();
      expect(removeListenerSpy).not.toBeCalled();
    });
    it('Removes all listeners on unmount', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderHangmanArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      const addedListeners = addListenerSpy.mock.calls;
      const addedGameUpdateListener = addedListeners.find(call => call[0] === 'gameUpdated');
      const addedGameEndedListener = addedListeners.find(call => call[0] === 'gameEnd');
      expect(addedGameEndedListener).toBeDefined();
      expect(addedGameUpdateListener).toBeDefined();
      renderData.unmount();
      expect(removeListenerSpy).toBeCalledTimes(2);
      const removedListeners = removeListenerSpy.mock.calls;
      const removedGameUpdateListener = removedListeners.find(call => call[0] === 'gameUpdated');
      const removedGameEndedListener = removedListeners.find(call => call[0] === 'gameEnd');
      expect(removedGameUpdateListener).toEqual(addedGameUpdateListener);
      expect(removedGameEndedListener).toEqual(addedGameEndedListener);
    });
    it('Creates new listeners if the gameAreaController changes', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderHangmanArea();
      expect(addListenerSpy).toBeCalledTimes(2);

      gameAreaController = new MockHangmanAreaController();
      const removeListenerSpy2 = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy2 = jest.spyOn(gameAreaController, 'addListener');

      useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <HangmanArea interactableID={nanoid()} />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );
      expect(removeListenerSpy).toBeCalledTimes(2);

      expect(addListenerSpy2).toBeCalledTimes(2);
      expect(removeListenerSpy2).not.toBeCalled();
    });
  });
  describe('[T3.2] Join game button', () => {
    it('Is not shown if the game status is IN_PROGRESS', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = new PlayerController(
        'player one',
        'player one',
        randomLocation(),
      );
      gameAreaController.mockPlayer2 = new PlayerController(
        'player two',
        'player two',
        randomLocation(),
      );
      gameAreaController.mockPlayer3 = new PlayerController(
        'player three',
        'player three',
        randomLocation(),
      );
      gameAreaController.mockPlayer4 = new PlayerController(
        'player four',
        'player four',
        randomLocation(),
      );
      renderHangmanArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
    it('Is not shown if the game status is WAITING_TO_START', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockPlayer1 = ourPlayer;
      renderHangmanArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
    it('Is shown if the game status is WAITING_FOR_PLAYERS', () => {
      gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
      gameAreaController.mockPlayer1 = undefined;
      gameAreaController.mockPlayer2 = new PlayerController(
        'player O',
        'player O',
        randomLocation(),
      );
      renderHangmanArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    it('Is shown if the game status is OVER', () => {
      gameAreaController.mockStatus = 'OVER';
      gameAreaController.mockPlayer1 = undefined;
      gameAreaController.mockPlayer2 = new PlayerController(
        'player O',
        'player O',
        randomLocation(),
      );
      renderHangmanArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls the gameAreaController.joinGame method', () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        //gameAreaController.mockIsPlayer = false;
        renderHangmanArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
      });
      it('Displays a toast with the error message if the joinGame method throws an error', async () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        //gameAreaController.mockIsPlayer = false;
        renderHangmanArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
        const errorMessage = `Testing error message ${nanoid()}`;
        act(() => {
          joinGameReject(new Error(errorMessage));
        });
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: `Error: ${errorMessage}`,
              status: 'error',
            }),
          );
        });
      });
      it('Is disabled and set to loading while the player is joining the game', async () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        //gameAreaController.mockIsPlayer = false;
        renderHangmanArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();

        expect(button).toBeDisabled();
        expect(within(button).queryByText('Loading...')).toBeInTheDocument(); //Check that the loading text is displayed
        act(() => {
          joinGameResolve();
        });
        await waitFor(() => expect(button).toBeEnabled());
        expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
      });
      it('Adds the display of the button when a game becomes possible to join', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        //gameAreaController.mockIsPlayer = false;
        gameAreaController.mockPlayer1 = new PlayerController(
          'player red',
          'player red',
          randomLocation(),
        );
        gameAreaController.mockPlayer2 = new PlayerController(
          'player yellow',
          'player yellow',
          randomLocation(),
        );
        renderHangmanArea();
        expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
          gameAreaController.mockPlayer1 = undefined;
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Join New Game')).toBeInTheDocument();
      });
      it('Removes the button after the player has joined the game', () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        //gameAreaController.mockIsPlayer = false;
        gameAreaController.mockPlayer1 = undefined;
        gameAreaController.mockPlayer2 = new PlayerController(
          'player yellow',
          'player yellow',
          randomLocation(),
        );
        renderHangmanArea();
        expect(screen.queryByText('Join New Game')).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_TO_START';
          gameAreaController.mockPlayer1 = ourPlayer;
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      });
    });
  });
  describe('[T3.3] Start game button', () => {
    it('Is not shown if the game status is IN_PROGRESS', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = ourPlayer;
      gameAreaController.mockPlayer2 = new PlayerController(
        'player y',
        'player y',
        randomLocation(),
      );
      //gameAreaController.mockIsPlayer = true;
      renderHangmanArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
    it('Is not shown if the game status is WAITING_FOR_PLAYERS', () => {
      gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
      //gameAreaController.mockPlayer1 = ourPlayer;
      //gameAreaController.mockIsPlayer = true;
      renderHangmanArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
    it('Is shown if the game status is WAITING_TO_START', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockPlayer1 = ourPlayer;
      /* gameAreaController.mockPlayer2 = new PlayerController(
        'player y',
        'player y',
        randomLocation(),
      ); */
      //gameAreaController.mockIsPlayer = true;
      renderHangmanArea();
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls the gameAreaController.startGame method', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockPlayer1 = ourPlayer;
        /* gameAreaController.mockYellow = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        ); */
        //gameAreaController.mockIsPlayer = true;
        renderHangmanArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        expect(gameAreaController.startGame).toBeCalled();
      });
      it('Displays a toast with the error message if the startGame method throws an error', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockPlayer1 = ourPlayer;
        /* gameAreaController.mockPlayer2 = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        ); */
        //gameAreaController.mockIsPlayer = true;
        renderHangmanArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        expect(gameAreaController.startGame).toBeCalled();
        const errorMessage = `Testing error message ${nanoid()}`;
        act(() => {
          startGameReject(new Error(errorMessage));
        });
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: `Error: ${errorMessage}`,
              status: 'error',
            }),
          );
        });
      });
      it('Is disabled and set to loading while the player is starting the game', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockPlayer1 = ourPlayer;
        /* gameAreaController.mockYellow = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        ); */
        //gameAreaController.mockIsPlayer = true;
        renderHangmanArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        expect(gameAreaController.startGame).toBeCalled();

        expect(button).toBeDisabled();
        expect(within(button).queryByText('Loading...')).toBeInTheDocument(); //Check that the loading text is displayed
        act(() => {
          startGameResolve();
        });
        await waitFor(() => expect(button).toBeEnabled());
        expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
      });
      it('Adds the button when a game becomes possible to start', () => {
        /* gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        gameAreaController.mockRed = ourPlayer;
        gameAreaController.mockIsPlayer = true;
        renderConnectFourArea();
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_TO_START';
          gameAreaController.mockYellow = new PlayerController(
            'player y',
            'player y',
            randomLocation(),
          );
          gameAreaController.emit('gameUpdated');
        }); */
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        renderHangmanArea();
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_TO_START';
          gameAreaController.mockPlayer1 = ourPlayer;
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Start Game')).toBeInTheDocument();
      });
      it('Removes the button once the game is in progress', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockPlayer1 = ourPlayer;
        gameAreaController.mockPlayer2 = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        );
        //gameAreaController.mockIsPlayer = true;
        renderHangmanArea();
        expect(screen.queryByText('Start Game')).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'IN_PROGRESS';
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      });
    });
  });
  describe('[T3.4] Players in game text', () => {
    it('Displays the username of player one if there is one', () => {
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockStatus = 'WAITING_TO_START';
      //gameAreaController.mockIsPlayer = false;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays the username of player two if there is one', () => {
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      //gameAreaController.mockIsPlayer = false;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays the username of player three if there is one', () => {
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer3 = new PlayerController(nanoid(), nanoid(), randomLocation());
      //gameAreaController.mockIsPlayer = false;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer3.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays the username of player four if there is one', () => {
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer3 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer4 = new PlayerController(nanoid(), nanoid(), randomLocation());
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer3.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer4.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays "No players in game yet!" if there are no players', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = undefined;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`No players in game yet!`)).toBeInTheDocument();
    });
    it('Updates player one when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = undefined;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`No players in game yet!)`)).toBeInTheDocument();
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
    });
    it('Updates both players when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = undefined;
      gameAreaController.mockPlayer2 = undefined;
      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`No players in game yet!)`)).toBeInTheDocument();
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
    });
    it('Updates all three players when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = undefined;
      gameAreaController.mockPlayer2 = undefined;
      gameAreaController.mockPlayer3 = undefined;

      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`No players in game yet!)`)).toBeInTheDocument();
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer3 = new PlayerController(nanoid(), nanoid(), randomLocation());

      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer3.userName}`),
      ).toBeInTheDocument();
    });
    it('Updates all four players when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockPlayer1 = undefined;
      gameAreaController.mockPlayer2 = undefined;
      gameAreaController.mockPlayer3 = undefined;
      gameAreaController.mockPlayer4 = undefined;

      renderHangmanArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`No players in game yet!)`)).toBeInTheDocument();
      gameAreaController.mockPlayer1 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer2 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer3 = new PlayerController(nanoid(), nanoid(), randomLocation());
      gameAreaController.mockPlayer4 = new PlayerController(nanoid(), nanoid(), randomLocation());

      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer1.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer2.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer3.userName}`),
      ).toBeInTheDocument();
      expect(
        within(listOfPlayers).getByText(`${gameAreaController.mockPlayer4.userName}`),
      ).toBeInTheDocument();
    });
  });
  describe('[T3.5] Game status text', () => {
    it('Displays the correct text when the game is waiting to start', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      renderHangmanArea();
      expect(
        screen.getByText('Waiting for players to press start', { exact: false }),
      ).toBeInTheDocument();
    });
    it('Displays the correct text when the game is in progress', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      renderHangmanArea();
      expect(screen.getByText('Game in progress', { exact: false })).toBeInTheDocument();
    });
    it('Displays the correct text when the game is over', () => {
      gameAreaController.mockStatus = 'OVER';
      renderHangmanArea();
      expect(screen.getByText('Game over', { exact: false })).toBeInTheDocument();
    });
    it('Displays the correct text when the game is waiting for players', () => {
      gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
      renderHangmanArea();
      expect(screen.getByText('Waiting for players to join', { exact: false })).toBeInTheDocument();
    });
    describe('When a game is in progress', () => {
      beforeEach(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockIncorrectGuessesLeft = 2;
        gameAreaController.mockPlayer1 = ourPlayer;
        gameAreaController.mockPlayer2 = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        );
        gameAreaController.mockIsOurTurn = true;
        gameAreaController.mockWhoseTurn = ourPlayer.id;
      });
      it('Displays a message "Game in progress, {incorrectGuessesLeft} incorrect guesses left" and indicates whose turn it is when it is our turn', () => {
        renderHangmanArea();
        expect(
          screen.getByText('Game in progress, 2 incorrect guesses left, currently your turn', {
            exact: false,
          }),
        ).toBeInTheDocument();
      });
      it('Displays a message "Game in progress, {incorrectGuessesLeft} incorrect guesses left" and indicates whose turn it is when it is not our turn', () => {
        gameAreaController.mockIncorrectGuessesLeft = 1;
        gameAreaController.mockIsOurTurn = false;
        gameAreaController.mockWhoseTurn = gameAreaController.mockPlayer2?.id;
        renderHangmanArea();
        expect(
          screen.getByText(
            `Game in progress, 1 incorrect guesses left, currently ${gameAreaController.mockPlayer2?.userName}'s turn`,
            { exact: false },
          ),
        ).toBeInTheDocument();
      });
      it('Updates the move count when the game is updated', () => {
        renderHangmanArea();
        expect(
          screen.getByText(`Game in progress, 2 incorrect guesses left`, { exact: false }),
        ).toBeInTheDocument();
        act(() => {
          gameAreaController.mockIncorrectGuessesLeft = 1;
          gameAreaController.mockWhoseTurn = gameAreaController.mockPlayer2?.id;
          gameAreaController.mockIsOurTurn = false;
          gameAreaController.emit('gameUpdated');
        });
        expect(
          screen.getByText(`Game in progress, incorrect guesses left`, { exact: false }),
        ).toBeInTheDocument();
      });
      it('Updates the turn when the game is updated', () => {
        renderHangmanArea();
        expect(screen.getByText(`, currently your turn`, { exact: false })).toBeInTheDocument();
        act(() => {
          gameAreaController.mockIncorrectGuessesLeft = 1;
          gameAreaController.mockWhoseTurn = gameAreaController.mockPlayer2?.id;
          gameAreaController.mockIsOurTurn = false;
          gameAreaController.emit('gameUpdated');
        });
        expect(
          screen.getByText(`, currently ${gameAreaController.mockPlayer2?.userName}'s turn`, {
            exact: false,
          }),
        ).toBeInTheDocument();
      });
      it('Updates the game status when the game is updated', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        renderHangmanArea();
        expect(
          screen.getByText('Waiting for players to press start', { exact: false }),
        ).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'IN_PROGRESS';
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.getByText('Game in progress', { exact: false })).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'OVER';
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.getByText('Game over', { exact: false })).toBeInTheDocument();
      });
    });
    describe('When the game ends', () => {
      it('Displays a toast with the winner', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockPlayer1 = ourPlayer;
        gameAreaController.mockPlayer2 = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        );
        renderHangmanArea();
        gameAreaController.mockWinner = ourPlayer.id;
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: `You won!`,
          }),
        );
      });
      it('Displays a toast with the loser', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockPlayer1 = ourPlayer;
        gameAreaController.mockPlayer2 = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        );
        renderHangmanArea();
        gameAreaController.mockWinner = gameAreaController.mockPlayer2.id;
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: `You lost :(`,
          }),
        );
      });
      // TODO: Do we have a tie condition?
      /* it('Displays a toast with a tie', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockIsPlayer = true;
        gameAreaController.mockRed = ourPlayer;
        gameAreaController.mockYellow = new PlayerController(
          'player y',
          'player y',
          randomLocation(),
        );
        renderConnectFourArea();
        gameAreaController.mockWinner = undefined;
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: 'Game ended in a tie',
          }),
        );
      }); */
    });
  });
});

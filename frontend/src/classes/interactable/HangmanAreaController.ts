import GameAreaController, { GameEventTypes, NO_GAME_STARTABLE } from './GameAreaController';
import PlayerController from '../PlayerController';
import {
  GameArea,
  GameStatus,
  HangmanLetter,
  HangmanMove,
  HangmanGameState,
  PlayerID,
} from '../../types/CoveyTownSocket';

export type HangmanCell = HangmanLetter | undefined;

export type HangmanEvents = GameEventTypes & {
  wordChanged: (word: string) => void;
  guessedLettersChanged: (guessedLetters: string[]) => void;
  incorrectGuessesLeftChanged: (incorrectGuessesLeft: number) => void;
  gamePlayersByIdChanged: (gamePlayersById: string[]) => void;
  statusChanged: (status: GameStatus) => void;
  winnerChanged: (winner?: string) => void;
  turnChanged: (isOurTurn: boolean) => void;
};

function generateWord(): string {
  const words = [
    'apple',
    'banana',
    'cherry',
    'date',
    'elderberry',
    'fig',
    'grape',
    'honeydew',
    'kiwi',
    'lemon',
    'mango',
    'nectarine',
    'orange',
    'pear',
    'quince',
    'raspberry',
    'strawberry',
    'tangerine',
    'watermelon',
  ];
  return words[Math.floor(Math.random() * words.length)];
}

export default class HangmanAreaController extends GameAreaController<
  HangmanGameState,
  HangmanEvents
> {
  /**
   * Returns the current state of the board.
   *
   * The board is an array of HangmanCell, which is either a HangmanLetter or undefined.
   */
  get board(): HangmanCell[] {
    return this._board;
  }

  /**
   * Returns true if it is our turn to make a move, false otherwise
   */
  get isOurTurn(): boolean {
    return this.whoseTurn === this._townController.ourPlayer?.id;
  }

  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   *
   * Follows the same logic as the backend, respecting the firstPlayer field of the gameState
   */
  get whoseTurn(): PlayerID | undefined {
    if (
      this._model.game === undefined ||
      this._model.game.state.gamePlayersById.length === 0 ||
      this._model.game.state.status !== 'IN_PROGRESS'
    ) {
      return undefined;
    }
    return this._model.game.state.gamePlayersById[this._model.game.state.turnIndex];
  }

  /**
   * Returns true if the game is not empty and the game is not waiting for players
   */
  public isActive(): boolean {
    const state = this._model.game?.state;
    return state?.status !== 'WAITING_FOR_PLAYERS' && !this.isEmpty();
  }

  protected _gameState: HangmanGameState = {
    word: '',
    guessedLetters: [],
    incorrectGuesses: [],
    incorrectGuessesLeft: 6,
    gamePlayersById: [],
    status: 'WAITING_TO_START',
    winner: undefined,
    turnIndex: 0,
  };

  protected _board: HangmanCell[] = this.getBoard(this._gameState?.word);

  /**
   * This class is responsible for managing the state of the Hangman game, and for sending commands to the server
   */
  private getBoard(wordToBeGuessed: string): HangmanCell[] {
    if (wordToBeGuessed === '') {
      return this.createEmptyBoard();
    }
    return this.createEmptyBoard();
  }

  private createEmptyBoard(): HangmanCell[] {
    this._gameState.word = generateWord();
    const board = new Array(this._gameState.word.length);
    for (let i = 0; i < this._gameState.word.length; i++) {
      board[i] = undefined;
    }
    return board;
  }

  /**
   * Returns the word that players are trying to guess.
   */
  get word(): string {
    return this._gameState.word;
  }

  /**
   * Returns an array of letters that players have guessed.
   */
  get guessedLetters(): string[] {
    return this._gameState.guessedLetters;
  }

  /**
   * Returns the number of incorrect guesses left for the players.
   */
  get incorrectGuessesLeft(): number {
    return this._gameState.incorrectGuessesLeft;
  }

  /**
   * Returns an array of player IDs who are participating in the game.
   */
  get gamePlayersById(): string[] {
    return this._gameState.gamePlayersById;
  }

  /**
   * Returns the number index of the Player whose turn it is.
   */
  get turnIndex(): number {
    return this._model.game?.state.turnIndex || 0;
  }

  /**
   * Returns the current status of the game.
   */
  get status(): GameStatus {
    return this._gameState.status;
  }

  /**
   * Returns the winner of the game, if there is one.
   */
  get winner(): string | undefined {
    return this._gameState.winner;
  }

  protected _updateFrom(newModel: GameArea<HangmanGameState>): void {
    super._updateFrom(newModel);
    const newGame = newModel.game;
    if (newGame) {
      this._gameState = newGame.state;
      this.emit('wordChanged', this._gameState.word);
      this.emit('guessedLettersChanged', this._gameState.guessedLetters);
      this.emit('incorrectGuessesLeftChanged', this._gameState.incorrectGuessesLeft);
      this.emit('gamePlayersByIdChanged', this._gameState.gamePlayersById);
      this.emit('statusChanged', this._gameState.status);
      this.emit('winnerChanged', this._gameState.winner);
    }
  }

  public async guessLetter(letter: string): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error('No game in progress');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: instanceID,
      move: { gamePiece: letter } as HangmanMove,
    });
  }

  /**
   * Sends a request to the server to start the game.
   *
   * If the game is not in the WAITING_TO_START state, throws an error.
   *
   * @throws an error with message NO_GAME_STARTABLE if there is no game waiting to start
   */
  public async startGame(): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'WAITING_TO_START') {
      throw new Error(NO_GAME_STARTABLE);
    }
    await this._townController.sendInteractableCommand(this.id, {
      gameID: instanceID,
      type: 'StartGame',
    });
  }
}

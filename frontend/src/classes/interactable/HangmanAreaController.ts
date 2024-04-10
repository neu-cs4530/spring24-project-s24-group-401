import GameAreaController, { GameEventTypes, NO_GAME_STARTABLE } from './GameAreaController';
import PlayerController from '../PlayerController';
import {
  GameArea,
  GameStatus,
  HangmanLetter,
  HangmanGameState,
  PlayerID,
} from '../../types/CoveyTownSocket';
import _ from 'lodash';

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
    return this._gameState.gamePlayersById[this._gameState.turnIndex];
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
    status: 'WAITING_FOR_PLAYERS',
    winner: undefined,
    turnIndex: 0,
    databasePlayers: [],
  };

  protected _board: HangmanCell[] = this._createEmptyBoard();

  private _createEmptyBoard(): HangmanCell[] {
    const board = new Array(this._gameState.word.length);
    for (let i = 0; i < this._gameState.word.length; i++) {
      board[i] = undefined;
    }
    return board;
  }

  /**
   * Helps create a manual gamestate for test cases
   */
  public async updateGameState(
    word: string,
    guessedLetters: Array<string>,
    incorrectGuessesLeft: number,
    status: GameStatus,
    databasePlayers: Array<PlayerID>
  ): Promise<void> {
    this._gameState.word = word;
    this._gameState.incorrectGuessesLeft = incorrectGuessesLeft;
    this._gameState.status = status;
    this._gameState.guessedLetters = guessedLetters;
    this._gameState.databasePlayers = databasePlayers;
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
   * Returns the number index of the Player whose turn it is.
   */
  get turnIndex(): number {
    return this._model.game?.state.turnIndex || 0;
  }

  /**
   * Returns the current status of the game.
   */
  get status(): GameStatus {
    const status = this._model.game?.state.status;
    if (!status) {
      return 'WAITING_FOR_PLAYERS';
    }
    return status;
  }

  /**
   * Returns the winner of the game, if there is one.
   */
  get winner(): string | undefined {
    return this._gameState.winner;
  }

  get playersByController(): PlayerController[] {
    return this.occupants.filter(player =>
      this._model.game?.state.gamePlayersById.includes(player.id),
    );
  }

  protected _updateFrom(newModel: GameArea<HangmanGameState>): void {
    super._updateFrom(newModel);
    const newGame = newModel.game;

    if (newGame) {
      this._gameState = newGame.state;
      const newBoard = this._createEmptyBoard();
      const word = newGame.state.word.toUpperCase();
      newGame.state.guessedLetters.forEach(letter => {
        for (let i = 0; i < word.length; i++) {
          if (word[i] === letter) {
            newBoard[i] = letter as HangmanLetter;
          }
        }
      });
      if (!_.isEqual(newBoard, this._board)) {
        this._board = newBoard;
        this.emit('boardChanged', this._board);
      }
      if (this._gameState.status === 'OVER') {
        this.emit('gameEnd');
      }
      this.emit('wordChanged', this._gameState.word);
      this.emit('guessedLettersChanged', this._gameState.guessedLetters);
      this.emit('incorrectGuessesLeftChanged', this._gameState.incorrectGuessesLeft);
      this.emit('gamePlayersByIdChanged', this._gameState.gamePlayersById);
      this.emit('statusChanged', this._gameState.status);
      this.emit('winnerChanged', this._gameState.winner);
      this.emit('turnChanged', this.isOurTurn);
    }
  }

  public async makeMove(letter: HangmanLetter): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error('No game in progress');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: instanceID,
      move: { gamePiece: letter },
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

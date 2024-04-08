import InvalidParametersError, {
  MOVE_NOT_YOUR_TURN_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  LETTER_ALREADY_GUESSED_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import DatabasePlayer from '../../lib/databasePlayer';
import { GameMove, HangmanGameState, HangmanMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A HangmanGame is a game that implements the rules of Hangman.
 * @see https://en.wikipedia.org/wiki/Hangman_(game)
 */

export default class HangmanGame extends Game<HangmanGameState, HangmanMove> {
  // a list of playerIDs of all Players currently in the game
  private _maxPlayersAllowed = 4;

  private _correctGuesses: Set<string>;

  private _targetWord: string;

  private _board: string;

  public constructor(targetWord: string) {
    // word to be guessed
    super({
      status: 'WAITING_FOR_PLAYERS',
      word: targetWord,
      guessedLetters: [],
      incorrectGuesses: [],
      incorrectGuessesLeft: 6,
      gamePlayersById: [],
      turnIndex: 0,
      databasePlayers: [],
    });
    this._targetWord = targetWord;
    this._board = this._initBoard(targetWord);
    this._correctGuesses = new Set([...targetWord?.toUpperCase()]); // Unique letters in the word
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   *
   * If the game state is currently "IN_PROGRESS" and there is only one player, updates winner to undefined
   * If only no players are left in the game, updates the game state to "WAITING_FOR_PLAYERS"
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (this.state.gamePlayersById.indexOf(player.id) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.status === 'IN_PROGRESS' && this.state.gamePlayersById.length === 1) {
      this._removePlayer(player);
      this.state.status = 'OVER';
      this.state.winner = undefined;
    } else {
      this._removePlayer(player);
    }
    if (this.state.gamePlayersById.length === 0) {
      this.state = {
        ...this.state,
        status: 'WAITING_FOR_PLAYERS',
      };
    }
  }

  /**
   * Indicates that a player is ready to start the game.
   *
   * Updates the game state to indicate that the game is starting
   *
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is not in the WAITING_TO_START state (GAME_NOT_STARTABLE_MESSAGE)
   *
   * @param player The player who is ready to start the game
   */
  public startGame(player: Player): void {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_NOT_STARTABLE_MESSAGE);
    }
    if (this.state.gamePlayersById.indexOf(player.id) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      status: 'IN_PROGRESS',
    };
  }

  /**
   * Applies a move to the game.
   *
   * Validates the move, and if it is valid, applies it to the game state.
   *
   * If the move ends the game, updates the game state to reflect the end of the game,
   * setting the status to "OVER" and the winner to the player who won (or "undefined" if player lost)
   *
   * @param move The move to attempt to apply
   *
   * @throws InvalidParametersError if the game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   *
   */

  public applyMove(move: GameMove<HangmanMove>) {
    console.log('apply move in HangmanGame.ts');
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this.state.gamePlayersById.indexOf(move.playerID) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    // check here to see if it's the players turn
    if (this.state.gamePlayersById[this.state.turnIndex] !== move.playerID) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    const guessedLetter = move.move.gamePiece.toUpperCase();

    // if letter already guessed
    if (this.state.guessedLetters.includes(guessedLetter)) {
      throw new InvalidParametersError(LETTER_ALREADY_GUESSED_MESSAGE);
    }
    this.state.guessedLetters.push(guessedLetter);

    // if letter is in the word
    if (this._targetWord.toUpperCase().includes(guessedLetter)) {
      console.log(`letter is in word:${this._targetWord}`);
      this._correctGuesses.delete(guessedLetter);
      if (this._correctGuesses.size === 0) {
        // player has guessed all the letters
        this.state = {
          ...this.state,
          status: 'OVER',
          winner: move.playerID,
        };
        this.state.databasePlayers
          .find(player => player.name === move.playerID)
          ?.increment('score');
      }
    } else {
      // if letter is not in the word
      console.log(`letter not in word HangmanGame.ts${this._targetWord} ${guessedLetter}`);
      this.state.incorrectGuessesLeft -= 1;
      this.state.incorrectGuesses.push(guessedLetter);
      if (this.state.incorrectGuessesLeft === 0) {
        // player has run out of guesses
        this.state = {
          ...this.state,
          status: 'OVER',
          winner: 'NO_WINNER',
        };
      } else {
        this._moveToNextPlayer();
      }
    }
    this._board = this._renderBoard();
  }

  private _renderBoard(): string {
    let board = '';
    for (let i = 0; i < this._targetWord.length; i++) {
      if (this.state.guessedLetters.includes(this._targetWord[i])) {
        board += this._targetWord[i];
      } else {
        board += '_';
      }
    }
    return board;
  }

  private _removePlayer(player: Player) {
    const index = this.state.gamePlayersById.indexOf(player.id);
    if (index > -1) {
      this.state.gamePlayersById.splice(index, 1);
    }
  }

  /**
   * Joins a player to the game.
   *
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is full (GAME_FULL_MESSAGE)
   *
   * @param player the player to join the game
   */
  protected _join(player: Player) {
    if (this.state.gamePlayersById.length === this._maxPlayersAllowed) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    if (this.state.gamePlayersById.includes(player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    this.state.gamePlayersById.push(player.id);

    // this._findOrCreateDatabasePlayer(player.id);

    this.state = {
      ...this.state,
      status: 'WAITING_TO_START',
    };
  }

  private _findOrCreateDatabasePlayer(playerID: string) {
    DatabasePlayer.findOrCreate({
      where: {
        name: playerID,
      },
    }).then(([dbPlayer]) => this.state.databasePlayers.push(dbPlayer));
  }

  private _initBoard(targetWord: string): string {
    let board = '';
    if (!targetWord) {
      return '';
    }
    for (let i = 0; i < targetWord.length; i++) {
      board += '_';
    }
    return board;
  }

  private _moveToNextPlayer(): void {
    this.state = {
      ...this.state,
      turnIndex: (this.state.turnIndex + 1) % this.state.gamePlayersById.length,
    };
  }
}

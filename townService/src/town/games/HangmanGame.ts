import InvalidParametersError, { GAME_FULL_MESSAGE, GAME_NOT_IN_PROGRESS_MESSAGE, GAME_NOT_STARTABLE_MESSAGE, LETTER_ALREADY_GUESSED_MESSAGE, PLAYER_ALREADY_IN_GAME_MESSAGE, PLAYER_NOT_IN_GAME_MESSAGE } from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, HangmanGameState, HangmanMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A HangmanGame is a game that implements the rules of Hangman.
 * @see https://en.wikipedia.org/wiki/Hangman_(game)
 */

export default class HangmanGame extends Game<HangmanGameState, HangmanMove> {
  // a list of playerIDs of all Players currently in the game 
  private maxPlayersAllowed = 10;
  private correctGuesses: Set<string>;
  private targetWord: string;
  private _board: string;

  public constructor(targetWord: string) {
    // word to be guessed
    super({
      status: 'WAITING_TO_START',
      word: 'testWord',
      guessedLetters: [],
      incorrectGuessesLeft: 6,
      allPlayers: [],
    });
    this.targetWord = targetWord;
    this._board = this._initBoard(targetWord);
    this.correctGuesses = new Set([...targetWord]); // Unique letters in the word
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   *
   * If the game state is currently "IN_PROGRESS" and there is only player, updates winner to undefined
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (this.state.allPlayers.indexOf(player.id) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.status === 'IN_PROGRESS' && this.state.allPlayers.length === 1) {
      this._removePlayer(player);
      this.state.status = 'OVER';
      this.state.winner = undefined;
    } else {
      this._removePlayer(player);
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
    if (this.state.allPlayers.indexOf(player.id) === -1) {
    throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this.state = {
    ...this.state,
    status: 'IN_PROGRESS'
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

  // STILL NEED TO IMPLEMENT TURNS
  public applyMove(move: GameMove<HangmanMove>) {
      // have a check here to see if it's the players turn

    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this.state.allPlayers.indexOf(move.playerID) === -1) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }   
    const GUESSEDLETTER = move.move.guessedLetter.toUpperCase();

    // if letter already guessed
    if (this.state.guessedLetters.includes(GUESSEDLETTER)) {
      throw new InvalidParametersError(LETTER_ALREADY_GUESSED_MESSAGE);
    }
    this.state.guessedLetters.push(GUESSEDLETTER);

    // if letter is in the word
    if (this.targetWord.includes(GUESSEDLETTER)) {
      this.correctGuesses.delete(GUESSEDLETTER);
      if (this.correctGuesses.size === 0) {
        // player has guessed all the letters
        this.state.status = 'OVER';
        this.state.winner = move.playerID;
      }
    } else {
      // if letter is not in the word
      this.state.incorrectGuessesLeft -= 1;
      if (this.state.incorrectGuessesLeft === 0) {
          // player has run out of guesses
          this.state.status = 'OVER';
          this.state.winner = undefined;
      }
    }
    this._board = this._renderBoard();
  }

  private _renderBoard(): string {
    let board = '';
    for (let i = 0; i < this.targetWord.length; i++) {
      if (this.state.guessedLetters.includes(this.targetWord[i])) {
          board += this.targetWord[i];
      } else {
          board += '_';
      }
    }
    return board;
  }
  
  private _removePlayer(player: Player) {
    const index = this.state.allPlayers.indexOf(player.id);
    if (index > -1) {
      this.state.allPlayers.splice(index, 1);
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
    if (this.state.allPlayers.length === this.maxPlayersAllowed) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    if (this.state.allPlayers.includes(player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (this.state.allPlayers.length === 0) {
      this.state.allPlayers.push(player.id);
      return;
    }
  }
  private _initBoard(targetWord: string): string {
    let board = '';
    for (let i = 0; i < targetWord.length; i++) {
        board += '_';
    }
    return board;
  }
}
import GameAreaController, { GameEventTypes } from './GameAreaController';
import PlayerController from '../PlayerController';
import { GameArea, GameStatus, HangmanMove } from '../../types/CoveyTownSocket';

export type HangmanGameState = {
  word: string;
  guessedLetters: string[];
  incorrectGuessesLeft: number;
  gamePlayersById: string[];
  status: GameStatus;
  winner?: string;
};

export type HangmanEvents = GameEventTypes & {
  wordChanged: (word: string) => void;
  guessedLettersChanged: (guessedLetters: string[]) => void;
  incorrectGuessesLeftChanged: (incorrectGuessesLeft: number) => void;
  gamePlayersByIdChanged: (gamePlayersById: string[]) => void;
  statusChanged: (status: GameStatus) => void;
  winnerChanged: (winner?: string) => void;
};


export default class HangmanAreaController extends GameAreaController<
  HangmanGameState,
  HangmanEvents
> {
  public isActive(): boolean {
    throw new Error('Method not implemented.');
  }
  protected _gameState: HangmanGameState = {
    word: '',
    guessedLetters: [],
    incorrectGuessesLeft: 6,
    gamePlayersById: [],
    status: 'WAITING_TO_START',
    winner: undefined,
  };

  get word(): string {
    return this._gameState.word;
  }

  get guessedLetters(): string[] {
    return this._gameState.guessedLetters;
  }

  get incorrectGuessesLeft(): number {
    return this._gameState.incorrectGuessesLeft;
  }

  get gamePlayersById(): string[] {
    return this._gameState.gamePlayersById;
  }

  get status(): GameStatus {
    return this._gameState.status;
  }

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
      move: { letter } as unknown as HangmanMove,
    });
  }
}
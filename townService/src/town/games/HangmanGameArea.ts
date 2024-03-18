import InvalidParametersError, { GAME_ID_MISSMATCH_MESSAGE, GAME_NOT_IN_PROGRESS_MESSAGE, INVALID_COMMAND_MESSAGE } from "../../lib/InvalidParametersError";
import { HangmanLetter, HangmanMove, InteractableCommand, InteractableCommandReturnType, InteractableType } from "../../types/CoveyTownSocket";
import GameArea from "./GameArea";
import Player from '../../lib/Player';
import HangmanGame from "./HangmanGame";
import { CommandList } from "twilio/lib/rest/preview/wireless/command";

export default class HangmanGameArea extends GameArea<HangmanGame> {
  // letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  protected getType(): InteractableType {
    return 'HangmanArea';
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    switch (command.type) {
      case 'JoinGame': {
        let { game } = this;
        if (!game || game.state.status === 'OVER') {
          game = new HangmanGame('testword'); // TODO: Implement word generation
          this._game = game;
        }
        this._game?.join(player);
        this._emitAreaChanged();
        return { gameID: this._game?.id } as InteractableCommandReturnType<CommandType>;
      }
      case 'StartGame': {
        this._validateGameId(command.gameID);
        this.game?.startGame(player);
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      case 'GameMove': {
        this._validateGameId(command.gameID);
        
        /* if (!this.letters.includes(command.move.gamePiece)) {
          throw new InvalidParametersError('Invalid game piece');
        } */

        this.game?.applyMove({
          gameID: command.gameID,
          playerID: player.id,
          move: command.move as HangmanMove,
        });
        this._checkGameEnded();
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      case 'LeaveGame': {
        this._validateGameId(command.gameID);
        this.game?.leave(player);
        this._checkGameEnded();
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      default: {
        throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
      }
    }
  }

  private _checkGameEnded() {
    if (this.game !== undefined && this.game?.state.status === 'OVER') {
      const losingPlayerID = this.game.state.gamePlayersById.find(player => player !== this.game?.state.winner)!;
      // TODO: Handle multiple losers
      const losingPlayer = this.occupants.find(player => player.id === losingPlayerID)!;
      const winningPlayer = this.occupants.find(player => player.id === this.game?.state.winner)!;
      this._history.push({
        gameID: this.game.id,
        scores: {
          [winningPlayer.userName]: 1,
          [losingPlayer.userName]: 0,
        },
      });
    }
  }

  private _validateCorrectGameInProgress(gameId: string) {
    this._validateGameId(gameId);
    this._validateGameInProgress();
  }

  private _validateGameInProgress() {
    if (this._game?.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
  }

  private _validateGameId(gameId: string) {
    if (this.game === undefined) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this._game?.id !== gameId) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
  }
}

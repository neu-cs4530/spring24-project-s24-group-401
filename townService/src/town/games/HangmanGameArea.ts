import { CommandList } from 'twilio/lib/rest/preview/wireless/command';
import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import {
  GameInstance,
  HangmanGameState,
  HangmanMove,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import Player from '../../lib/Player';
import HangmanGame from './HangmanGame';

export default class HangmanGameArea extends GameArea<HangmanGame> {
  protected getType(): InteractableType {
    return 'HangmanArea';
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    switch (command.type) {
      case 'JoinGame': {
        let game = this._game;
        if (!game || game.state.status === 'OVER') {
          // No game in progress, make a new one
          game = new HangmanGame('Test');
          this._game = game;
        }
        game.join(player);
        this._emitAreaChanged();
        return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
      }
      case 'StartGame': {
        const game = this._game;
        if (!game) {
          throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
        }
        if (this._game?.id !== command.gameID) {
          throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
        }
        game.startGame(player);
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      case 'GameMove': {
        if (this._game?.id !== command.gameID) {
          throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
        }
        const game = this._game;
        if (!game) {
          throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
        }
        game.applyMove({
          gameID: command.gameID,
          playerID: player.id,
          move: command.move as HangmanMove,
        });
        this._checkGameEnded(game.toModel());
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      case 'LeaveGame': {
        const game = this._game;
        if (!game) {
          throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
        }
        if (this._game?.id !== command.gameID) {
          throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
        }
        game.leave(player);
        this._checkGameEnded(game.toModel());
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      }
      default: {
        throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
      }
    }
  }

  private _checkGameEnded(updatedState: GameInstance<HangmanGameState>) {
    if (updatedState.state.status === 'OVER' && this._game) {
      const gameID = this._game.id;
      const losingPlayerID = updatedState.state.gamePlayersById.find(
        player => player !== updatedState.state.winner,
      )!;
      // TODO: Handle multiple losers
      const losingPlayer = this.occupants.find(player => player.id === losingPlayerID)!;
      const winningPlayer = this.occupants.find(player => player.id === this.game?.state.winner)!;
      this._history.push({
        gameID,
        scores: {
          [winningPlayer.userName]: 1,
          [losingPlayer.userName]: 0,
        },
      });
    }
  }
}

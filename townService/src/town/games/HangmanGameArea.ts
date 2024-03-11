import { InteractableCommand, InteractableCommandReturnType, InteractableType, Player } from "../../types/CoveyTownSocket";
import GameArea from "./GameArea";
import HangmanGame from "./HangmanGame";

export default class HangmanGameArea extends GameArea<HangmanGame> {
    protected getType(): InteractableType {
        throw new Error("Method not implemented.");
    }
    public handleCommand<CommandType extends InteractableCommand>(command: CommandType, player: Player): InteractableCommandReturnType<CommandType> {
        throw new Error("Method not implemented.");
    }
}

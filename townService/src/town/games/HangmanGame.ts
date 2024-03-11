import Player from '../../lib/Player';
import { GameMove, HangmanGameState, HangmanMove } from '../../types/CoveyTownSocket';
import Game from './Game';


/**
 * A HangmanGame is a game that implements the rules of Hangman.
 * @see https://en.wikipedia.org/wiki/Hangman_(game)
 */


export default class HangmanGame extends Game<HangmanGameState, HangmanMove> {
    protected _leave(player: Player): void {
        throw new Error('Method not implemented.');
    }

    public applyMove(move: GameMove<HangmanMove>) {
        throw new Error('Method not implemented.');
    }
    
    protected _join(player: Player) {
        throw new Error('Method not implemented.');
    }
}
import InvalidParametersError, { GAME_FULL_MESSAGE, PLAYER_ALREADY_IN_GAME_MESSAGE } from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, HangmanGameState, HangmanMove } from '../../types/CoveyTownSocket';
import Game from './Game';


/**
 * A HangmanGame is a game that implements the rules of Hangman.
 * @see https://en.wikipedia.org/wiki/Hangman_(game)
 */


export default class HangmanGame extends Game<HangmanGameState, HangmanMove> {
    // a list of playerIDs of all Players currently in the game 
    private allPlayers: Array<String>;
    private maxPlayersAllowed = 10;
    public constructor(targetWord: String) {
        // word to be guessed
        super({
            status: 'WAITING_TO_START',
            word: 'testWord',
            guessedLetters: [],
            maxIncorrectGuesses: 6,
            incorrectGuesses: 0,
        });
        this.allPlayers = [];
    }
    protected _leave(player: Player): void {
        throw new Error('Method not implemented.');
    }

    public applyMove(move: GameMove<HangmanMove>) {
        throw new Error('Method not implemented.');
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
        if (this.allPlayers.length === this.maxPlayersAllowed) {
            throw new InvalidParametersError(GAME_FULL_MESSAGE);
        }
        if (this.allPlayers.includes(player.id)) {
            throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
        }
        if (this.allPlayers.length === 0) {
            this.allPlayers.push(player.id);
            return;
        }
    }
}
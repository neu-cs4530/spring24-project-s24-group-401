import React, { useEffect, useState } from 'react';
import HangmanAreaController from '../../../../classes/interactable/HangmanAreaController';
import PlayerController from '../../../../classes/PlayerController';
import { useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import HangmanBoard from './HangmanBoard';
import { Button, List, ListItem, SliderMark, useToast } from '@chakra-ui/react';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb, Box, Text } from '@chakra-ui/react';

/**
 * The HangmanArea component renders the Hangman game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the HangmanAreaController to get the current state of the game.
 * It listens for the 'gameUpdated' and 'gameEnd' events on the controller, and re-renders accordingly.
 * It subscribes to these events when the component mounts, and unsubscribes when the component unmounts. It also unsubscribes when the gameAreaController changes.
 *
 * It renders the following:
 * - A list of players' usernames (in a list with the aria-label 'list of players in the game')
 *    - If there is no player in the game, the username is '(No player yet!)'
 *    - List the players as UNSURE OF WHAT TO LIST THE PLAYERS AS
 * - A message indicating the current game status:
 *    - If the game is in progress, the message is 'Game in progress, {moveCount} moves in, currently {whoseTurn}'s turn'. If it is currently our player's turn, the message is 'Game in progress, {moveCount} moves in, currently your turn'
 *    - If the game is in status WAITING_FOR_PLAYERS, the message is 'Waiting for players to join'
 *    - If the game is in status WAITING_TO_START, the message is 'Waiting for players to press start'
 *    - If the game is in status OVER, the message is 'Game over'
 * - If the game is in status WAITING_FOR_PLAYERS or OVER, a button to join the game is displayed, with the text 'Join New Game'
 *    - Clicking the button calls the joinGame method on the gameAreaController
 *    - Before calling joinGame method, the button is disabled and has the property isLoading set to true, and is re-enabled when the method call completes
 *    - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *    - Once the player joins the game, the button dissapears
 * - If the game is in status WAITING_TO_START, a button to start the game is displayed, with the text 'Start Game'
 *   - Clicking the button calls the startGame method on the gameAreaController
 *   - Before calling startGame method, the button is disabled and has the property isLoading set to true, and is re-enabled when the method call completes
 *   - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *   - Once the game starts, the button dissapears
 * - The HangmanBoard component, which is passed the current gameAreaController as a prop (@see HangmanBoard.tsx)
 *
 * - When the game ends, a toast is displayed with the result of the game:
 *    - Our player won: description 'You won!'
 *    - Our player lost: description 'You lost :('
 *
 */

export default function HangmanArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController = useInteractableAreaController<HangmanAreaController>(interactableID);
  const townController = useTownController();

  const [players, setPlayers] = useState<PlayerController[]>(
    gameAreaController.playersByController,
  );
  const [joiningGame, setJoiningGame] = useState(false);
  const [wordLength, setWordLength] = useState(5);
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [incorrectGuessesLeft, setIncorrectGuessesLeft] = useState<number>(
    gameAreaController.incorrectGuessesLeft,
  );
  const toast = useToast();
  useEffect(() => {
    console.log(gameStatus);
    const updateGameState = () => {
      setPlayers(gameAreaController.playersByController);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setIncorrectGuessesLeft(gameAreaController.incorrectGuessesLeft);
    };
    const onGameEnd = () => {
      const winner = gameAreaController.winner;
      if (winner !== undefined && winner !== 'NO_WINNER') {
        if (winner === townController.ourPlayer.id) {
          toast({
            title: 'Game over',
            description: 'Congrats, you won!',
            status: 'info',
          });
        } else {
          toast({
            title: 'Game over',
            description: 'You lost :(. The winner is ' + winner + '!',
            status: 'info',
          });
        }
      } else if (winner === 'NO_WINNER') {
        toast({
          title: 'Game over',
          description: 'You lost :(',
          status: 'info',
        });
      }
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    gameAreaController.addListener('gameEnd', onGameEnd);
    gameAreaController.addListener('incorrectGuessesLeftChanged', setIncorrectGuessesLeft);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
      gameAreaController.removeListener('incorrectGuessesLeftChanged', setIncorrectGuessesLeft);
    };
  }, [townController, gameAreaController, toast, gameStatus, incorrectGuessesLeft]);
  let gameStatusText = <></>;
  const joinGameButton = (
    <Button
      onClick={async () => {
        setJoiningGame(true);
        try {
          await gameAreaController.joinGame();
        } catch (err) {
          toast({
            title: 'Error joining game',
            description: (err as Error).toString(),
            status: 'error',
          });
        }
        setJoiningGame(false);
      }}
      isLoading={joiningGame}
      disabled={joiningGame}>
      Join Game
    </Button>
  );
  if (gameStatus === 'IN_PROGRESS') {
    gameStatusText = (
      <>
        Game in progress, {incorrectGuessesLeft} incorrect guesses left, currently{' '}
        {gameAreaController.isOurTurn ? 'your ' : gameAreaController.whoseTurn + "'s "}
        turn{' '}
      </>
    );
  } else if (gameStatus == 'WAITING_TO_START') {
    const startGameButton = (
      <Button
        onClick={async () => {
          setJoiningGame(true);
          try {
            await gameAreaController.startGame();
          } catch (err) {
            toast({
              title: 'Error starting game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setJoiningGame(false);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Start Game
      </Button>
    );
    gameStatusText = (
      <b>
        Waiting for players to press start. {joinGameButton} {startGameButton}
      </b>
    );
  } else {
    townController.emitNum(wordLength, interactableID);
    console.log('emitting word length' + wordLength);
    const difficultySlider = (
      <Box my={4}>
        <Text mb={2}>Adjust Word Length:</Text>
        <Slider
          defaultValue={5}
          value={wordLength}
          onChange={(value: number) => setWordLength(value)}
          min={3}
          max={10}
          step={1}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
          {[3, 4, 5, 6, 7, 8, 9, 10].map(mark => (
            <SliderMark
              key={mark}
              value={mark}
              mt='1' // margin top for the label
              ml='-2.5' // margin left to align the label with the mark
              fontSize='sm'>
              {mark}
            </SliderMark>
          ))}
        </Slider>
      </Box>
    );
    let gameStatusStr;
    if (gameStatus === 'OVER') gameStatusStr = 'over';
    else if (gameStatus === 'WAITING_FOR_PLAYERS') gameStatusStr = 'waiting for players to join';
    gameStatusText = (
      <b>
        Game {gameStatusStr}. {joinGameButton} {difficultySlider}
      </b>
    );
  }
  if (players.length === 0) {
    return (
      <>
        {gameStatusText}
        <List aria-label='list of players in the game' data-testid='listofplayers'>
          <ListItem>No players in game yet!</ListItem>
        </List>
        <HangmanBoard gameAreaController={gameAreaController} />
      </>
    );
  } else {
    return (
      <>
        {gameStatusText}
        <List aria-label='list of players in the game' data-testid='listofplayers'>
          {players.map((player: PlayerController, index) => {
            if (player) {
              return (
                <ListItem key={player.id}>
                  Player{index + 1}: {player.userName}
                </ListItem>
              );
            }
          })}
        </List>
        <HangmanBoard gameAreaController={gameAreaController} />
      </>
    );
  }
}

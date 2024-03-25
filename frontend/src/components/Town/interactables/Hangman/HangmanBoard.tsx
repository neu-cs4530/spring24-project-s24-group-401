import ConnectFourAreaController, {
  ConnectFourCell,
} from '../../../../classes/interactable/ConnectFourAreaController';
import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ConnectFourColIndex, HangmanLetter } from '../../../../types/CoveyTownSocket';
import HangmanAreaController, {
  HangmanCell,
} from '../../../../classes/interactable/HangmanAreaController';

const head = (
  <div
    style={{
      width: '50px',
      height: '50px',
      borderRadius: '100%',
      border: '10px solid black',
      position: 'absolute',
      top: '20px',
      right: '200px',
    }}
  />
);

const body = (
  <div
    style={{
      width: '10px',
      height: '50px',
      background: 'black',
      position: 'absolute',
      top: '65px',
      right: '220px',
    }}
  />
);

const rightArm = (
  <div
    style={{
      width: '50px',
      height: '10px',
      background: 'black',
      position: 'absolute',
      top: '85px',
      right: '168px',
      rotate: '-30deg',
      transformOrigin: 'left bottom',
    }}
  />
);

const leftArm = (
  <div
    style={{
      width: '50px',
      height: '10px',
      background: 'black',
      position: 'absolute',
      top: '85px',
      right: '230px',
      rotate: '30deg',
      transformOrigin: 'right bottom',
    }}
  />
);

const rightLeg = (
  <div
    style={{
      width: '65px',
      height: '10px',
      background: 'black',
      position: 'absolute',
      top: '105px',
      right: '160px',
      rotate: '60deg',
      transformOrigin: 'left bottom',
    }}
  />
);

const leftLeg = (
  <div
    style={{
      width: '65px',
      height: '10px',
      background: 'black',
      position: 'absolute',
      top: '105px',
      right: '223px',
      rotate: '-60deg',
      transformOrigin: 'right bottom',
    }}
  />
);

const BODY_PARTS = [head, body, rightArm, leftArm, rightLeg, leftLeg];

const StyledHangmanBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    justifyContent: 'center',
    width: 'auto',
    padding: '5px',
  },
});

const StyledHangmanSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '40px',
    height: '60px',
    border: '2px solid',
    borderColor: 'black',
    fontSize: '30px',
    margin: '5px',
    _disabled: {
      opacity: '100%',
    },
  },
});

export type HangmanGameProps = {
  gameAreaController: HangmanAreaController;
};

/**
 * A component that renders the Hangman board
 *
 * Renders the Hangman board as a "StyledHangmanBoard", which consists of "StyledHangmanSquare"s
 * (one for each letter in the word).
 *
 * Each StyledHangmanSquare has an aria-label property that describes the cell's position in the board.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, they can key press one letter at a time to make a guess and 
 * make a move. If there is an error making the move, then a toast will be displayed with the error
 * message as the description of the toast. If it is not the current player's turn then all key presses
 * will be disabled.
 *
 * @param gameAreaController the controller for the ConnectFour game
 */
export default function HangmanBoard({ gameAreaController }: HangmanGameProps): JSX.Element {
  const [board, setBoard] = useState<HangmanCell[]>(gameAreaController.board);
  const [isOurTurn, setIsOurTurn] = useState(gameAreaController.isOurTurn);
  const toast = useToast();
  useEffect(() => {
    gameAreaController.addListener('turnChanged', setIsOurTurn);
    gameAreaController.addListener('boardChanged', setBoard);

    const handleKeyPress = async (event: KeyboardEvent) => {
      if (!isOurTurn || event.key.length !== 1 || !event.key.match(/[a-z]/i)) {
        // Do not handle non-letter keys or if it's not our turn
        return;
      }
      
      try {
        let guess = event.key.toUpperCase() as HangmanLetter;
        await gameAreaController.makeMove(guess);
      } catch (error) {
        toast({
          title: 'Error making move',
          description: error instanceof Error ? error.toString() : 'Ensure it is your turn and try again.',
          status: 'error',
        });
      }
    };
    // Register the key press event listener
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      gameAreaController.removeListener('boardChanged', setBoard);
      gameAreaController.removeListener('turnChanged', setIsOurTurn);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [gameAreaController]);
  return (
    <StyledHangmanBoard aria-label='Hangman Board'>
      {board.map((letter, index) => (
        <StyledHangmanSquare
          key={index}
          disabled={true} // Disable interaction directly with squares
          aria-label={`Letter ${index + 1} of the word`}>
          {letter || '_'}
        </StyledHangmanSquare>
      ))}
    </StyledHangmanBoard>
  );
}

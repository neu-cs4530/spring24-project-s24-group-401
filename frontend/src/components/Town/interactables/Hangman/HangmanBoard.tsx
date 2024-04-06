import { Button, chakra, Input, Container, useToast, Box } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { HangmanLetter } from '../../../../types/CoveyTownSocket';
import HangmanAreaController, {
  HangmanCell,
} from '../../../../classes/interactable/HangmanAreaController';

export type HangmanFigureProps = {
  incorrectGuessesLeft: number;
};

const BodyPart = ({ isVisible }: { isVisible: boolean }) => (
  <Box
    display={isVisible ? 'block' : 'none'}
    height='20px'
    width='2px'
    backgroundColor='black'
    margin='2px auto'
  />
);

const Arm = ({ isVisible, isLeft }: { isVisible: boolean; isLeft: boolean }) => (
  <Box
    display={isVisible ? 'block' : 'none'}
    height='2px'
    width='20px'
    backgroundColor='black'
    position='absolute'
    top='20px'
    left={isLeft ? '10px' : 'auto'}
    right={isLeft ? 'auto' : '10px'}
  />
);

const Leg = ({ isVisible, isLeft }: { isVisible: boolean; isLeft: boolean }) => (
  <Box
    display={isVisible ? 'block' : 'none'}
    height='2px'
    width='20px'
    backgroundColor='black'
    position='absolute'
    bottom='42px'
    left={isLeft ? '10px' : 'auto'}
    right={isLeft ? 'auto' : '10px'}
    transform={isLeft ? 'rotate(-45deg)' : 'rotate(45deg)'}
    transformOrigin={isLeft ? 'top left' : 'top right'} // Adjusted this line
  />
);

const HangmanFigure = ({ incorrectGuessesLeft }: HangmanFigureProps) => (
  <Container centerContent>
    <Box position='relative' height='100px' width='50px'>
      {/* Head */}
      <Box
        borderRadius='50%'
        border='2px solid'
        borderColor='black'
        width='20px'
        height='20px'
        display={incorrectGuessesLeft <= 5 ? 'block' : 'none'}
        margin='0 auto'
      />
      {/* Body */}
      <BodyPart isVisible={incorrectGuessesLeft <= 4} />
      {/* Arms */}
      <Arm isVisible={incorrectGuessesLeft <= 3} isLeft={true} />
      <Arm isVisible={incorrectGuessesLeft <= 2} isLeft={false} />
      {/* Legs */}
      <Leg isVisible={incorrectGuessesLeft <= 1} isLeft={true} />
      <Leg isVisible={incorrectGuessesLeft <= 0} isLeft={false} />
    </Box>
  </Container>
);

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
  const [incorrectGuessesLeft, setIncorrectGuessesLeft] = useState(
    gameAreaController.incorrectGuessesLeft,
  );
  const [guess, setGuess] = useState('');
  const toast = useToast();
  useEffect(() => {
    gameAreaController.addListener('turnChanged', setIsOurTurn);
    gameAreaController.addListener('boardChanged', setBoard);
    gameAreaController.addListener('incorrectGuessesLeftChanged', setIncorrectGuessesLeft);

    return () => {
      gameAreaController.removeListener('boardChanged', setBoard);
      gameAreaController.removeListener('turnChanged', setIsOurTurn);
      gameAreaController.removeListener('incorrectGuessesLeftChanged', setIncorrectGuessesLeft);
    };
  }, [gameAreaController]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent form submission from reloading the page
    if (!isOurTurn || guess.length !== 1 || !guess.match(/[a-z]/i)) {
      toast({
        title: 'Invalid guess',
        description: 'Please enter a single letter.',
        status: 'warning',
      });
      return;
    }
    try {
      const guessLetter = guess.toUpperCase() as HangmanLetter;
      await gameAreaController.makeMove(guessLetter);
      setGuess(''); // Clear the input field after submitting
    } catch (error) {
      toast({
        title: 'Error making move',
        description: error || 'An error occurred',
        status: 'error',
      });
    }
  };
  return (
    <>
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
      <HangmanFigure incorrectGuessesLeft={incorrectGuessesLeft} />{' '}
      {/* Render HangmanFigure here */}
      <chakra.form onSubmit={handleSubmit} display='flex' justifyContent='center' mt='4'>
        <Input
          placeholder='Enter a letter'
          value={guess}
          onChange={e => setGuess(e.target.value)}
          isDisabled={!isOurTurn}
          maxLength={1} // Limit input to a single character
        />
        <Button
          ml='2'
          colorScheme='blue'
          type='submit'
          isDisabled={!isOurTurn || guess.length !== 1}>
          Guess
        </Button>
      </chakra.form>
    </>
  );
}

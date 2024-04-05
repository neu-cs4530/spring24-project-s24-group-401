import React from 'react';
import { Box, Container } from '@chakra-ui/react';

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
    transformOrigin={isLeft ? 'top left' : 'top right'}
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

export default HangmanFigure;

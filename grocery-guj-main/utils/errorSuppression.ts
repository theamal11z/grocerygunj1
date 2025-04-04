import { LogBox, YellowBox } from 'react-native';

/**
 * Utility to suppress common React Native warnings
 */
export const suppressWarnings = () => {
  // Handle both older and newer versions of React Native
  if (LogBox) {
    LogBox.ignoreLogs([
      'Text strings must be rendered within a <Text> component',
      'Possible Unhandled Promise Rejection',
      'VirtualizedLists should never be nested',
      'Failed prop type',
      'Cannot update a component'
    ]);
  } else if (YellowBox) {
    // For older versions of React Native
    YellowBox.ignoreWarnings([
      'Text strings must be rendered within a <Text> component',
      'Possible Unhandled Promise Rejection',
      'VirtualizedLists should never be nested',
      'Failed prop type',
      'Cannot update a component'
    ]);
  }
  
  // Suppress specific console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Text strings must be rendered') || 
       args[0].includes('Warning: Failed prop type'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
};

export default suppressWarnings; 
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Disable specific warnings globally
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'Possible Unhandled Promise Rejection',
]);

// Import and register the root component
import 'expo-router/entry'; 
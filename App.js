import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import WordListScreen from './src/screens/WordListScreen';

const Stack = createStackNavigator();

const Theme = {
  dark: true,
  colors: {
    primary: '#6366f1',
    background: '#09090b',
    card: '#18181b',
    text: '#fafafa',
    border: '#27272a',
    notification: '#f43f5e',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={Theme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#09090b',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#27272a',
              },
              headerTintColor: '#fafafa',
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
              },
              cardStyle: { backgroundColor: '#09090b' },
            }}
          >
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'Memory Trainer' }}
            />
            <Stack.Screen 
              name="Review" 
              component={ReviewScreen} 
              options={{ title: 'Session' }}
            />
            <Stack.Screen 
              name="AddWord" 
              component={AddWordScreen} 
              options={{ title: 'Add New Word' }}
            />
            <Stack.Screen 
              name="WordList" 
              component={WordListScreen} 
              options={{ title: 'Your Vocabulary' }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {Alert} from 'react-native';

function App(): React.JSX.Element {
  useEffect(() => {
    // Request permissions
    messaging()
      .requestPermission()
      .then(authStatus => {
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) console.log('Notification permission granted.');
      });

    // Get FCM token
    messaging()
      .getToken()
      .then(token => {
        console.log('FCM Token:', token);
        // You can save this token to Firestore to send messages to this user
      });

    // Listen to messages when app is in foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('New Message', remoteMessage.notification?.body);
    });

    return unsubscribe;
  }, []);
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default App;

// type RootStackParamList = {
//   Home: undefined;
//   // Profile: { userId: string };
//   // Feed: { sort: 'latest' | 'top' } | undefined;
// };

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {ActivityIndicator, Alert, View} from 'react-native';
import * as Keychain from 'react-native-keychain';
import AuthScreen from './src/screens/AuthScreen';
import {messaging} from './src/services/firebase';

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();

        if (credentials) {
          console.log('🔐 Token found');
          setIsLoggedIn(true);
        } else {
          console.log('❌ No token');
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

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

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title ?? 'New Message',
        remoteMessage.notification?.body ?? '',
      );
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {<AppNavigator isLoggedin={isLoggedIn} />}
    </NavigationContainer>
  );
}

export default App;

// type RootStackParamList = {
//   Home: undefined;
//   // Profile: { userId: string };
//   // Feed: { sort: 'latest' | 'top' } | undefined;
// };

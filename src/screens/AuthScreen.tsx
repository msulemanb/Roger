import React, {useState} from 'react';
import {View, TextInput, Button, Text, StyleSheet, Alert} from 'react-native';
import {auth, firestore, messaging} from '../services/firebase';
import {AppNavigatorParams} from '../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Keychain from 'react-native-keychain';

type AuthScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Auth'>;
type Props = {navigation?: AuthScreenNavProps};

export default function AuthScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false); // toggle login/signup

  // Signup function
  const handleSignup = async () => {
    try {
      const res = await auth().createUserWithEmailAndPassword(email, password);

      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({
          token,
          uid: res.user.uid,
          email: res.user.email,
        }),
      );

      console.log('BEFORE FIRESTORE');

      await firestore().collection('users').doc(res.user.uid).set({
        email: res.user.email,
        uid: res.user.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      const fcmToken = await messaging().getToken();

      await firestore().collection('users').doc(res.user.uid).set(
        {
          email: res.user.email,
          fcmToken: fcmToken,
        },
        {merge: true},
      );

      console.log('AFTER FIRESTORE');

      console.log('NAVIGATING...');
      navigation?.replace('Home');
    } catch (error: any) {
      console.log(error);
      // console.log('🔥 ERROR:', JSON.stringify(error));
    }
  };

  // Login function
  const handleLogin = async () => {
    try {
      const res = await auth().signInWithEmailAndPassword(email, password);
      console.log('You are login:', res);
      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({
          token,
          uid: res.user.uid,
          email: res.user.email,
        }),
      );

      const fcmToken = await messaging().getToken();

      await firestore().collection('users').doc(res.user.uid).set(
        {
          email: res.user.email,
          fcmToken: fcmToken,
        },
        {merge: true},
      );
      console.log('NAVIGATING...');
      navigation?.replace('Home'); // Go to HomeScreen after login
      // await Keychain.setGenericPassword('userToken', token)
      // used replace because it will remove auth screen from stack
    } catch (error) {
      console.warn(error);

      // Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={isSignup ? 'Sign Up' : 'Login'}
        onPress={isSignup ? handleSignup : handleLogin}
      />

      <Text style={styles.toggleText} onPress={() => setIsSignup(!isSignup)}>
        {isSignup
          ? 'Already have an account? Login'
          : "Don't have an account? Sign Up"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  toggleText: {
    color: 'blue',
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});

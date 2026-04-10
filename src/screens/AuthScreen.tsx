import React, {useState} from 'react';
import {View, TextInput, Button, Text, StyleSheet, Alert} from 'react-native';
import {auth} from '../services/firebase';
import {AppNavigatorParams} from '../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

type AuthScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Auth'>;
type Props = {navigation: AuthScreenNavProps};

export default function AuthScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false); // toggle login/signup

  // Signup function
  const handleSignup = async () => {
    try {
      await auth()
        .createUserWithEmailAndPassword(email, password)
        .then(res => console.log('You are signup:', res));
      // used replace because it will remove auth screen from stack
      navigation.replace('Home'); // Go to HomeScreen after signup
    } catch (error) {
      console.warn(error);
      // Alert.alert(error?.message);
    }
  };

  // Login function
  const handleLogin = async () => {
    try {
      await auth()
        .signInWithEmailAndPassword(email, password)
        .then(res => console.log('You are login:', res));
      // used replace because it will remove auth screen from stack
      navigation.replace('Home'); // Go to HomeScreen after login
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

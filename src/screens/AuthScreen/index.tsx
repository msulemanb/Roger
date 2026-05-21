import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, Text, Alert} from 'react-native';

import {auth, firestore} from '../../services/firebase';
import {AppNavigatorParams} from '../../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Keychain from 'react-native-keychain';

import {buildSearchIndex, checkUsernameAvailability} from './AuthScreen.utils';

import {getStyles} from './Authscreen.styles';
import {useTheme} from '../../theme/useTheme';

/* -------------------- TYPES -------------------- */

type AuthScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Auth'>;

type Props = {
  navigation?: AuthScreenNavProps;
};

/* -------------------- COMPONENT -------------------- */

export default function AuthScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const styles = getStyles(theme);

  /* -------------------- SIGNUP -------------------- */

  const handleSignup = async () => {
    if (!email || !password || !username || !fullName || !confirmPassword) {
      Alert.alert('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const uniqueUsername = await checkUsernameAvailability(
        username,
        firestore,
      );

      const res = await auth().createUserWithEmailAndPassword(
        normalizedEmail,
        password,
      );

      const uid = res.user.uid;

      const searchIndex = buildSearchIndex(
        fullName,
        uniqueUsername,
        normalizedEmail,
      );

      // reserve username
      await firestore().collection('usernames').doc(uniqueUsername).set({
        uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // create user
      await firestore().collection('users').doc(uid).set({
        uid,
        email: normalizedEmail,
        fullName,
        username: uniqueUsername,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        searchIndex,
      });

      // store token
      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({token, uid, email: normalizedEmail}),
      );

      navigation?.replace('Home');
    } catch (error: any) {
      console.log({error});
      Alert.alert(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- LOGIN -------------------- */

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const identifier = email.trim().toLowerCase();

      let loginEmail = identifier;

      // username login support
      if (!identifier.includes('@')) {
        const snapshot = await firestore()
          .collection('users')
          .where('username', '==', identifier)
          .limit(1)
          .get();

        if (snapshot.empty) {
          throw new Error('Username not found');
        }

        const userData = snapshot.docs[0].data();
        loginEmail = userData.email;
      }

      const res = await auth().signInWithEmailAndPassword(loginEmail, password);

      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({
          token,
          uid: res.user.uid,
          email: res.user.email,
        }),
      );

      navigation?.replace('Home');
    } catch (error: any) {
      console.log({error});
      Alert.alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>

        <Text style={styles.subtitle}>
          {isSignup ? 'Sign up to start chatting' : 'Login to continue'}
        </Text>

        {/* FULL NAME */}
        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Enter Full Name (max 19 chars)"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            autoCorrect={false}
            maxLength={19}
          />
        )}

        {/* EMAIL / USERNAME */}
        <TextInput
          style={styles.input}
          placeholder={isSignup ? 'Email' : 'Email or Username'}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType={isSignup ? 'email-address' : 'default'}
        />

        {/* USERNAME */}
        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="default"
          />
        )}

        {/* PASSWORD */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* CONFIRM PASSWORD */}
        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={isSignup ? handleSignup : handleLogin}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* TOGGLE */}
        <TouchableOpacity onPress={() => setIsSignup(prev => !prev)}>
          <Text style={styles.toggle}>
            {isSignup
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

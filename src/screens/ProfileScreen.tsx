import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {auth} from '../services/firebase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppNavigatorParams} from '../navigation/types';
import * as Keychain from 'react-native-keychain';

type ProfileScreenNavProps = NativeStackNavigationProp<
  AppNavigatorParams,
  'Profile'
>;
type Props = {navigation: ProfileScreenNavProps};

export default function ProfileScreen({navigation}: Props) {
  const user = auth().currentUser;

  const handleLogout = () => {
    auth()
      .signOut()
      .then(async () => {
        navigation.replace('Auth'); // back to login/signup
        await Keychain.resetGenericPassword();
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Email: {user.email}</Text>
      <Text>UID: {user.uid}</Text>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 24, marginBottom: 20},
});

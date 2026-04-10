import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import {firestore, auth} from '../services/firebase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppNavigatorParams} from '../navigation/types';

type AddFriendScreenNavProps = NativeStackNavigationProp<
  AppNavigatorParams,
  'AddFriend'
>;
type Props = {navigation: AddFriendScreenNavProps};

export default function AddFriendScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const currentUser = auth().currentUser;

  const handleAddFriend = async () => {
    if (!email) return Alert.alert('Enter email');

    // Check if user exists
    const userSnapshot = await firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userSnapshot.empty) {
      return Alert.alert('User not found');
    }

    const friend = userSnapshot.docs[0].data();

    // Check if chat already exists
    const chatSnapshot = await firestore()
      .collection('chats')
      .where('participants', 'array-contains', currentUser.email)
      .get();

    const existingChat = chatSnapshot.docs.find(doc =>
      doc.data().participants.includes(friend.email),
    );

    if (existingChat) {
      return Alert.alert('Chat already exists');
    }

    // Create new chat
    const chatRef = await firestore()
      .collection('chats')
      .add({
        participants: [currentUser.email, friend.email],
        lastMessage: '',
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    Alert.alert('Chat created');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friend / New Chat</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Create Chat" onPress={handleAddFriend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  title: {fontSize: 20, marginBottom: 20},
  input: {borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 20},
});

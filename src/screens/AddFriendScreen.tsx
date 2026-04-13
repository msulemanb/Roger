import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import {firestore, auth} from '../services/firebase';

export default function AddFriendScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  const currentUser = auth().currentUser;

  // 🔍 Search user
  const searchUser = async () => {
    console.log('1- email', email);
    if (!email) return Alert.alert('Enter email');

    const snapshot = await firestore()
      .collection('users')
      .where('email', '==', email.trim())
      .get();

    console.log('2- snapsot', snapshot);
    if (snapshot.empty) {
      setFoundUser(null);
      return Alert.alert('User not found');
    }

    const doc = snapshot.docs[0];

    const userData = {
      id: doc.id,
      ...doc.data(),
    };
    setFoundUser(userData);
  };

  // ➕ Add friend / create chat
  const addFriend = async () => {
    if (!foundUser) return;

    if (foundUser.id === currentUser?.uid) {
      return Alert.alert("You can't add yourself");
    }

    try {
      // Check existing chat
      const chatSnapshot = await firestore()
        .collection('chats')
        .where('participants', 'array-contains', currentUser?.uid)
        .get();

      const existingChat = chatSnapshot.docs.find(doc =>
        (doc.data().participants || []).includes(foundUser.id),
      );

      if (existingChat) {
        Alert.alert('Chat already exists');
        console.log('foundUser:', foundUser);
        console.log('currentUser:', currentUser);

        navigation.navigate('Chat', {
          chatId: existingChat?.id,
          otherUserId: foundUser.id,
          otherUserEmail: foundUser.email,
          otherUserFcmToken: foundUser.fcmToken ?? '',
        });
        return;
      }

      // Create new chat
      const chatRef = await firestore()
        .collection('chats')
        .add({
          participants: [currentUser?.uid, foundUser.id],
          lastMessage: '',
          createdAt: firestore.FieldValue.serverTimestamp(),
          users: {
            ...(currentUser?.uid
              ? {
                  [currentUser.uid]: {
                    uid: currentUser.uid,
                    email: currentUser.email ?? '',
                  },
                }
              : {}),
            [foundUser.id]: {
              uid: foundUser.id,
              email: foundUser.email,
            },
          },
        });

      Alert.alert('Friend added & chat created');

      console.log('foundUser:', foundUser);
      console.log('currentUser:', currentUser);

      navigation.navigate('Chat', {
        chatId: chatRef.id,
        otherUserId: foundUser.id,
        otherUserEmail: foundUser.email,
        otherUserFcmToken: foundUser.fcmToken ?? '',
      });
    } catch (error: any) {
      console.log(error);
      Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friend</Text>

      <TextInput
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Button title="Search" onPress={searchUser} />

      {foundUser && (
        <View style={styles.result}>
          <Text>{foundUser.email}</Text>
          <Button title="Add Friend" onPress={addFriend} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  title: {fontSize: 20, marginBottom: 20},
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  result: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
});

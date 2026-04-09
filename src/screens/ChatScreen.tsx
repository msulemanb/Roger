import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';
import {firestore, auth} from '../services/firebase';

export default function ChatScreen({route}) {
  const {chatId} = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const currentUser = auth().currentUser;

  // Listen to messages
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        const msgs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setMessages(msgs);
      });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!text) return;

    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        text,
        sender: currentUser.email,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

    // Update lastMessage in chat
    await firestore().collection('chats').doc(chatId).update({
      lastMessage: text,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View
            style={[
              styles.msgContainer,
              item.sender === currentUser.email
                ? styles.myMsg
                : styles.otherMsg,
            ]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},
  msgContainer: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    maxWidth: '70%',
  },
  myMsg: {alignSelf: 'flex-end', backgroundColor: '#DCF8C6'},
  otherMsg: {alignSelf: 'flex-start', backgroundColor: '#ECECEC'},
  inputContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
});

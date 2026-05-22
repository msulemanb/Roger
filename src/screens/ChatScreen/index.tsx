import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useTheme} from '../../theme/useTheme';
import {chatScreenStyles} from './styles';

export default function ChatScreen({route}: any) {
  const {chatId, otherUserId, otherUserFcmToken} = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<any>({});
  const theme = useTheme();
  const styles = chatScreenStyles(theme);

  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth().currentUser;

  /* ---------------- REALTIME MESSAGES ---------------- */

  useEffect(() => {
    const unsub = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snap => {
        const msgs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

    return unsub;
  }, [chatId]);

  /* ---------------- REALTIME TYPING ---------------- */

  useEffect(() => {
    const unsub = firestore()
      .collection('chats')
      .doc(chatId)
      .onSnapshot(doc => {
        const data = doc.data();
        setTypingUsers(data?.typing || {});
      });

    return unsub;
  }, [chatId]);

  const someoneTyping = Object.entries(typingUsers).some(
    ([uid, val]) => uid !== currentUser?.uid && val,
  );

  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async () => {
    if (!text.trim() || !currentUser?.uid) return;

    const messageText = text.trim();

    // optimistic UI
    setText('');
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        text: messageText,
        senderId: currentUser.uid,
        createdAt: new Date(),
      },
    ]);

    try {
      const msgRef = firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages');

      await msgRef.add({
        text: messageText,
        senderId: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // 🔥 update chat preview
      await firestore().collection('chats').doc(chatId).update({
        lastMessage: messageText,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // optional push
      if (otherUserFcmToken) {
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            Authorization: 'key=YOUR_SERVER_KEY',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: otherUserFcmToken,
            notification: {
              title: 'New Message',
              body: messageText,
            },
          }),
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  /* ---------------- TYPING (THROTTLED) ---------------- */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTyping(text.length > 0);
    }, 400);

    return () => clearTimeout(timeout);
  }, [text]);

  const setTyping = async (typing: boolean) => {
    if (!currentUser?.uid) return;

    await firestore()
      .collection('chats')
      .doc(chatId)
      .set(
        {
          typing: {
            [currentUser.uid]: typing,
          },
        },
        {merge: true},
      );
  };

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        renderItem={({item}) => {
          const isMe = item.senderId === currentUser?.uid;

          return (
            <View style={[styles.msgRow, isMe ? styles.right : styles.left]}>
              <View
                style={[styles.bubble, isMe ? styles.myMsg : styles.otherMsg]}>
                <Text style={{color: '#fff'}}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Typing indicator */}
      {someoneTyping && <Text style={styles.typing}>Typing...</Text>}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={val => {
            setText(val);
            setTyping(val.length > 0);
          }}
          placeholder="Type message..."
          style={styles.input}
        />

        <TouchableOpacity style={styles.btn} onPress={sendMessage}>
          <Text style={{color: '#fff'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

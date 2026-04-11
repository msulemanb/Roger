import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {messaging} from '../services/firebase';

export default function ChatScreen({route}: any) {
  const {chatId, otherUserId, otherUserFcmToken} = route.params;

  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const currentUser = auth().currentUser;

  useEffect(() => {
    const saveToken = async () => {
      const token = await messaging().getToken();

      await firestore().collection('users').doc(currentUser?.uid).set(
        {
          fcmToken: token,
        },
        {merge: true},
      );
    };

    if (currentUser?.uid) {
      saveToken();
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: false});
    }, 300);

    return () => clearTimeout(timer);
  }, [messages]);

  // 🔥 REAL-TIME MESSAGES
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    const unsub = firestore()
      .collection('chats')
      .doc(chatId)
      .onSnapshot(doc => {
        const data = doc.data();
        // const typing = data?.typing || {};

        const typingUsers = data?.typing || {};

        const someoneElseTyping = Object.entries(typingUsers).some(
          ([uid, isTyping]) => uid !== currentUser?.uid && isTyping,
        );

        setIsTyping(someoneElseTyping);
      });

    return unsub;
  }, [chatId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTyping(text.length > 0);
    }, 400);

    return () => clearTimeout(timeout);
  }, [text]);

  // 📤 SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;

    console.log('send message - > 1', {
      chatId,
      text,
      senderEmail: currentUser?.email,
      senderId: currentUser?.uid, // ADD THIS
      receiverId: otherUserId, // ADD THIS
      receiverFcmToken: otherUserFcmToken,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        text,
        senderEmail: currentUser?.email,
        senderId: currentUser?.uid, // ADD THIS
        receiverId: otherUserId, // ADD THIS
        receiverFcmToken: otherUserFcmToken,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    setText('');
    setTyping(false);
  };

  const handleScroll = (e: any) => {
    const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;

    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setShowScrollBtn(!isBottom);
  };

  const handleFocus = () => {
    console.log('focus');
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: false});
    }, 300);

    return () => clearTimeout(timer);
  };

  const setTyping = async (typing: boolean) => {
    await firestore()
      .collection('chats')
      .doc(chatId)
      .set(
        {
          typing: {
            [currentUser?.uid || '']: typing,
          },
        },
        {merge: true},
      );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const isMe = item.senderEmail === currentUser?.email;

          return (
            <View
              style={[styles.message, isMe ? styles.myMsg : styles.otherMsg]}>
              <Text style={{color: 'white'}}>{item.text}</Text>
            </View>
          );
        }}
        onScroll={handleScroll}
        scrollEventThrottle={18}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: false})
        }
      />

      {showScrollBtn && (
        <TouchableOpacity
          onPress={() => {
            flatListRef.current?.scrollToEnd({animated: true});
            setShowScrollBtn(false);
          }}
          style={styles.bottomScrollButton}>
          <Text style={styles.bottomScrollArrow}>↓</Text>
        </TouchableOpacity>
      )}

      <View style={{paddingLeft: 10}}>
        {isTyping && (
          <Text style={{color: 'gray', marginBottom: 5}}>Typing...</Text>
        )}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={val => {
            setText(val);
            setTimeout(() => {
              setTyping(val.length > 0);
            }, 300);
          }}
          placeholder="Type message..."
          autoCorrect={false}
          onFocus={handleFocus}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},

  message: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: '70%',
  },

  myMsg: {
    alignSelf: 'flex-end',
    backgroundColor: 'green',
  },

  otherMsg: {
    alignSelf: 'flex-start',
    backgroundColor: 'gray',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    marginRight: 10,
    padding: 8,
    borderRadius: 8,
  },
  bottomScrollButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    backgroundColor: 'orange',
    padding: 12,
    borderRadius: 25,
    elevation: 5,
  },
  bottomScrollArrow: {color: 'white', fontSize: 16},
});

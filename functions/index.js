const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendMessageNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const msg = snap.data();

    const token = msg.receiverFcmToken;

    if (!token) return null;

    return admin.messaging().send({
      token,
      notification: {
        title: 'New Message',
        body: msg.text,
      },
      data: {
        chatId: context.params.chatId,
      },
    });
  });

// const functions = require('firebase-functions');
// const admin = require('firebase-admin');

// admin.initializeApp();

// // 🔔 SEND PUSH ON NEW MESSAGE
// exports.sendNotificationOnMessage = functions.firestore
//   .document('chats/{chatId}/messages/{messageId}')
//   .onCreate(async (snapshot, context) => {
//     const message = snapshot.data();

//     const receiverId = message.receiverId;

//     if (!receiverId) return null;

//     // 🔥 Get receiver token
//     const userDoc = await admin
//       .firestore()
//       .collection('users')
//       .doc(receiverId)
//       .get();

//     const userData = userDoc.data();

//     const token = userData?.fcmToken;

//     if (!token) return null;

//     // 📩 Send notification
//     await admin.messaging().send({
//       token,
//       notification: {
//         title: 'New Message',
//         body: message.text || 'You have a new message',
//       },
//     });

//     return null;
//   });

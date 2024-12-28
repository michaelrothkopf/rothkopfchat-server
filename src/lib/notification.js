import fetch from 'node-fetch';

/**
 * Sends a push notification through the expo API to a client
 * @param {string} token The expo push token to send the notification to
 * @param {string} title The notification title text
 * @param {string} body The notification body text
 * @returns Once the push notification request is sent
 */
export const pushNotification = async (token, title, body) => {
  // If the token is invalid
  if (!token || typeof token !== 'string') {
    // Return
    return;
  }
  
  // Send the push notification
  return await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: {},
    }),
  });
}

/**
 * Sends a push notification for a new chat to a user
 * @param {string} token The expo push token
 * @param {string} chat The chat in which the new message was sent
 * @returns Once the push notification request is sent
 */
export const sendNewMessageNotification = async (token, chat) => {
  return await pushNotification(token, 'New message', `New message in ${chat}`);
}
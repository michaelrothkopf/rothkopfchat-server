import mongoose from "mongoose";
import { Chat } from "../../models/chat.model.js";
import RSAKey from "react-native-rsa-expo";
import { User } from "../../models/user.model.js";
import { Server, Socket } from "socket.io";
import { Group } from "../../models/group.model.js";
import fetch from 'node-fetch';
import { sendNewMessageNotification } from "../notification.js";
import logger from "../logger.js";
import { v4 as uuidv4 } from 'uuid';
import { transportServer } from "../../index.js";
import { Image } from "../../models/image.model.js";
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';
import { MEDIA_IMAGE_PATH } from "../../routes/media.js";
import { descaleImage } from "../image.js";
const config = JSON.parse(fs.readFileSync(path.resolve('./config.json')));

const NUM_CLIENT_MESSAGES = 100;
// Minimum time between notifications for a specific chat (3 seconds)
const MIN_TIME_BETWEEN_NOTIFICATIONS = 1000 * 3;

// A cache of all the chats and the last time each user was notified in that chat
const clientNotificationDelayCache = {};

/**
 * Represents a live client connected to the server.
 */
export default class Client {
  /**
   * Creates a new empty Client
   * @param {Server} io The Socket.IO server
   */
  constructor(io) {
    // Set the data for the client information
    this.io = io;
    this.sessionToken = null;
  }

  /**
   * Initializes the socket handlers for events.
   * @param {Socket} socket The socket represented by this client
   * @param {User} user The user the client is logged in as
   * @param {Group} group The group the user is in
   * @param {string} sessionToken The session token of the socket connection
   */
  initialize(socket, user, group, sessionToken) {
    this.socket = socket;
    this.user = user;
    this.group = group;
    this.sessionToken = sessionToken;

    // Add the various handlers
    this.socket.on('chatlist:get', (payload) => {
      this.getChatlist(payload);
    });
    this.socket.on('message:create', (payload) => {
      this.createMessage(payload);
    });
    this.socket.on('image_message:create', (payload) => {
      this.createImageMessage(payload);
    });
    this.socket.on('chat_users_status:get', (payload) => {
      this.getChatUsersStatus(payload);
    });
    // This is the updated version of chat_users_status which accounts for some design flaws in the original function
    this.socket.on('chat_online_status:get', (payload) => {
      this.getChatOnlineStatus(payload);
    });
  }

  async update() {
    // Messages sent since last login
    const chatData = {};

    // Query the chats the user is in
    for (const chatId of this.group.chats) {
      // Query the chat
      const chat = await Chat.findById(chatId);

      // If the chat doesn't exist
      if (!chat) {
        // Continue to next chat
        continue;
      }

      // Set the chat data to contain the title and a blank array for processing the messages
      chatData[chatId] = {
        title: chat.title,
        messages: [],
      };

      // Get the last NUM_CLIENT_MESSAGES messages from the chat
      const msgs = chat.messages.slice(-NUM_CLIENT_MESSAGES);

      // For each selected message
      for (const msg of msgs) {
        // If the message contains an image attachment
        if (msg.image !== null) {
          // Get the image
          const attachmentImage = await Image.findById(msg.image);

          // If the image does not exist
          if (!attachmentImage) {
            // Continue to the next message
            continue;
          }

          // Send the message with the image data
          chatData[chatId].messages.push({
            _id: msg._id,
            // Add the data in the format that GiftedChat uses to render messages
            text: msg.text,
            createdAt: msg.timestamp,
            image: `http://${config.serverUrl}/api/v1/media/image/${attachmentImage.resourceId}/${this.sessionToken}`,
            user: {
              _id: msg.sender,
              name: msg.nickname,
            },
          });
        }
        else {
          // Reformat each message to a client-friendly format and add it to the data
          chatData[chatId].messages.push({
            _id: msg._id,
            // Add the data in the format that GiftedChat uses to render messages
            text: msg.text,
            createdAt: msg.timestamp,
            user: {
              _id: msg.sender,
              name: msg.nickname,
            },
          });
        }
      }

      // Reverse the order of the chat messages
      chatData[chatId].messages.reverse();
    }

    // Update the user's last login
    this.user.lastLogin = new Date();
    await this.user.save();

    // Send the new messages to the user
    this.socket.emit('loginstatusupdate', { chatData: chatData, sessionToken: this.sessionToken, userId: this.user._id, nickname: this.user.name, rank: this.user.rank, isAdminGroup: this.group.name === 'Admin Group Group' });
  }

  async getChatlist(payload) {
    // If the session token is invalid
    if (payload.sessionToken !== this.sessionToken) {
      // Respond and return
      logger.debug(`[AUTH] Invalid session token for user ${this.user.name} (UID: ${this.user._id}).`);
      this.socket.emit('authfailure', 'Invalid session token.');
      return;
    }

    // List of chats
    const chats = [];

    // Query the chats the user is in
    for (const chatId of this.group.chats) {
      // Query the chat
      const chat = await Chat.findById(chatId);

      // If the chat doesn't exist
      if (!chat) {
        // Continue to next chat
        continue;
      }

      // Add the chat to the list
      chats.push({
        id: chat._id,
        title: chat.title,
      });
    }

    // Send the data to the client
    this.socket.emit('chatlist:data', chats);
  }

  async createImageMessage(payload) {
    // If the session token is invalid
    if (payload.sessionToken !== this.sessionToken) {
      // Respond and return
      logger.debug(`[AUTH] Invalid session token for user ${this.user.name} (UID: ${this.user._id}).`);
      this.socket.emit('authfailure', 'Invalid session token.');
      return;
    }

    // Parse the base64 image data into a buffer
    const imageData = Buffer.from(payload.contents.image, 'base64');

    // Get the hash of the image data
    const idHash = crypto.createHash('sha256').update(imageData).digest('hex');
    // Find another image with the same hash in the database
    const dupeCheckImage = await Image.findOne({ contentHash: idHash });
    // If such an image exists, use that image instead of reuploading the same one
    if (dupeCheckImage !== null) {
      // Get the chat in which the message was uploaded
      const chat = await Chat.findById(payload.contents.chatId);

      // Create a message, passing in the optional image parameter
      return await this.createMessage({
        contents: {
          chat: chat._id,
          text: '',
        }
      }, dupeCheckImage);
    }
    // Otherwise, upload the image as normal

    // Generate a resource ID for the image
    const resourceId = uuidv4();

    // Write the image to file
    try {
      fs.writeFileSync(path.resolve(MEDIA_IMAGE_PATH + `/${resourceId}.${payload.contents.extension}`), await descaleImage(imageData));
    } catch (e) {
      logger.debug(`[MEDIA] Error writing file at path "${path.resolve(MEDIA_IMAGE_PATH + `/${resourceId}.${payload.contents.extension}`)}"\nE: ${e}`);
      return;
    }

    const imageRecord = new Image({
      createdAt: new Date(),
      createdBy: this.user._id,
      resourceId: resourceId,
      extension: payload.contents.extension,
      contentHash: idHash,
    });

    // Save the image record to create an ObjectId
    await imageRecord.save();

    // Get the chat in which the message was uploaded
    const chat = await Chat.findById(payload.contents.chatId);

    // Create a message, passing in the optional image parameter
    await this.createMessage({
      contents: {
        chat: chat._id,
        text: '',
      }
    }, imageRecord);
  }

  async createMessage(payload, imageAttachment=null) {
    // If the session token is invalid
    if (payload.sessionToken !== this.sessionToken && imageAttachment === null) {
      // Respond and return
      logger.debug(`[AUTH] Invalid session token for user ${this.user.name} (UID: ${this.user._id}).`);
      this.socket.emit('authfailure', 'Invalid session token.');
      return;
    }

    // If the user is not in the chat
    if (this.group.chats.indexOf(payload.contents.chat) < 0) {
      logger.notice(`[AUTH] User ${this.user.name} (UID: ${this.user._id}) attempted to send a message to chat ${payload.contents.chat} without authorization.`);
      // Fail
      this.socket.emit('message:send:failure', 'You do not have access to this chat!');
      return;
    }

    // Validate the chat
    const chat = await Chat.findById(payload.contents.chat);

    // If the chat doesn't exist, fail
    if (!chat) {
      logger.debug(`[CHAT] User ${this.user.name} (UID: ${this.user._id}) attempted to send a message to chat ${payload.contents.chat}, which does not exist.`);
      this.socket.emit('message:send:failure', 'Chat does not exist!');
      return;
    }
    
    // If the message data does not exist and there is no image
    if (!payload.contents.text && imageAttachment === null) {
      logger.debug(`[CHAT] User ${this.user.name} (UID: ${this.user._id}) attempted to send a message to chat ${payload.contents.chat} with no text.`);
      this.socket.emit('message:send:failure', 'The message data does not exist!');
      return;
    }

    // If the message data is not a string and there is no image
    if (typeof payload.contents.text !== 'string' && imageAttachment === null) {
      logger.debug(`[CHAT] User ${this.user.name} (UID: ${this.user._id}) attempted to send a message to chat ${payload.contents.chat} with nonstring text.`);
      this.socket.emit('message:send:failure', 'The message data is invalid!');
      return;
    }

    // Create a message ID
    const messageId = uuidv4();

    logger.info(`[CHAT] User ${this.user.name} (UID: ${this.user._id}) sent a message to chat ${payload.contents.chat} (Image: ${imageAttachment !== null}, ID: ${messageId}).`);

    const encryptedData = [];

    // Create a list of users who have access to the chat
    const usersWithAccess = new Set();

    // For each group that can access the chat
    for (const group of await Group.find({ chats: new mongoose.Types.ObjectId(payload.contents.chat) })) {
      // For each user in the group
      for (const user of await User.find({ group: group._id })) {
        // Add the user to the set
        usersWithAccess.add(user);
      }
    }

    // Create the timestamp so it is uniform between clients
    const timestamp = new Date();

    // Encrypt the data for each user in the access set
    for (const user of usersWithAccess) {
      // Attempt to get the client for the live user
      const client = transportServer.getClient(user._id);

      // If the user is offline
      if (client === null) {
        // If the chat is in the notification cache
        if (chat._id in clientNotificationDelayCache) {
          // If the user has recently been notified
          if (user._id in clientNotificationDelayCache[chat._id]) {
            // If not enough time has passed between notifications in the chat
            if (new Date().getTime() - clientNotificationDelayCache[chat._id][user._id] < MIN_TIME_BETWEEN_NOTIFICATIONS) {
              // Do not send a notification
              logger.debug(`[CHAT] Did not send a notification to user ${user.name} (UID: ${user._id}) about a message in chat "${payload.contents.chat}" due to delay less than ${MIN_TIME_BETWEEN_NOTIFICATIONS}ms.`);
              continue;
            }
            // Otherwise enough time has passed, send the notification
            else {
              logger.debug(`[CHAT] Sent a notification to user ${user.name} (UID: ${user._id}) about a message in chat "${payload.contents.chat}".`);
              // Send a push notification about the new message
              await sendNewMessageNotification(user.expoPushToken, chat.title);
              // Mark the user in the cache
              clientNotificationDelayCache[chat._id][user._id] = new Date().getTime();
            }
          }
          // Otherwise, the user is not in the cash and therefore has not recently been notified, send the notification
          else {
            logger.debug(`[CHAT] Sent a notification to user ${user.name} (UID: ${user._id}) about a message in chat "${payload.contents.chat}".`);
            // Send a push notification about the new message
            await sendNewMessageNotification(user.expoPushToken, chat.title);
            // Mark the user in the cache
            clientNotificationDelayCache[chat._id][user._id] = new Date().getTime();
          }
        }
        // Otherwise, the chat is not already in the notification cache and therefore did not recently receive a notification
        else {
          logger.debug(JSON.stringify(clientNotificationDelayCache));
          logger.debug(`[CHAT] Sent a notification to user ${user.name} (UID: ${user._id}) about a message in chat "${payload.contents.chat}".`);
          // Send a push notification about the new message
          await sendNewMessageNotification(user.expoPushToken, chat.title);
          // Add the chat to the cache
          clientNotificationDelayCache[chat._id] = {};
          // Add the user log to the cache
          clientNotificationDelayCache[chat._id][user._id] = new Date().getTime();
        }

        // Do not send the message (skip to the next client)
        continue;
      }

      // If the message contains an image attachment
      if (imageAttachment !== null) {
        // Send the message with the resource access code
        client.socket.emit('message:data', {
          _id: messageId,
  
          // Add the data in the format that GiftedChat uses to render messages
          text: payload.contents.text,
          image: `http://${config.serverUrl}/api/v1/media/image/${imageAttachment.resourceId}/${this.sessionToken}`,
          createdAt: timestamp,
          user: {
            _id: this.user._id,
            name: this.user.name.toString()
          },
  
          // Include the chat ID for client MessagingHandler processing
          chat: chat._id,
        });
      }
      else {
        // Send the message to the online user in a client-friendly format
        client.socket.emit('message:data', {
          _id: messageId,

          // Add the data in the format that GiftedChat uses to render messages
          text: payload.contents.text,
          // attachment: payload.contents.attachment,
          createdAt: timestamp,
          user: {
            _id: this.user._id,
            name: this.user.name.toString()
          },

          // Include the chat ID for client MessagingHandler processing
          chat: chat._id,
        });
      }
    }

    // Create a message data object
    const msgData = {
      _id: messageId,
      text: payload.contents.text,
      image: (imageAttachment === null ? null : imageAttachment._id),
      timestamp: timestamp,
      sender: this.user._id,
      nickname: this.user.name,
    };

    // Add the message to the chat
    chat.messages.push(msgData);

    // Save the chat
    await chat.save();
  }

  async getChatUsersStatus(payload) {
    // If the session token is invalid
    if (payload.sessionToken !== this.sessionToken && imageAttachment === null) {
      // Respond and return
      logger.debug(`[AUTH] Invalid session token for user ${this.user.name} (UID: ${this.user._id}).`);
      this.socket.emit('authfailure', 'Invalid session token.');
      return;
    }

    // If the user is not in the chat
    if (this.group.chats.indexOf(payload.contents.chat) < 0) {
      logger.notice(`[AUTH] User ${this.user.name} (UID: ${this.user._id}) attempted to access the users status of chat ${payload.contents.chat} without authorization.`);
      // Fail
      this.socket.emit('chat_users_status:get:failure', 'You do not have access to this chat!');
      return;
    }

    // Create a list of users who have access to the chat
    const usersWithAccess = new Set();

    // For each group that can access the chat
    for (const group of await Group.find({ chats: new mongoose.Types.ObjectId(payload.contents.chat) })) {
      // For each user in the group
      for (const user of await User.find({ group: group._id })) {
        // Add the user to the set
        usersWithAccess.add(user);
      }
    }

    // Create an array of their last logon and logoff times and their nicknames
    const userTimes = [];

    // Populate the array
    for (const user of usersWithAccess) {
      userTimes.push({
        name: user.name,
        lastLogin: user.lastLogin,
        lastLogout: user.lastLogout,
      });
    }

    // Send the data back to the client
    this.socket.emit('chat_users_status:data', userTimes);
  }

  async getChatOnlineStatus(payload) {
    // If the session token is invalid
    if (payload.sessionToken !== this.sessionToken && imageAttachment === null) {
      // Respond and return
      logger.debug(`[AUTH] Invalid session token for user ${this.user.name} (UID: ${this.user._id}).`);
      this.socket.emit('authfailure', 'Invalid session token.');
      return;
    }

    // If the user is not in the chat
    if (this.group.chats.indexOf(payload.contents.chat) < 0) {
      logger.notice(`[AUTH] User ${this.user.name} (UID: ${this.user._id}) attempted to access the users online status of chat ${payload.contents.chat} without authorization.`);
      // Fail
      this.socket.emit('chat_online_status:get:failure', 'You do not have access to this chat!');
      return;
    }

    // Create a list of users who have access to the chat
    const usersWithAccess = new Set();

    // For each group that can access the chat
    for (const group of await Group.find({ chats: new mongoose.Types.ObjectId(payload.contents.chat) })) {
      // For each user in the group
      for (const user of await User.find({ group: group._id })) {
        // Add the user to the set
        usersWithAccess.add(user);
      }
    }

    // Create an array of their last logon and logoff times and their nicknames
    const userTimes = [];

    // Populate the array
    for (const user of usersWithAccess) {
      userTimes.push({
        name: user.name,
        lastLogin: user.lastLogin,
        lastLogout: user.lastLogout,
      });
    }

    // Send the data back to the client
    this.socket.emit('chat_online_status:data', {
      chat: payload.contents.chat,
      userTimes,
    });
  }
}
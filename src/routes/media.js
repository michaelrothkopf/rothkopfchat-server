import express from "express";
import { User } from "../models/user.model.js";
import { headerAuthentication, verifyInitialAuthentication } from "../lib/authentication.js";
import { Group } from "../models/group.model.js";
import { Image } from "../models/image.model.js";
import mongoose from "mongoose";
import { pushNotification } from "../lib/notification.js";
import { transportServer } from "../index.js";
import multer from 'multer';
import * as uuid from 'uuid';
import logger from "../lib/logger.js";
import { Chat } from "../models/chat.model.js";
import fs from 'fs';
import path from 'path';

export const MEDIA_IMAGE_PATH = './media/img';

// Create and export a multer disk storage engine
export const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MEDIA_IMAGE_PATH);
  },
  filename: (req, file, cb) => {
    // Generate an ID for the image
    const resourceId = uuid.v4();

    // Set the image ID in the request object
    file.resourceId = resourceId;

    // Set the file name
    cb(null, `${resourceId}.${file.originalname.split('.').pop()}`);
  },
});

// Create and export a multer interface
export const imageStorageInterface = multer({ storage: imageStorage });

/**
 * Registers the media routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerMediaRoutes = (app) => {
  // Register the fetch media image route
  app.get('/api/v1/media/image/:resourceId/:sessionToken', async (req, res) => {
    // Get the associated image
    const image = await Image.findOne({ resourceId: req.params.resourceId });

    // If the image does not exist
    if (!image) {
      logger.debug(`[MEDIA] User attempted to request an image that does not have a record on the server.`);
      // Return
      return res.status(404).send('Not found!');
    }

    // If the session token does not correspond to an actively online user
    if (!req.params.sessionToken in transportServer.sessionTokens) {
      logger.debug(`[MEDIA] User attempted to request an image with an invalid session token.`);
      // Return
      return res.status(401).send('Invalid session token!');
    }

    // Send the image data
    try {
      logger.debug(`[MEDIA] User successfully requested an image.`);
      return res.status(200).sendFile(path.resolve(`${MEDIA_IMAGE_PATH}/${image.resourceId}.${image.extension}`));
    } catch (e) {
      return res.status(500).send('Internal server error.');
    }
  });

  // Register the upload media image route
  app.post('/api/v1/media/image/upload', headerAuthentication,
    // Middleware prevents uploading the image if the user does not have access to the recipient chat (or, by extension, if the recipient chat does not exist)
    async (req, res, next) => {
      // If the user does not have access to the recipient chat
      if (req.authResult.group.chats.indexOf(req.authResult.contents.chatId) < 0) {
        logger.debug(`[MEDIA] Upload failed; no chat access.`);
        // Break out of the upload
        return;
      }

      // Proceed to the upload step
      return next();
    },
    imageStorageInterface.single('image'), async (req, res) => {
    // Create an image record for the uploaded image
    const imageRecord = new Image({
      createdAt: new Date(),
      createdBy: req.authResult.user._id,
      resourceId: req.file.resourceId,
      extension: req.file.path.split('.').pop(),
    });

    // Save the image record to create an ObjectId
    await imageRecord.save();

    // Get the chat in which the message was uploaded
    const chat = await Chat.findById(req.authResult.contents.chatId);

    // Get the live client related to the user
    const client = transportServer.getClient(req.authResult.user._id);

    // If the client does not exist (the user is offline)
    if (client === null) {
      // Delete the upload
      fs.unlinkSync(path.resolve(req.file.path));

      // Break out of the function
      return;
    }

    // Create a message, passing in the optional image parameter
    await client.createMessage({
      contents: {
        chat: chat._id,
        text: '',
      }
    }, imageRecord);

    /*
    DEVELOPMENT NOTICE

    The imageAttachment parameter in the Client.createMessage function
    is not part of the payload for security reasons. By doing this,
    the server can ensure that only legitemate image upload requests
    are able to send image messages in chats, preventing crashes by
    glitched or malicious client connections.
    */

    logger.debug(req.file.resourceId, req.authResult.user._id);

    res.status(200).send('Success');
  });
}
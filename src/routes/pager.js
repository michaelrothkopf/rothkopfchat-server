import express from "express";
import { User } from "../models/user.model.js";
import { payloadAuthentication, verifyInitialAuthentication } from "../lib/authentication.js";
import { Group } from "../models/group.model.js";
import mongoose from "mongoose";
import { pushNotification } from "../lib/notification.js";
import logger from "../lib/logger.js";

/**
 * Registers the pager routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerPagerRoutes = (app) => {
  // Register the pager route
  app.post('/api/v1/page', payloadAuthentication, async (req, res) => {
    logger.debug(`[SERVER] A client sent a page request.`);

    // Make sure that the body contains a page message
    if (!req.body.contents.message || typeof req.body.contents.message !== 'string') {
      // Return an invalid page
      res.status(404).send({
        message: 'Page must contain a message',
        failed: true,
      });
      return;
    }

    // Make sure that the body contains a page group
    if (!req.body.contents.group || typeof req.body.contents.group !== 'string') {
      // Return an invalid page
      res.status(404).send({
        message: 'Page must contain a group',
        failed: true,
      });
      return;
    }

    // Get the group from the database
    const group = await Group.findOne({ name: req.body.contents.group });

    // If the group doesn't exist
    if (!group) {
      // Return an invalid page
      res.status(404).send({
        message: 'Page referenced an invalid group',
        failed: true,
      });
      return;
    }

    // Trim the message
    const message = req.body.contents.message.trim();

    // Notify the users in the group
    for (const user of await User.find({ group: group._id })) {
      // Send the notification to the user
      pushNotification(user.expoPushToken, 'Urgent Message', message);
    }

    logger.notice(`[SERVER] A page was sent to users in the ${group.name} with contents "${message}" by user ${req.authResult.user.name} (UID: ${req.authResult.user._id}).`);
    // Return a valid page
    res.status(200).send({
      failed: false,
      message: 'Success!'
    });
  });
}
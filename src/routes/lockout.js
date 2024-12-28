import express from "express";
import { User } from "../models/user.model.js";
import { verifyInitialAuthentication } from "../lib/authentication.js";
import { Group } from "../models/group.model.js";
import mongoose from "mongoose";
import { pushNotification } from "../lib/notification.js";
import { transportServer } from "../index.js";

/**
 * Registers the lockout routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerLockoutRoutes = (app) => {
  // Register the lockout route
  app.post('/api/v1/lockout', async (req, res) => {
    logger.notice(`[SERVER] A client sent a lockout request.`);

    // Check the user authentication
    const result = await verifyInitialAuthentication(req.body);

    // If failed
    if (result.failed) {
      // Respond and return
      res.status(401).send({
        message: 'Page must be properly authenticated',
        failed: true,
      });
      return;
    }

    // Set the user's status to locked out
    result.user.locked = true;
    await result.user.save();

    // Disconnect the client from the server
    transportServer.disconnectClient(result.user.id);

    // Notify the users in the Admin Group group of the lockout
    const adminGroup = await Group.findOne({ name: 'Admin Group Group' });

    // For each user in the admin group
    for (const user of User.find({ group: adminGroup._id })) {
      // Send a notification to the user
      pushNotification(user.expoPushToken, 'User locked out', `User ${result.user.name} was locked out automatically`)
    }

    logger.warning(`[SERVER] Successfully self-locked the account for user "${result.user.name}" (UID: ${result.user._id}).`);
    // Send the response to the client
    res.status(200).send({
      failed: false,
      message: 'Successful',
    })
  });
}
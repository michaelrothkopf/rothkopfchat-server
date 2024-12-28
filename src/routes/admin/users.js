import express from "express";
import { User } from "../../models/user.model.js";
import path from "path";
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(path.resolve('./config.json')));
import { Group } from '../../models/group.model.js'
import logger from "../../lib/logger.js";
import { generateUID } from "../../lib/generateUID.js";
import { Chat } from "../../models/chat.model.js";

/**
 * Registers the admin routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerAdminUsersRoutes = (app) => {
  // Register the get users list route
  app.get('/admin/api/v1/get_user_list', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action GET_USER_LIST; invalid admin authentication',
      });
      return;
    }

    // The data for the users
    const userData = [];

    // For each user in the database, add the datum to the array
    for (const user of await User.find()) {
      const groupName = (await Group.findById(user.group)).name;
      userData.push(`${user.name} - ${user.UID} - ${groupName} - Act: ${user.activated} - Lkd: ${user.locked} - LastLog: ${user.lastLogin}`);
    }

    // Send the list to the client
    res.status(200).send({
      userData: userData,
    });
  });

  // Register the add user route
  app.post('/admin/api/v1/add_user', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_USER; bad authentication',
      });
      return;
    }

    // If a username or group was not provided
    if (!req.body.name || !(typeof req.body.name === 'string') || !req.body.group || !(typeof req.body.group === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name or group',
      });
      return;
    }

    // Check that the group provided was valid
    const group = await Group.findOne({ name: req.body.group });

    // If the group does not exist
    if (!group) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid group name',
      });
      return;
    }

    // Generate the user's UID
    const UID = generateUID();

    // Create the user
    const user = new User({
      name: req.body.name,
      group: group._id,
      UID: UID,

      rank: 'Unset',
      activated: false,
      locked: false,
      lastLogin: null,
    });

    // Save the user
    await user.save();
    
    logger.notice(`[ADMIN] Successful admin action ADD_USER for user with name "${req.body.name}".`);
    // Successfully created the user account
    res.status(200).send({
      failed: false,
      message: `Successfully added user with UID ${UID}`,
    });
  });

  // Register the bulk add users route
  app.post('/admin/api/v1/bulk_add_users', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_USER; bad authentication',
      });
      return;
    }

    // If the data were not provided
    if (!req.body.data || !(typeof req.body.data === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid data',
      });
      return;
    }

    try {
      // Split the data into users by row
      const userDataList = req.body.data.trim().split('\n');

      // Create an array of objects to hold the parsed user data
      const userData = [];

      // For each user
      for (const userString of userDataList) {
        // The parsed user data
        const parsedUserData = {};

        // Split the user data into segments by comma
        const userDataSegments = userString.split(',');

        // Set the data points from the segments
        parsedUserData.name = userDataSegments[0];
        parsedUserData.group = userDataSegments[1];

        // Add the parsed user data to the userData array
        userData.push(parsedUserData);
      }

      // Create a cache of group IDs
      const groupIdCache = {};

      // For each user datum
      for (const user of userData) {
        // Set the group to null
        let group = null;

        // If the group is cached
        if (user.group in groupIdCache) {
          // Use that group data
          group = groupIdCache[user.group];
        }
        // Otherwise, cache the group
        else {
          // Get the group
          const retrievedGroup = await Group.findOne({ name: user.group });

          // If the group does not exist
          if (!retrievedGroup) {
            // Error out of the loop
            throw 'Invalid group provided.';
          }

          // Set the group in the cache
          groupIdCache[user.group] = retrievedGroup._id;

          // Set the user group
          group = retrievedGroup;
        }

        // Generate a UID
        const UID = generateUID();

        // Create a new user with the cached group
        const userObj = new User({
          name: user.name,
          group: group,
          UID: UID,

          rank: 'Unset',
          activated: false,
          locked: false,
          lastLogin: null,
        });

        // Save the user
        await userObj.save();

        // Log the creation
        logger.notice(`[ADMIN] Successful admin action BULK_ADD_USER on user ${user.name} with UID ${UID}.`);
      }

      // Send a 200 response to the client
      logger.notice(`[ADMIN] Successful admin action BULK_ADD_USER for ${userData.length} users.`);
      res.status(200).send({
        failed: false,
        message: `Successfully added ${userData.length} users in bulk`,
      });
    } catch (e) {
      logger.notice(`[ADMIN] Server error when bulk adding users: ${e}`);
      // Return server error
      res.status(500).send({
        failed: true,
        message: 'Unknown server error',
      });
      return;
    }
  });

  // Register the lock user route
  app.post('/admin/api/v1/lock_user', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action LOCK_USER; bad authentication',
      });
      return;
    }

    // If a username or UID was not provided
    if (!req.body.name || !(typeof req.body.name === 'string') || !req.body.UID || !(typeof req.body.UID === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name or UID',
      });
      return;
    }

    // Create the user
    const user = await User.findOne({ name: req.body.name, UID: req.body.UID });

    // If the user does not exist
    if (!user) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name or UID',
      });
      return;
    }

    // Lock the user
    user.locked = true;

    // Save the user
    await user.save();
    
    logger.warning(`[ADMIN] Successful admin action LOCK_USER for user with name "${req.body.name}".`);
    // Successfully locked the user account
    res.status(200).send({
      failed: false,
      message: 'Successfully locked user',
    });
  });

  // Register the unlock user route
  app.post('/admin/api/v1/unlock_user', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action UNLOCK_USER; bad authentication',
      });
      return;
    }

    // If a username or UID was not provided
    if (!req.body.name || !(typeof req.body.name === 'string') || !req.body.UID || !(typeof req.body.UID === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name or UID',
      });
      return;
    }

    // Create the user
    const user = await User.findOne({ name: req.body.name, UID: req.body.UID });

    // If the user does not exist
    if (!user) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name or UID',
      });
      return;
    }

    // Unlock the user
    user.locked = false;

    // Save the user
    await user.save();
    
    logger.notice(`[ADMIN] Successful admin action UNLOCK_USER for user with name "${req.body.name}".`);
    // Successfully unlocked the user account
    res.status(200).send({
      failed: false,
      message: 'Successfully unlocked user',
    });
  });

  // Register the set user group route
  app.post('/admin/api/v1/set_user_group', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action SET_USER_GROUP; bad authentication',
      });
      return;
    }

    // If a UID or new group name was not provided
    if (!req.body.UID || !(typeof req.body.UID === 'string') || !req.body.group || !(typeof req.body.group === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid UID or group name',
      });
      return;
    }

    // Find the user
    const user = await User.findOne({ UID: req.body.UID });

    // If the user does not exist
    if (!user) {
      // Return not found
      res.status(404).send({
        failed: true,
        message: 'Malformed request; invalid user UID',
      });
      return;
    }

    // Find the group
    const group = await Group.findOne({ name: req.body.group });

    // If the group does not exist
    if (!group) {
      // Return not found
      res.status(404).send({
        failed: true,
        message: 'Malformed request; invalid group name',
      });
      return;
    }

    // Set the user group
    user.group = group._id;

    // Save the user
    await user.save();
    
    logger.notice(`[ADMIN] Successful admin action SET_USER_GROUP for user with name "${req.body.name}" to group "${req.body.group}".`);
    // Successfully set the user's group
    res.status(200).send({
      failed: false,
      message: 'Successfully set user group',
    });
  });
}
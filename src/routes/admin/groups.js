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
export const registerAdminGroupsRoutes = (app) => {
  // Register the get groups list route
  app.get('/admin/api/v1/get_group_list', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action GET_GROUP_LIST; invalid admin authentication',
      });
      return;
    }

    // The names of the groups
    const groupData = [];

    // For each group in the database, add the name to the array
    for (const group of await Group.find()) {
      // Get the number of users who are in the group
      const userCount = await User.countDocuments({ group: group._id });

      groupData.push(`${group.name} - ${userCount} user${userCount === 1 ? '' : 's'}`);
    }

    // Send the list to the client
    res.status(200).send({
      groupData: groupData,
    });
  });

  // Register the add group route
  app.post('/admin/api/v1/add_group', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_GROUP; bad authentication',
      });
      return;
    }

    // If a group name or city was not provided
    if (!req.body.name || !(typeof req.body.name === 'string') || !req.body.city || !(typeof req.body.city === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid name and/or city',
      });
      return;
    }

    // If a group with the name already exists
    if (await Group.findOne({ name: req.body.name }) !== null) {
      // There is a duplicate, fail the action
      res.status(409).send({
        failed: true,
        message: 'Conflict; a group with the specified name already exists',
      });
      return;
    }

    // Create the group
    const group = new Group({
      name: req.body.name,
      city: req.body.city,
    });

    // Save the group
    await group.save();
    
    logger.notice(`[ADMIN] Successful admin action ADD_GROUP for group with name "${req.body.name}".`);
    // Successfully created the group account
    res.status(200).send({
      failed: false,
      message: `Successfully added group with name ${req.body.name}`,
    });
  });
}
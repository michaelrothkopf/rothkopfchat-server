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
export const registerAdminChatsRoutes = (app) => {
  // Register the get chats list route
  app.get('/admin/api/v1/get_chat_list', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action GET_CHAT_LIST; invalid admin authentication',
      });
      return;
    }

    // The data for the chats
    const chatData = [];

    // For each user in the database, add the datum to the array
    for (const chat of await Chat.find()) {
      // Get the groups that have access to the chat
      const withAccess = await Group.find({ chats: chat._id });

      // Create a string for the names of such groups
      let withAccessNames = '';

      // Populate the string with the names of the groups
      for (const group of withAccess) {
        withAccessNames += group.name + ',';
      }

      // Remove the trailing comma
      withAccessNames = withAccessNames.slice(0, -1);

      // Add the data to the array
      chatData.push(`${chat.title} - ACSS: ${withAccessNames}`);
    }

    // Send the list to the client
    res.status(200).send({
      chatData: chatData,
    });
  });
  
  // Register the add chat route
  app.post('/admin/api/v1/add_chat', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_CHAT; bad authentication',
      });
      return;
    }

    // If a title was not provided
    if (!req.body.title || !(typeof req.body.title === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid chat title',
      });
      return;
    }

    // If there is already a chat with that title
    const dupeCheck = await Chat.findOne({ title: req.body.title });
    if (dupeCheck !== null) {
      // There is a duplicate, fail the action
      res.status(409).send({
        failed: true,
        message: 'Conflict; a chat with the specified name already exists',
      });
      return;
    }

    // Create the chat
    const chat = new Chat({
      title: req.body.title,
      messages: [],
    });

    // Save the chat
    await chat.save();
    
    logger.notice(`[ADMIN] Successful admin action ADD_CHAT for chat with title "${req.body.title}".`);
    // Successfully unlocked the user account
    res.status(200).send({
      failed: false,
      message: 'Successfully created chat',
    });
  });

  // Register the add chat access route
  app.post('/admin/api/v1/add_chat_access', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_USER; bad authentication',
      });
      return;
    }

    // If a title or group was not provided
    if (!req.body.title || !(typeof req.body.title === 'string') || !req.body.group || !(typeof req.body.group === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid chat title or group',
      });
      return;
    }

    // If there is not a chat with that title
    const chat = await Chat.findOne({ title: req.body.title });
    if (chat === null) {
      // The chat does not exist, fail the action
      res.status(404).send({
        failed: true,
        message: 'The chat specified does not exist',
      });
      return;
    }

    // Find the requested group
    const group = await Group.findOne({ name: req.body.group });

    // If the list already includes the requested chat, do nothing
    const inGroup = group.chats.some((c) => {
      return c.equals(chat._id);
    });
    if (inGroup) {
      // The chat is already accessible, return a 409 conflict
      res.status(409).send({
        failed: true,
        message: `Conflict; a chat with the specified name already has access in the specified group`,
      });
      return;
    }

    // Add the chat to the list
    group.chats.push(chat._id);

    // Save the group data
    await group.save();
    
    logger.notice(`[ADMIN] Successful admin action ADD_CHAT_ACCESS for user with title "${req.body.title}".`);
    // Successfully unlocked the user account
    res.status(200).send({
      failed: false,
      message: 'Successfully updated chat access',
    });
  });

  // Register the remove chat access route
  app.post('/admin/api/v1/remove_chat_access', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_USER; bad authentication',
      });
      return;
    }

    // If a title or group was not provided
    if (!req.body.title || !(typeof req.body.title === 'string') || !req.body.group || !(typeof req.body.group === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid chat title or group',
      });
      return;
    }

    // If there is not a chat with that title
    const chat = await Chat.findOne({ title: req.body.title });
    if (chat === null) {
      // The chat does not exist, fail the action
      res.status(404).send({
        failed: true,
        message: 'The chat specified does not exist',
      });
      return;
    }

    // Find the requested group
    const group = await Group.findOne({ name: req.body.group });

    // If the list does not include the requested chat, do nothing
    const inGroup = group.chats.some((c) => {
      return c.equals(chat._id);
    });
    if (!inGroup) {
      // The chat is already not accessible, return a 409 conflict
      res.status(409).send({
        failed: true,
        message: `Conflict; a chat with the specified name already does not have access in the specified group`,
      });
      return;
    }

    // Remove the chat from the list
    const newChats = [];
    for (const c of group.chats) {
      if (!c.equals(chat._id)) {
        newChats.push(c);
      }
    }
    group.chats = newChats;

    // Save the group data
    await group.save();
    
    logger.notice(`[ADMIN] Successful admin action REMOVE_CHAT_ACCESS for user with title "${req.body.title}".`);
    // Successfully unlocked the user account
    res.status(200).send({
      failed: false,
      message: 'Successfully updated chat access',
    });
  });

  // Register the clear chat messages route
  app.post('/admin/api/v1/clear_chat_messages', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Failed admin action ADD_USER; bad authentication',
      });
      return;
    }

    // If a title was not provided
    if (!req.body.title || !(typeof req.body.title === 'string')) {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed request; invalid chat title',
      });
      return;
    }

    // If there is not a chat with that title
    const chat = await Chat.findOne({ title: req.body.title });
    if (chat === null) {
      // The chat does not exist, fail the action
      res.status(404).send({
        failed: true,
        message: 'The chat specified does not exist',
      });
      return;
    }

    // Clear the chat's messages
    chat.messages = [];

    // Send a response to the client
    logger.warning(`[ADMIN] Successful admin action CLEAR_CHAT_MESSAGES for chat with title "${req.body.title}".`);
    res.status(200).send({
      failed: false,
      message: 'Successfully cleared chat messages',
    });
  });
}
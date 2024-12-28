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
export const registerAdminInterfaceRoutes = (app) => {
  // Register the admin page route
  app.get('/admin/login', async (req, res) => {
    logger.debug('Admin login page request received')
    // Check the session data
    if (req.session.authenticated) {
      res.redirect('/admin/home');
    }

    // Send the administration page
    res.status(200).sendFile(path.resolve('src/html/login.html'));
  });

  // Register the admin home page route
  app.get('/admin/home', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      res.redirect('/admin/login');
    }

    // Send the administration page
    res.status(200).sendFile(path.resolve('src/html/home.html'));
  });

  // Register the admin users page route
  app.get('/admin/users', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      res.redirect('/admin/login');
    }

    // Send the administration page
    res.status(200).sendFile(path.resolve('src/html/users.html'));
  });

  // Register the admin chats page route
  app.get('/admin/chats', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      res.redirect('/admin/login');
    }

    // Send the administration page
    res.status(200).sendFile(path.resolve('src/html/chats.html'));
  });

  // Register the admin groups page route
  app.get('/admin/groups', async (req, res) => {
    // Check the session data
    if (!req.session.authenticated) {
      res.redirect('/admin/login');
    }

    // Send the administration page
    res.status(200).sendFile(path.resolve('src/html/groups.html'));
  });

  // Register the admin login route
  app.post('/admin/api/v1/admin_login', async (req, res) => {
    // If the admin password is not provided
    if (!req.body.adminPassword || typeof req.body.adminPassword !== 'string') {
      // Return malformed request
      res.status(400).send({
        failed: true,
        message: 'Malformed admin login request; no admin password specified',
      });
      return;
    }

    // If the admin password does not match
    if (req.body.adminPassword !== config.adminPassword) {
      // Return unauthorized
      res.status(401).send({
        failed: true,
        message: 'Incorrect admin password',
      });
      // Log the incident
      logger.warning(`[ADMIN] Unauthrozied admin login attempt with incorrect password ${req.body.adminPassword}`);
      return;
    }

    logger.warning(`[ADMIN] Successful login attempt with correct password`);

    // The admin password matches, set the session data
    req.session.authenticated = true;

    res.status(200).send({
      failed: false,
      message: 'Correct admin password.',
    });
    return;
  });

  // Register the admin logout route
  app.post('/admin/api/v1/admin_logout', async (req, res) => {
    // Set authenticated to false server-side
    req.session.authenticated = false;

    // Respond to the client
    res.status(200).send({
      failed: false,
      message: 'Logged out',
    });
    return;
  });
}
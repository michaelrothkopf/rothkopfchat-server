import express from "express";
import { User } from "../models/user.model.js";
import logger from "../lib/logger.js";

/**
 * Registers the signup routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerSignupRoutes = (app) => {
  // Register the check UID route
  app.get('/api/v1/check_UID/:UID', async (req, res) => {
    logger.debug(`[SERVER] A client sent a UID check request.`);
    // Trim the UID parameter and extract the UUID data
    const UID = req.params.UID.trim();

    // If the UID is immediately incorrect
    if (UID.length !== 9) {
      // Return an invalid UID
      res.status(400).send({
        failed: true,
      });
      return;
    }

    // Check the database for a corresponding user
    const user = await User.findOne({ UID: UID });

    // If the user doesn't exist
    if (!user) {
      logger.debug(`[SERVER] UID check request for UID ${UID} failed.`);
      // Return an invalid UID
      res.status(404).send({
        failed: true,
      });
      return;
    }

    // If the user is activated
    if (user.activated) {
      logger.notice(`[SERVER] A client tried to activate an already-activated user at the UID check level ${user.name} (UID: ${user._id}).`);
      // Return an invalid UID
      res.status(409).send({
        failed: true,
      });
      return;
    }

    // Return a successful UID
    res.status(200).send({
      failed: false,
    });
    return;
  });

  // Register the create account route
  app.post('/api/v1/register', async (req, res) =>  {
    logger.debug(`[SERVER] A client sent a register request.`);
    // Trim the UID parameter and extract the UUID data
    const UID = req.body.UID.trim();

    // If the UID is immediately incorrect
    if (UID.length !== 9) {
      // Return an error
      res.status(400).send({
        message: 'Wrong UID length.',
        failed: true,
      });
      return;
    }

    // Check the database for a corresponding user
    const user = await User.findOne({ UID: UID });

    // If the user doesn't exist
    if (!user) {
      // Return an error
      res.status(404).send({
        message: 'No associated user.',
        failed: true,
      });
      return;
    }

    // If the user is activated
    if (user.activated) {
      logger.notice(`[SERVER] A client tried to activate an already-activated user at the registration level ${user.name} (UID: ${user._id}).`);
      // Return an error
      res.status(409).send({
        message: 'User already activated.',
        failed: true,
      });
      return;
    }

    // If the RSA key is invalid
    if (!req.body.rsaKey || typeof req.body.rsaKey !== 'string' || !req.body.expoPushToken || typeof req.body.expoPushToken !== 'string') {
      // Return an error
      res.status(400).send({
        message: 'Invalid RSA key.',
        failed: true,
      });
      return;
    }

    // Modify the user
    user.rsaKey = req.body.rsaKey;
    user.expoPushToken = req.body.expoPushToken;
    user.activated = true;
    user.locked = false;

    // Save the user
    await user.save();

    logger.notice(`[SERVER] A client activated the account ${user.name} (UID: ${user._id}).`);
    // Return a success
    res.status(200).send({
      failed: false,
    });
    return;
  });
}
import { User } from '../models/user.model.js';

import crypto from 'crypto';
import RSAKey from 'react-native-rsa-expo';
import { Group } from '../models/group.model.js';
import { RequestIdentifier } from '../models/requestIdentifier.model.js';
import logger from './logger.js';

/**
 * Middleware to authenticate based on the payload
 */
export const payloadAuthentication = async (req, res, next) => {
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

  // Set an authentication result property in the request object
  req.authResult = result;

  // If succeeded, proceed
  return next();
}

/**
 * Middleware to authenticate based on an authentication header
 */
export const headerAuthentication = async (req, res, next) => {
  // Get the authentication header from the request
  const authenticationHeader = JSON.parse(req.get('authentication'));

  logger.debug(`Received header auth`)

  // Check the user authentication
  const result = await verifyInitialAuthentication(authenticationHeader);

  // If failed
  if (result.failed) {
    // Respond and return
    res.status(401).send({
      message: 'Page must be properly authenticated',
      failed: true,
    });
    return;
  }

  // Set an authentication result property in the request object
  req.authResult = result;

  // If authenticated, continue
  return next();
}

/**
 * Validates the handshake given with the status online method and logs in the user.
 *
 * This method checks the provided token against the database and validates the signature.
 * @param {object} payload The message sent to the server
 * @returns The authentication state of the user
 */
export const verifyInitialAuthentication = async (payload) => {
  try {
    // If the client did not provide a valid request identifier in the contents
    if (!('requestIdentifier' in payload.contents)
      || (typeof payload.contents.requestIdentifier !== 'string')
      || payload.contents.requestIdentifier.length !== 36) {
        logger.debug(`[AUTH] Authentication failed; no request identifier provided`);

        // The authentication is invalid
        return {
          failed: true,
          message: 'No request identifier provided',
          user: null,
          group: null,
          contents: payload.contents,
        }
    }

    // Attempt to select the user registered to that RSA key
    const user = await User.findOne({
      rsaKey: payload.authToken,
    }).exec();
  
    // If the user doesn't exist
    if (!user) {
      logger.debug(`[AUTH] Authentication failed; public key not associated with user ("${payload.authToken}")`);
      // The authentication is invalid
      return {
        failed: true,
        message: 'User does not exist; contact support',
        user: user,
        group: null,
        contents: payload.contents,
      };
    }

    // Attempt to retrieve the user's group
    const group = await Group.findById(user.group);

    // If the group doesn't exist
    if (!group) {
      logger.debug(`[AUTH] Authentication failed; user not associated with group (UID ${user._id}, NAME "${user.name}")`);
      // The authentication is invalid
      return {
        failed: true,
        message: 'Not in group; contact support',
        user: user,
        group: group,
        contents: payload.contents,
      };
    }
  
    // Hash the contents of the message
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload.contents)).digest('hex');
  
    // RSA decrypt the signature
    const rsa = new RSAKey();
    rsa.setPublicString(payload.authToken);
    const signature = rsa.decryptPublic(payload.signature);
  
    // If the signature and payload hash match
    if (signature === hash) {
      // If the user is locked out
      if (user.locked) {
        logger.notice(`[AUTH] Locked user "${user.name}" (UID: ${user._id}) attempted to log in.`);
        return {
          failed: true,
          message: 'Unknown server error; contact support',
          user: user,
          group: group,
          contents: payload.contents,
        };
      }

      // If the request identifier has already been claimed
      const requestIdentifier = await RequestIdentifier.findOne({ identifier: payload.contents.identifier });
      if (requestIdentifier !== null) {
        // Return that the authentication failed with a used request identifier
        logger.debug(`[AUTH] Authentication failed; request identifier ${payload.contents.identifier} already used`);
        // The authentication is invalid
        return {
          failed: true,
          message: 'Request identifier already used; reduplicated requests not allowed',
          user: user,
          group: null,
          contents: payload.contents,
        };
      }

      // Authentication state is valid, create a request identifier log to prevent access via reduplication
      await RequestIdentifier.create({
        claimedAt: new Date(),
        claimedBy: user._id,
        identifier: payload.contents.requestIdentifier,
      });
      
      // Return valid auth state
      logger.debug(`[AUTH] Authentication succeeded; successfully authenticated user "${user.name}" (UID: ${user._id}).`);
      return {
        failed: false,
        message: 'Authentication successful',
        user: user,
        group: group,
        contents: payload.contents,
      }
    }
  
    // Otherwise, return invalid signature
    logger.debug(`[AUTH] Authentication failed; signature invalid (UID: ${user._id}, NAME: "${user.name}").`);
    return {
      failed: true,
      message: 'Unknown signature error; contact support',
      user: user,
      group: group,
      contents: payload.contents,
    }
  } catch (e) {
    logger.debug(`[AUTH] Authentication failed; server error "${e}".`);
    return {
      failed: true,
      message: 'Unknown server crash; contact support',
      user: null,
      group: null,
      contents: payload.contents,
    };
  }
}
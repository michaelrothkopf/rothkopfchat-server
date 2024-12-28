import { v4 as uuidv4 } from "uuid";
import { verifyInitialAuthentication } from "../authentication.js";
import Client from "./Client.js";
import logger from "../logger.js";

export default class TransportServer {
  constructor(io) {
    // Add the socket.io server as a member
    this.io = io;

    // Create an array of clients
    this.clients = {};

    // Create a map of session tokens to clients
    this.sessionTokens = {};
  }
  
  /**
   * Creates the handlers for the global server.
   */
  initialize() {
    // Create the connection handler
    this.io.on('connection', (socket) => {
      logger.debug(`[SERVER] New connection to server.`)
      // Create a new client
      const client = new Client(this.io);

      socket.on('status:online', async (payload) => {
        // Check the user authentication
        const result = await verifyInitialAuthentication(payload);

        // If failed
        if (result.failed) {
          // Respond and return
          socket.emit('authfailure:statusonline', `${result.message}.`);
          return;
        }

        // Initialize the client and add it to the list
        const sessionToken = uuidv4();
        client.initialize(socket, result.user, result.group, sessionToken);
        this.clients[result.user._id] = client;
        this.sessionTokens[sessionToken] = result.user._id;

        // Fire the client's update method
        await client.update();
      });

      // When the connection is closed
      socket.on('disconnect', async (reason) => {
        try {
          logger.debug(`[SERVER] Client ${client.user.name} disconnected from the server (${reason}).`);

          // Update the client's last login time
          client.user.lastLogout = new Date();
          await client.user.save();

          // Delete the entry from clients
          delete this.clients[client.user._id];
        } catch (e) {
          logger.debug(`[SERVER] ${e}/${reason}`);
        }
      });
    });
  }

  /**
   * Gets a specific client by user ID
   * @param {string} id The ID of the client
   * @returns The client with a given ID, or null if does not exist
   */
  getClient(id) {
    if (id in this.clients) {
      return this.clients[id];
    }
    return null;
  }

  /**
   * Disconnects a client from the server
   * @param {string} id The user ID of the client to disconnect
   * @returns Whether the client was disconnected
   */
  disconnectClient(id) {
    // Get the client with the given ID
    const client = this.getClient(id);

    // If the client does not exist
    if (!client) {
      return false;
    }

    // Disconnect the socket connection
    client.socket.disconnect();

    // Remove the client from the list
    delete this.clients[id];

    // Return true
    return true;
  }
}
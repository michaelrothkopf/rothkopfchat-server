import express from "express";
import { User } from "../models/user.model.js";
import path from "path";
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(path.resolve('./config.json')));
import { Group } from '../models/group.model.js'
import logger from "../lib/logger.js";
import { generateUID } from "../lib/generateUID.js";
import { Chat } from "../models/chat.model.js";
import { registerAdminInterfaceRoutes } from "./admin/interface.js";
import { registerAdminChatsRoutes } from "./admin/chats.js";
import { registerAdminUsersRoutes } from "./admin/users.js";
import { registerAdminGroupsRoutes } from "./admin/groups.js";

/**
 * Registers the admin routes to the index
 * @param {Express.Application} app The Express application
 */
export const registerAdminRoutes = (app) => {
  registerAdminInterfaceRoutes(app);
  registerAdminChatsRoutes(app);
  registerAdminGroupsRoutes(app);
  registerAdminUsersRoutes(app);
}
# RothkopfChat

This repository contains the server code for RothkopfChat. The client code is in a [separate repository](https://github.com/michaelrothkopf/rothkopfchat-app).

## Structure

| Name | Description |
| --- | --- |
| html | Webpage files for the admin panel |
| lib | Utility functions for running the server |
| transport | Live connection handler |
| models | Database interfaces |
| routes | REST API handlers |
| static | Admin page client scripts and non-HTML files |

## Technologies and Stack

The server is built on Express and Socket.IO, with MongoDB and Mongoose handling its databases.

I used RSA libraries to handle asymmetric encryption tasks. I [forked](https://github.com/michaelrothkopf/react-native-rsa-expo) one such library to support Expo.

More information on this project can be found in the [client repository](https://github.com/michaelrothkopf/rothkopfchat-app).
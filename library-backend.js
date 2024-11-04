/* eslint-disable @stylistic/js/indent */
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from 'graphql-tools';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from './src/model/user.js';
import jwt from 'jsonwebtoken';
const { verify } = jwt;

mongoose.set('strictQuery', false);
const MONGODB_URI = process.env.MONGODB_URI;
import { typeDefs } from './src/graphql/schema.js';
import { resolvers } from './src/graphql/resolvers.js';
console.log('connecting to', MONGODB_URI);
if (!MONGODB_URI) throw new Error('No MONGODB URI');
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });
mongoose.set('debug', true);
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  });
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  //I'm guessing useServer starts the wsServer on the httpServer at '/'
  const serverCleanup = useServer({ schema }, wsServer);
  const server = new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      //https://community.apollographql.com/t/unable-to-edit-sandbox-subscription-url/7492
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageProductionDefault()
        : ApolloServerPluginLandingPageLocalDefault({
            footer: false,
            embed: {
              endpointIsEditable: true,
            },
          }),
    ],
  });
  await server.start();
  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null;
        if (auth && auth.startsWith('Bearer ')) {
          const { id } = verify(auth.substring(7), process.env.JWT_SECRET);
          const currentUser = await User.findById(id);
          return { currentUser };
        }
      },
    })
  );
  const PORT = 4000;
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  );
};
start();

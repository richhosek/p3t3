import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';

import db from './config/connection.js';

const PORT = process.env.PORT || 3001;
const app = express();

// Initialize Apollo Server with type definitions and resolvers



const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startApolloServer = async () => {
  try {
    // Start Apollo Server
    await server.start();
    
    // Wait for database connection
    await db();

    // Apply middleware
    app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server, {
      context: authenticateToken,
    }));

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startApolloServer();
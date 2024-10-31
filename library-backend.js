import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { v1 as uuid } from 'uuid';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Author } from './src/model/authors.js';
import { Book } from './src/model/books.js';
import { User } from './src/model/user.js';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
mongoose.set('strictQuery', false);
const MONGODB_URI = process.env.MONGODB_URI;

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

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Book{
    title:String!
    author:Author!
    published:String!
    genres:[String!]
  }
  type Author{
    name:String! 
    born:Int
    bookCount:Int
  }
  type Query {
    bookCount: Int!
    authorCount:Int!
    allBooks(author:String, genre:String):[Book!]
    allAuthors:[Author!]
    me:User
  }
  type Mutation{
    addBook(title:String!,author:String!,published:Int!,genres:[String!]):Book!
    editAuthor(name:String!,setBornTo:Int!): Author
    createUser(username:String!, password:String!) : User
    login(username:String!,password:String!):Token
  }
`;

const resolvers = {
  Query: {
    bookCount: async () => await Book.countDocuments(),
    authorCount: async () => await Author.countDocuments(),
    allBooks: async (root, args) => {
      return await Book.find({
        author: args.author,
        genres: args.genre,
      });
    },
    allAuthors: async () => await Author.find({}),
    me: (root, args, context) => context.currentUser,
  },
  Author: {
    bookCount: async (root, args) => {
      const books = await Book.find({});
      return books.reduce(
        (accumulator, b) =>
          b.author === root.name ? ++accumulator : accumulator,
        0
      );
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('User must be signed in to add book: ', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        });
      }
      const authorName = args.author;
      let author = await Author.findOne({ name: authorName });
      if (!author) {
        try {
          author = await Author.create({ name: authorName, bookCount: 1 });
        } catch (error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error,
            },
          });
        }
      }
      try {
        return await Book.create({ ...args, author });
      } catch (error) {
        throw new GraphQLError('Adding book failed', {
          extensions: {
            code: 'UNAUTHORIZED',
          },
        });
      }
    },
    editAuthor: async (root, { name, setBornTo }, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('User must be signed in to edit author', {
          extensions: {
            code: 'UNAUTHORIZED',
          },
        });
      }
      return await Author.findOneAndUpdate(
        { name },
        { born: setBornTo },
        { new: true }
      );
    },
    createUser: async (root, { username }) => {
      try {
        return await User.create({ username });
      } catch (error) {
        throw new GraphQLError('Creating user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        });
      }
    },
    login: async (root, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || password !== 'password') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        });
      }
      const userForToken = {
        username,
        id: user._id,
      };
      return { value: sign(userForToken, process.env.JWT_SECRET) };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.startsWith('Bearer ')) {
      const { id } = verify(auth.substring(7), process.env.JWT_SECRET);
      const currentUser = await User.findById(id);
      return { currentUser };
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

import { PubSub } from 'graphql-subscriptions';
import { Author } from '../model/authors.js';
import { Book } from '../model/books.js';
import { User } from '../model/user.js';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
const { sign } = jwt;
const pubsub = new PubSub();
const resolvers = {
  Query: {
    bookCount: async () => await Book.countDocuments(),
    authorCount: async () => await Author.countDocuments(),
    allBooks: async (root, { author, genre }) => {
      const filter = {};
      if (author) filter.author = author;
      if (genre) filter.genres = genre;
      return await Book.find(filter).populate('author');
    },
    allAuthors: async () => await Author.find({}),
    me: (root, args, context) => context.currentUser,
  },
  Author: {
    bookCount: async (root) => {
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
            code: 'UNAUTHORIZED',
            invalidArgs: args.name,
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
        const book = await Book.create({ ...args, author });
        pubsub.publish('BOOK_ADDED', { bookAdded: book });
        return book;
      } catch (error) {
        throw new GraphQLError('Adding book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            error,
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
  Subscription: {
    bookAdded: {
      subscribe: () => {
        return pubsub.asyncIterator('BOOK_ADDED');
      },
    },
  },
};

export { resolvers };

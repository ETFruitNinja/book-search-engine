const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  // define query functionality
  Query: {
    me: async (parent, args, context) => {
      // console.log(context);
      if (context.user) {
        // await User.findOneAndUpdate(
        //   { _id: context.user._id },
        //   { $unset: { savedBooks: true }},
        // );
        return User.findOne({ _id: context.user._id }).populate('savedBooks');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
  // define mutation functionality
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
    },
    // function to save new books
    saveBook: async (parent, bookInput, context) => {
      if (context.user) {
        console.log(bookInput.book);
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookInput.book }},
          {
            new: true,
            runValidators: true,
          }
        );
        console.log('Added book to user')
        console.log(user);
        return user;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    // function to remove books for savedBooks based on id
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $pull: {
              savedBooks: {
                bookId: bookId
              },
            },
          },
          { new: true }
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;

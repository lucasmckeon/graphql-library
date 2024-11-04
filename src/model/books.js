import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
  },
  published: {
    type: Number,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
  },
  genres: [{ type: String }],
});
//I don't know how to use this in ES6
//schema.plugin(() => uniqueValidator());
const Book = mongoose.model('Book', schema);
export { Book };

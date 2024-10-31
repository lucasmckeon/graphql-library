import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
console.log(uniqueValidator);
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
  },
  bookCount: {
    type: Number,
    required: true,
  },
  born: {
    type: Number,
  },
});
//I don't know how to use this in ES6
//schema.plugin(() => uniqueValidator());
const Author = mongoose.model('Author', schema);
export { Author };

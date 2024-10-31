import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
  },
});

//I don't know how to use this in ES6
//schema.plugin(() => uniqueValidator());
const User = mongoose.model('User', schema);
export { User };

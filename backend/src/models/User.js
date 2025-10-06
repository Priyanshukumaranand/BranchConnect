const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ImageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  collegeId: {
    type: String,
    trim: true,
    lowercase: true
  },
  googleId: {
    type: String,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  place: String,
  about: String,
  instagram: String,
  linkedin: String,
  github: String,
  img: ImageSchema,
  secret: String,
  created: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

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
  leetcode: {
    type: String,
    trim: true
  },
  codeforces: {
    type: String,
    trim: true
  },
  codechef: {
    type: String,
    trim: true
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
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

// Accelerate batch lookups by branch/year (regex prefix on collegeId and equality on batchYear)
userSchema.index({ collegeId: 1 });
userSchema.index({ batchYear: 1 });
userSchema.index({ collegeId: 1, batchYear: 1 });

module.exports = mongoose.model('User', userSchema);

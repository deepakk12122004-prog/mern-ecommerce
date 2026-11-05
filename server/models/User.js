const mongoose = require("mongoose"); 
const bcrypt = require("bcryptjs"); 
const { USER_ROLES } = require("../config/constants"); 
// How much work bcrypt does. Higher is safer but slower. 
const SALT_ROUNDS = 12; 
 
const userSchema = new mongoose.Schema( 
  { 
    name: { 
      type: String, 
      required: [true, "Name is required."], 
      trim: true, 
      minlength: [2, "Name must be at least 2 characters."], 
      maxlength: [50, "Name cannot be more than 50 characters."], 
    }, 
    email: { 
      type: String, 
      required: [true, "Email is required."], 
      unique: true, 
      lowercase: true, 
      trim: true, 
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address."], 
    }, 
    password: { 
      type: String, 
      required: [true, "Password is required."], 
      minlength: [8, "Password must be at least 8 characters."], 
      // bcrypt only reads the first 72 bytes of a password 
      maxlength: [72, "Password cannot be more than 72 characters."], 
      // Hidden from every query unless you ask for it 
      select: false, 
    }, 
    role: { 
      type: String, 
      enum: { values: USER_ROLES, message: "Role must be user or admin." }, 
      default: "user", 
    }, 
  }, 
  { 
    timestamps: true, 
    toJSON: { 
      // Safety net: even by mistake, the hash never goes in a response 
      transform(doc, ret) { 
        delete ret.password; 
        delete ret.__v; 
        return ret; 
      }, 
    }, 
  } 
); 
 
// Runs before every save(). Validation has already checked the 
// plain password by now, so here we replace it with its hash. 
userSchema.pre("save", async function () { 
  if (!this.isModified("password")) return; 
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS); 
}); 
 
// user.comparePassword("typed password") -> true or false 
// The user must be loaded with .select("+password"). 
userSchema.methods.comparePassword = async function (plainPassword) { 
  if (!this.password || typeof plainPassword !== "string") return false; 
  return bcrypt.compare(plainPassword, this.password); 
}; 
 
module.exports = mongoose.model("User", userSchema);
import { Schema, model, Document, Types } from 'mongoose';
// import { IDeck } from './Deck.js';
import bcrypt from 'bcrypt';

// Define an interface for the Profile document
export interface IProfile extends Document {
  _id: string;
  name: string;
  username: string;
  email: string;
  password:string;
  decks: Types.ObjectId[];
  favorites:  Types.ObjectId[];
  isCorrectPassword(password: string): Promise<boolean>;
}

// Define the schema for the Profile document
const profileSchema = new Schema<IProfile>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
    },
    decks: [
        {
        type: Schema.Types.ObjectId,
        ref: "Decks"
      }
    ],
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Flashcard"
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// set up pre-save middleware to create password
profileSchema.pre<IProfile>('save', async function(next) {
  if (this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log(`Password hashed for user ${this.name}`);
  }
  next();
});

// compare the incoming password assert the hashed password
profileSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const Profile = model<IProfile>('Profile', profileSchema);

export default Profile;

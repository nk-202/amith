import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).select('email role name');
        fs.writeFileSync(join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
        console.log('Done writing users.json');
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        await mongoose.disconnect();
    }
}

listUsers();

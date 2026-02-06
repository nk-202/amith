import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function verifyPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const checks = [
            { email: 'admin@siet.edu', pass: 'admin123' },
            { email: 'faculty@siet.edu', pass: 'faculty123' },
            { email: 'hod@siet.edu', pass: 'hod123' },
            { email: 'john@siet.edu', pass: 'student123' },
            { email: 'john@siet.edu', pass: 'john123' },
            { email: 'john@siet.edu', pass: '123' },
            { email: 'hod@cse', pass: '123' },
            { email: 'admin@cse', pass: '123' },
            { email: 'nk@gmail.com', pass: '123' }
        ];

        const results = [];

        for (const check of checks) {
            const user = await User.findOne({ email: check.email });
            if (user) {
                const match = await bcrypt.compare(check.pass, user.password);
                if (match) {
                    results.push({ email: check.email, password: check.pass, role: user.role });
                }
            }
        }

        fs.writeFileSync(join(__dirname, 'verified.json'), JSON.stringify(results, null, 2));
        console.log('Done');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        await mongoose.disconnect();
    }
}

verifyPasswords();

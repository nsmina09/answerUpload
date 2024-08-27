const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('../userSchema')
const Files = require('../fileScehma')

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileupload';
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Successfully connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ fileUrl });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/signup', async (req, res) => {
    try {
        const { name, mobile, email, role, password } = req.body;

        const mobileExist = await User.findOne({ mobile });
        const emailExist = await User.findOne({ email });

        if (mobileExist || emailExist) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            mobile,
            email,
            role,
            password: hashedPassword
        });

        await user.save();
        return res.status(201).json({ message: 'User created successfully', status: 200 ,user});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User does not exist' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        return res.status(200).json({ message: 'User verified', status: 200, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/updateFiles', async (req, res) => {
    try {
        const { id, fileUrl } = req.body;
        if (!id || !fileUrl) {
            return res.status(400).json({ error: 'User ID and file URL are required' });
        }

        const userExist = await User.findOne({ unqId: id });

        if (!userExist) {
            return res.status(404).json({ error: 'User does not exist' });
        }
        const file = new Files({
            fileUrl,
            userId: id,
        });

        await file.save();

        return res.status(200).json({ message: 'File updated successfully', status: 200 });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/getFiles', async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const userExist = await User.findOne({ unqId: id });

        if (!userExist) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        let files;
        if (userExist.role === 'admin') {
            files = await Files.find();
        } else {
            files = await Files.find({ userId: id });
        }

        return res.status(200).json({ files, status: 200 });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

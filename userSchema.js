var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    unqId: {
        type: String,
        required: true,
        default: function() {
            return 'DS' + new Date().getTime();
        }
    },
    name: String,
    email: String,
    mobile: String,
    password: String,
    role: String,
}, { timestamps: true });

module.exports = mongoose.model('users', userSchema, 'users');

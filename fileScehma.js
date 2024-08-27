var mongoose = require('mongoose');
var fileSchema = new mongoose.Schema({
    unqId: {
        type: String,
        required: true,
        default: function() {
            return 'DS' + new Date().getTime();
        }
    },
    fileUrl: String,
    userId: String,
}, { timestamps: true });

module.exports = mongoose.model('files', fileSchema, 'files');

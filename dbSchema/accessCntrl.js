exports.accessCntrl = function (config) {
    var mongoose = require("mongoose"),
        Schema = mongoose.Schema,
        autoIncrement = require("mongoose-auto-increment-fix");
    if (mongoose.models && mongoose.models.accessCntrl) {
        return mongoose.models.accessCntrl;
    }
    mongoose.Promise = global.Promise;
    var mongoURI = "mongodb://" + config.dbURL + ":" + config.dbPort + "/" + config.dbName;
    if (config.dbUser != "" && config.dbPassword != "") {
        mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
    }
    mongoose.connect(mongoURI, {
        useNewUrlParser: true
    });
    autoIncrement.initialize(mongoose);
    var accessCntrl = new Schema({
        userName: {
            type: String,
            required: true
        },
        ServerControlPannel: {
            type: Boolean,
            default: false
        },
        userControl: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    });
    accessCntrl.plugin(autoIncrement.plugin, {
        model: "accessCntrl",
        field: "Si",
        startAt: 1
    });
    return mongoose.model("accessCntrl", accessCntrl, "accessCntrl");
};
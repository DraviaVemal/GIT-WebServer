exports.users = function (config) {
    var mongoose = require("mongoose"),
        Schema = mongoose.Schema,
        autoIncrement = require("mongoose-auto-increment-fix");
    mongoose.Promise = global.Promise;
    var mongoURI = "mongodb://" + config.dbURL + "/" + config.dbName;
    if (config.dbUser != "" && config.dbPassword != "") {
        mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
    }
    mongoose.connect(mongoURI);
    autoIncrement.initialize(mongoose);
    var users = new Schema({
        name: {
            type: String,
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        eMail: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    });
    users.plugin(autoIncrement.plugin, {
        model: "users",
        field: "Si",
        startAt: 1
    });
    return mongoose.model("users", users, "users");
};
exports.mailToken = function (config) {
    var mongoose = require("mongoose"),
        Schema = mongoose.Schema,
        autoIncrement = require("mongoose-auto-increment-fix");
        if (mongoose.models && mongoose.models.mailToken) {
            return mongoose.models.mailToken;
        }
    mongoose.Promise = global.Promise;
    var mongoURI = "mongodb://" + config.dbURL + ":" + config.dbPort + "/" + config.dbName;
    if (config.dbUser != "" && config.dbPassword != "") {
        mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
    }
    mongoose.connect(mongoURI,{ useNewUrlParser: true });
    autoIncrement.initialize(mongoose);
    var mailToken = new Schema({
        timestamp: {
            type: Date,
            default: Date.now
        }
    });
    mailToken.plugin(autoIncrement.plugin, {
        model: "mailToken",
        field: "Si",
        startAt: 1
    });
    return mongoose.model("mailToken", mailToken, "mailToken");
};
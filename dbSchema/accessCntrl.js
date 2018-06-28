exports.accessCntrl = function (config) {
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
    var accessCntrl = new Schema({
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
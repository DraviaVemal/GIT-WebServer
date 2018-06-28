exports.gitRepo = function (config) {
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
    var gitRepo = new Schema({
        Repo: {
            type: String,
            required: true
        },
        logicName: {
            type: String,
            required: true
        },
        User: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    });
    gitRepo.plugin(autoIncrement.plugin, {
        model: "gitRepo",
        field: "Si",
        startAt: 1
    });
    return mongoose.model("gitRepo", gitRepo, "gitRepo");
};
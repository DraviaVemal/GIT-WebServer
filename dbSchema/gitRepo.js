/**
 * Schema building for gitRepo DB
 * @param  {JSON} config Master Configuration JSON
 */
exports.gitRepo = function (config) {
    var mongoose = require("mongoose"),
        Schema = mongoose.Schema,
        autoIncrement = require("mongoose-auto-increment-fix");
    if (mongoose.models && mongoose.models.gitRepo) {
        return mongoose.models.gitRepo;
    }
    mongoose.Promise = global.Promise;
    var mongoURI = "mongodb://" + config.dbURL + "/" + config.dbName;
    if (config.dbUser != "" && config.dbPassword != "") {
        mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
    }
    mongoose.connect(mongoURI);
    autoIncrement.initialize(mongoose);
    var gitRepo = new Schema({
        repo: {
            type: String,
            required: true
        },
        logicName: {
            type: String,
            unique: true,
            required: true
        },
        user: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        timeStamp: {
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
/**
 * Create repository record in DB
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {{repo:String,user:String,url:String}} data Input data
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 */
exports.gitRepoCreate = function (req, res, data, config, next) {
    var validation = require("../modules/validation");
    if (validation.variableNotEmpty(data.repo, 4) &&
        validation.variableNotEmpty(data.user) &&
        validation.variableNotEmpty(data.url)) {
        if (config.database == "Mongo") {
            var gitRepo = this.gitRepo(config);
            gitRepo.create({
                repo: data.repo,
                logicName: data.repo.toUpperCase(),
                user: data.user,
                url: data.url,
            }, function (err) {
                if (err) {
                    if (config.logging) {
                        console.log(err);
                        if (err.code == 11000) {
                            res.send("exist");
                        } else {
                            res.status(503);
                            res.send();
                        }
                    }
                } else next(req, res, config);
            });
        }
    } else {
        if (config.logging) console.log("Git Create Repo Insert operation failed due to missing data");
        res.status(403);
        res.send();
    }
};

/**
 * Deletes Git repository recored from DB
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {{repo:String,}} data Input data
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 */
exports.gitRepoDelete = function (req, res, data, config, next) {
    var validation = require("../modules/validation");
    if (validation.variableNotEmpty(data.repo, 4)) {
        if (config.database == "Mongo") {
            var gitRepo = exports.gitRepo(config);
            gitRepo.deleteOne({
                logicName: data.repo.toUpperCase()
            }, function (err) {
                if (err) {
                    if (config.logging) {
                        console.log(err);
                        res.status(503);
                        res.send();
                    }
                } else next(req, res, config);
            });
        }
    } else {
        if (config.logging) console.log("Git Delete Repo Insert operation failed due to missing data");
        res.status(403);
        res.send();
    }
};
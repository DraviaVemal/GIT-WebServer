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
    var mongoURI = "mongodb://" + config.dbURL + ":" + config.dbPort + "/" + config.dbName;
    if (config.dbUser != "" && config.dbPassword != "") {
        mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
    }
    mongoose.connect(mongoURI,{ useNewUrlParser: true });
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
        createdUser: {
            type: String,
            required: true
        },
        private: {
            type: Boolean,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        userList:[{
            userName:{
                type:String,
                require:true
            },
            readOnly:{
                type:Boolean,
                default:false
            }
        }],
        readOnly:{
            type:Boolean,
            default:false
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
 * @param  {{repo:String,createdUser:String,url:String,private:Boolean,description:String}} data Input data
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 */
exports.gitRepoCreate = function (req, res, data, config, next) {
    var validation = require("../modules/validation");
    if (validation.variableNotEmpty(data.repo, 4) &&
        validation.variableNotEmpty(data.createdUser) &&
        validation.variableNotEmpty(data.url) &&
        validation.variableNotEmpty(data.description)) {
        if (config.database == "Mongo") {
            var gitRepo = exports.gitRepo(config);
            data.logicName = data.repo.toUpperCase();
            gitRepo.create(data, function (err, gitRepo) {
                if (err) {
                    if (config.logging) {
                        if (err.code == 11000) {
                            var handlebarLayout = "default";
                            if (req.body.opti) {
                                handlebarLayout = false;
                            }
                            var message = '<div class="alert alert-warning" role="alert" data-test="createRepoMessage">Sorry ! Repository name "<strong>' + data.repo + '</strong>" already taken</div>';
                            res.render("user/createRepo", {
                                layout: handlebarLayout,
                                name: req.session.userData.name,
                                message: message,
                                config:config
                            });
                        } else {
                            console.log(err);
                            res.status(503);
                            res.send();
                        }
                    }
                } else {
                    config.gitRepo = gitRepo;
                    next(req, res, config);
                }
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
/**
 * findOne mongoose function will return result with top one match
 * @param  {object} query query object passed to find the results 
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 */
exports.findOne = function (query, req, res, config, next) {
    if (config.database == "Mongo") {
        var gitRepo = exports.gitRepo(config);
        gitRepo.findOne(query, function (err, result) {
            if (err) {
                if (config.logging) {
                    console.log(err);
                    res.status(503);
                    res.send();
                }
            } else next(req, res, config, result);
        });
    }
};
/**
 * find mongoose function will return result with all match
 * @param  {object} query query object passed to find the results 
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 */
exports.find = function (query, req, res, config, next) {
    if (config.database == "Mongo") {
        var gitRepo = exports.gitRepo(config);
        gitRepo.find(query, function (err, result) {
            if (err) {
                if (config.logging) {
                    console.log(err);
                    res.status(503);
                    res.send();
                }
            } else next(req, res, config, result);
        });
    }
};
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

exports.gitRepoCreate = function (req, res, data, config, next) {
    if ((data.repo != "" && data.repo != null && data.repo != undefined) &&
        (data.user != "" && data.user != null && data.user != undefined) &&
        (data.url != "" && data.url != null && data.url != undefined)) {
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

exports.gitRepoDelete = function (req, res, data, config, next) {
    if (data.repo != "" && data.repo != null && data.repo != undefined) {
        if (config.database == "Mongo") {
            var gitRepo = this.gitRepo(config);
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
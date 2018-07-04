/**
 * User collection schema in mongo DB
 * @param  {JSON} config Master Configuration JSON
 */
exports.users = function (config) {
    var mongoose = require("mongoose"),
        Schema = mongoose.Schema,
        autoIncrement = require("mongoose-auto-increment-fix");
    var bcrypt = require("bcryptjs");
    if (mongoose.models && mongoose.models.users) {
        return mongoose.models.users;
    }
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
            unique: true,
            required: true
        },
        eMail: {
            type: String,
            unique: true,
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
    users.pre("save", function (next) {
        var data = this;
        var hash = bcrypt.hashSync(data.password, 10);
        data.password = hash;
        next();
    });
    users.plugin(autoIncrement.plugin, {
        model: "users",
        field: "Si",
        startAt: 1
    });
    return mongoose.model("users", users, "users");
};

/**
 * Creates new user record in DB
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {{name:String,userName:String,eMail:Strings,password:String}} data Input data
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 * @returns {JSON} return config.exist
 */
exports.createUser = function (req, res, data, config, next) {
    var validation = require("../modules/validation");
    if (validation.variableNotEmpty(data.name, 3) &&
        validation.variableNotEmpty(data.userName, 3) &&
        validation.variableNotEmpty(data.eMail) /* TODO : regx Validation pending */ &&
        validation.variableNotEmpty(data.password, 8)) {
        data.eMail = data.eMail.toUpperCase();
        data.userName = data.userName.toUpperCase();
        if (config.database == "Mongo") {
            var users = exports.users(config);
            users.create(data, function (err) {
                if (err) {
                    if (config.logging) console.log(err);
                    if (err.code == 11000) {
                        config.exist = true;
                        next(req, res, config);
                    } else {
                        res.status(503);
                        res.send();
                    }
                } else {
                    config.exist = false;
                    next(req, res, config);
                }
            });
        }
    } else {
        if (config.logging) console.log("Create User Missing Input Error");
        res.status(403);
        res.send();
    }
};

/**
 * Creates new user record in DB
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {{userName:String,eMail:Strings,password:String}} data Input data
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next Callback function(req,res,config)
 * @returns {JSON} return config.valid
 */
exports.loginUser = function (req, res, data, config, next) {
    var validation = require("../modules/validation");
    if ((validation.variableNotEmpty(data.eMail) /* TODO : regx Validation pending */ ) &&
        validation.variableNotEmpty(data.password, 8)) {
        if (data.eMail) data.eMail = data.eMail.toUpperCase();
        if (data.userName) data.userName = data.userName.toUpperCase();
        if (config.database == "Mongo") {
            var users = exports.users(config);
            var query = {
                $or: [{
                        eMail: req.body.eMail
                    },
                    {
                        userName: req.body.eMail
                    }
                ]
            };
            users.findOne(query, function (err, result) {
                if (err) {
                    if (config.logging) {
                        console.log(err);
                    }
                    res.status(503);
                    res.send();
                } else {
                    if (result) {
                        var bcrypt = require("bcryptjs");
                        var validUser = bcrypt.compareSync(
                            req.body.password,
                            result.password
                        );
                        if (validUser) {
                            config.valid = true;
                            config.result = result;
                            next(req, res, config);
                        } else {
                            config.valid = false;
                            next(req, res, config);
                        }
                    } else {
                        config.valid = false;
                        next(req, res, config);
                    }

                }
            });
        }
    } else {
        if (config.logging) console.log("Login User Missing Input Error");
        res.status(403);
        res.send();
    }
};
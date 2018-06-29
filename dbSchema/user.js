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
    if ((data.name != "" && data.name != null && data.name != undefined && data.name.length >= 3) &&
        (data.userName != "" && data.userName != null && data.userName != undefined && data.userName.length >= 3) &&
        (data.eMail != "" && data.eMail != null && data.eMail != undefined /*TODO Mail Regx Validation */ ) &&
        (data.password != "" && data.password != null && data.password != undefined && data.password.length >= 8)) {
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
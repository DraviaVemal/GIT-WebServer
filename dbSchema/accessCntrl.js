/**
 * Access Control setting data DB
 * @param  {JSON} config Master Configuration JSON
 */
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
        Serverconfiguration: {
            type: Boolean,
            default: false
        },
        userControl: {
            type: Boolean,
            default: false
        },
        createRepo: {
            type: Boolean,
            default: false
        },
        userBlocked: {
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
/**
 * @param  {Object} req
 * @param  {{userName:String}} data
 * @param  {JSON} config Master Configuration JSON
 */
exports.createUser = function (req, data, config) {
    var accessCntrl = exports.accessCntrl(config);
    accessCntrl.create(data, function (err) {
        if (config.logging) console.log(err);
    });
};
/**
 * Updates the current user access permission status
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 * @param  {function} next next function by express
 */
exports.getAccessPermission = function (req, res, config, next) {
    var accessCntrl = exports.accessCntrl(config);
    accessCntrl.findOne({
        userName: req.session.userData.userName
    }, function (err, result) {
        if (err) {
            if (config.logging) console.log(err);
        } else {
            if (result) {
                req.session.userAccess = result;
                delete req.session.userAccess.userName;
                delete req.session.userAccess.Si;
                delete req.session.userAccess.timestamp;
                if(result.userBlocked){
                    res.send("User Access Revoked");
                }else{
                    next();
                }
            } else {
                accessCntrl.create({
                    userName: req.session.userData.userName
                }, function (err, result) {
                    if (err) {
                        if (config.logging) console.log(err);
                        req.session.userAccess = {};
                        next();
                    } else {
                        req.session.userAccess = result;
                        delete req.session.userAccess.userName;
                        delete req.session.userAccess.Si;
                        delete req.session.userAccess.timestamp;
                        next();
                    }
                });
            }
        }
    });
};
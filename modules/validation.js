/**
 * Function is used to check variable data is not empty
 * @param  {var} variable Variable to be checked
 * @param  {Integer} Length Min. Length of variable - Default : 1 
 * @param  {JSON} config Master Configuration JSON
 * @returns {bool} return variable is empty or not
 */
exports.variableNotEmpty = function (variable, Length, config) {
    if (typeof (variable) != "number" && typeof (variable) != "object") {
        var length = Length || 1;
        if (variable != null && variable != undefined && variable != "" && variable.length >= length) {
            return true;
        } else return false;
    } else {
        if (config.logging) console.log("Invalid Input to function");
        return false;
    }
};

/**
 * Inspect and confirm the validity of user login
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.loginValidation = function (req, res, config) {
    if (req.session.active) {
        var bcrypt = require("bcryptjs");
        return bcrypt.compareSync(
            req.cookie.SSID,
            req.session.id + config.salt
        );
    } else return false;
};

/**
 * Post authentication session and cookie setup for identifying user
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.loginInitialisation = function (req, res, config) {
    var uidGenerator = require('node-unique-id-generator');
    var bcrypt = require("bcryptjs");
    res.cookie('SSID', bcrypt.hashSync(req.session.id + config.salt, 10), {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    });
    res.cookie('UID', uidGenerator.generateUniqueId(), {
        httpOnly: true
    });
    res.cookie('BID', uidGenerator.generateUniqueId(), {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
    });
};
/**
 * Module for validating multiple features
 * @param  {var} variable Variable to be checked
 * @returns {JSON} return variable is empty or not
 */
module.exports = function (variable) {
    var data = variable;
    var finalResult = true;
    var validator = require('validator');
    /**
     * Inspect and confirm the validity of user login
     * @param  {object} req Request Object
     * @param  {object} res Response Object
     * @param  {JSON} config Master Configuration JSON
     */
    this.loginValidation = function (req, res, config) {
        if (req.session.active && req.cookies[config.advProperties.cookieChecksumName]) {
            var bcrypt = require("bcryptjs");
            return bcrypt.compareSync(
                req.session.id + config.salt,
                req.cookies[config.advProperties.cookieChecksumName]
            );
        } else {
            if (req.cookies[config.advProperties.cookieChecksumName]) res.clearCookie(config.advProperties.cookieChecksumName);
            return false;
        }
    };
    /**
     * Post authentication session and cookie setup for identifying user
     * @param  {object} req Request Object
     * @param  {object} res Response Object
     * @param  {JSON} config Master Configuration JSON
     */
    this.loginInitialisation = function (req, res, config) {
        var bcrypt = require("bcryptjs");
        res.cookie(config.advProperties.cookieChecksumName, bcrypt.hashSync(req.session.id + config.salt, config.advProperties.criptoSalt), {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            sameSite: true,
            secure: config.enableSSL
        });
    };
    /**
     * Check the passed variable is not empty
     */
    this.isNotEmpty = function () {
        if (typeof (data) != "number" && typeof (data) != "object") {
            if (data != null && data != undefined && data != "") {
                return this;
            } else {
                finalResult = false;
                return this;
            }
        } else {
            if (gLogging) console.log("Invalid Input to function");
            finalResult = false;
            return this;
        }
    };
    /**
     * Check it has min. length of the variable
     * @param  {Integer} Length Min. length of the input variable
     */
    this.hasLength = function (Length) {
        if (typeof (data) != "number" && typeof (data) != "object") {
            var length = Length || 1;
            if (data.length >= length) {
                return this;
            } else {
                finalResult = false;
                return this;
            }
        } else {
            if (gLogging) console.log("Invalid Input to function");
            finalResult = false;
            return this;
        }
    };
    /**
     * Check the variable is E-Mail
     */
    this.isEMail = function () {
        if (validator.isEmail(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check the variable is a integer
     */
    this.isInt = function () {
        if (validator.isNumeric(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check variable contains only alphabets(aA-zZ)
     */
    this.isAlpha = function () {
        if (validator.isAlpha(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check variable contains only alpha numaric(aA-zZ,0-9)
     */
    this.isAlphaNum = function () {
        if (validator.isAlphanumeric(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    this.isDate = function () {

    };
    /**
     *  Check variable is Bool
     */
    this.isBool = function () {
        if (validator.isBoolean(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check the variable contains valid URI
     */
    this.isURI = function () {
        if (validator.isDataURI(data)) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check the variable date is after present day
     */
    this.isFutureDate = function () {
        if (validator.isAfter(data, new Date())) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Check the variable date is before present day
     */
    this.isPastDate = function () {
        if (validator.isBefore(data, new Date())) {
            return this;
        } else {
            finalResult = false;
            return this;
        }
    };
    /**
     * Return the bool result of all checks
     */
    this.boolResult = function () {
        return finalResult;
    };
    return this;
};
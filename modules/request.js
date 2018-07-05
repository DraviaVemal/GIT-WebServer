/**
 * Handle the static file like CSS,JS,etc...
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.staticFile = function (route, config) {
    route.get("/bootstrap.css", function (req, res) {
        res.sendFile(config.dirname + "/public/css/bootstrap.min.css");
    });
    route.get("/fontawesome.css", function (req, res) {
        res.sendFile(config.dirname + "/public/css/fontawesome.css");
    });
    route.get("/jquery.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/jquery-3.3.1.min.js");
    });
    route.get("/bootstrap.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/bootstrap.min.js");
    });
    route.get("/home.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/home.js");
    });
    route.get("/favicon.ico", function (req, res) {
        res.sendFile(config.dirname + "/public/img/git.ico");
    });
    return route;
};
/**
 * Handles the Get request made to the server
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.get = function (route, config) {
    var git = require("./git");
    var validation = require("./validation");
    route.get("/", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            res.render("user/home", {
                appName: config.appName,
                userName: req.session.userData.name
            });
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/login", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/login", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/login", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/signup", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/signup", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/forgotPass", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/forgotPass", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/setting", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            var handlebarLayout = "default";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("user/setting", {
                layout: handlebarLayout,
                appName: config.appName,
                userName: req.session.userData.name
            });
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    route.get("/profile", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            var handlebarLayout = "default";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("user/profile", {
                layout: handlebarLayout,
                appName: config.appName,
                userName: req.session.userData.name
            });
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    route.get("/createRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            var handlebarLayout = "default";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("user/createRepo", {
                layout: handlebarLayout,
                appName: config.appName,
                userName: req.session.userData.name
            });
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    route.get("/logout", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.clearCookie(config.advProperties.sessionName);
            res.clearCookie(config.advProperties.cookieChecksumName);
            req.session.destroy(function (err) {
                if (err) {
                    if (config.logging) console.log(err);
                }
                res.redirect("/");
            });
        } else {
            res.redirect("/");
        }
    });
    return route;
};

/**
 * Handles the Post request made to the server
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.post = function (route, config) {
    var git = require("./git");
    var validation = require("./validation");
    route.post("/login", function (req, res) {
        var userDB = require("../dbSchema/user");
        var data = {
            eMail: req.body.eMail, //or userName
            password: req.body.password
        };
        userDB.loginUser(req, res, data, config, function (req, res, config) {
            if (config.valid) {
                req.session.regenerate(function (err) {
                    if (err) {
                        if (config.logging) console.log(err);
                        res.status(403);
                        res.send();
                    } else {
                        req.session.active = true;
                        req.session.access = {};
                        req.session.userData = {
                            name: config.result.name,
                            eMail: config.result.eMail,
                        };
                        validation.loginInitialisation(req, res, config);
                        res.redirect("/");
                    }
                });
            } else {
                var message = '<div class="alert alert-info" role="alert"><strong>Invalid UserID/Password</strong></div>';
                res.render("pages/login", {
                    message: message,
                    appName: config.appName
                });
            }
        });
    });
    route.post("/signup", function (req, res) {
        var userDB = require("../dbSchema/user");
        var data = {
            name: req.body.name,
            userName: req.body.userName,
            eMail: req.body.eMail,
            password: req.body.password,
            rPassword: req.body.rPassword,
            appName: config.appName
        };
        var message = "";
        if (data.password === data.rPassword) {
            userDB.createUser(req, res, data, config, function (req, res, config) {
                if (config.exist) {
                    message = '<div class="alert alert-info" role="alert"><strong>User already exist!</strong></div>';
                    res.render("pages/signup", {
                        message: message,
                        appName: config.appName
                    });
                } else {
                    message = '<div class="alert alert-info" role="alert"><strong>User registration successful</strong></div>';
                    res.render("pages/login", {
                        message: message,
                        appName: config.appName
                    });
                }
            });
        } else {
            message = '<div class="alert alert-info" role="alert"><strong>Password Mis-Match</strong></div>';
            res.render("pages/signup", {
                name: req.body.name,
                userName: req.body.userName,
                eMail: req.body.eMail,
                message: message,
                appName: config.appName
            });
        }
    });
    route.post("/forgot", function (req, res) {
        res.render("page/forgotPass", {

        });
    });
    route.post("/createRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.gitInit(req, res, config);
        }else{
            unAuthorisedRequest(config, res);
        }
    });
    route.post("/deleteRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.deleteRepo(req, res, config);
        }else{
            unAuthorisedRequest(config, res);
        }
    });
    return route;
};
/**
 * Handles Git related requests
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.gitRequest = function (route, config) {
    route.get(config.gitURL + '/:reponame/info/refs', function (req, res) {
        git.checkAuth(req, res, git.getInfoRefs, config);
    });
    route.post(config.gitURL + '/:reponame/git-receive-pack', function (req, res) {
        git.checkAuth(req, res, git.postReceivePack, config);
    });
    route.post(config.gitURL + '/:reponame/git-upload-pack', function (req, res) {
        git.checkAuth(req, res, git.postUploadPack, config);
    });
    return route;
};

function unAuthorisedRequest(config, res) {
    if (config.logging)
        console.log("Un-Authorised access request redirected");
    res.redirect("/");
}

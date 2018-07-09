/**
 * User Validation based on URL filter
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.userValidation = function (route, config) {
    var git = require("./git");
    var validation = require("./validation");
    //Login verification for user data
    route.all("/user*", function (req, res, next) {
        if (validation.loginValidation(req, res, config)) {
            next(); //TODO
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    //user login verification
    route.all(config.gitURL + "*", function (req, res, next) {
        if ("gzip" === req.headers["accept-encoding"] &&
            "git/" === req.headers["user-agent"].substring(0, 4)) {
            git.checkAuth(req, res, next, config);
        } else {
            if (validation.loginValidation(req, res, config)) {
                next(); //TODO
            } else {
                unAuthorisedRequest(config, res);
            }
        }
    });
    //Git/Web Access Control
    route.all(config.gitURL + "/:repoName*", function (req, res, next) {
        next(); //TODO
    });
    return route;
};
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
    route.get("/style.css", function (req, res) {
        res.sendFile(config.dirname + "/public/css/style.min.css");
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
        res.sendFile(config.dirname + "/public/img/favicon.ico");
    });
    route.get("/img/:imageName", function (req, res) {
        res.sendFile(config.dirname + "/public/img/icon/" + req.params.imageName);
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
            var gitRepo = require("../dbSchema/gitRepo");
            gitRepo.findOne({
                createdUser: req.session.userData.userNameDisplay
            }, req, res, config, function (req, res, config, result) {
                if (result) {
                    res.redirect(config.gitURL + "/" + result.repo);
                } else {
                    res.render("user/home", {
                        name: req.session.userData.name,
                        config: config
                    });
                }
            });
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/login", {
                layout: handlebarLayout,
                config: config
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
                config: config
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
                config: config
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
                config: config
            });
        }
    });
    route.get(config.gitURL + "/:repoName", function (req, res) {
        var gitRepo = require("../dbSchema/gitRepo");
        gitRepo.find({}, req, res, config, function (req, res, config, repoResult) {
            var handlebarLayout = "default";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            var currentRepoDetails = {};
            repoResult.forEach(function (repoDetails) {
                if (repoDetails.repo == req.params.repoName) {
                    currentRepoDetails.descripton = repoDetails.description;
                    currentRepoDetails.url = repoDetails.url;
                    currentRepoDetails.private = repoDetails.private;
                    currentRepoDetails.repo = repoDetails.repo;
                }
            });
            res.render("user/repoHome", {
                layout: handlebarLayout,
                helpers: {
                    selectedRepo: function (repo) {
                        if (repo == req.params.repoName) return "list-group-item-info";
                        else return "";
                    }
                },
                name: req.session.userData.name,
                repo: repoResult,
                descripton: currentRepoDetails.descripton,
                url: currentRepoDetails.url,
                private: currentRepoDetails.private,
                repoName: currentRepoDetails.repo,
                config: config
            });
        });
    });
    route.get("/user/setting", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/setting", {
            layout: handlebarLayout,
            name: req.session.userData.name,
            config: config
        });
    });
    route.get("/user/profile", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/profile", {
            layout: handlebarLayout,
            name: req.session.userData.name,
            config: config
        });
    });
    route.get("/user/createRepo", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/createRepo", {
            layout: handlebarLayout,
            name: req.session.userData.name,
            config: config
        });
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
                            userName: config.result.userName,
                            userNameDisplay: config.result.userNameDisplay,
                            eMail: config.result.eMail,
                        };
                        validation.loginInitialisation(req, res, config);
                        res.redirect("/");
                    }
                });
            } else {
                var message = '<div class="alert alert-info" role="alert"><strong>Invalid UserID/Password</strong></div>';
                res.render("pages/login", {
                    layout: "public",
                    message: message,
                    config: config
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
                    message = '<div class="alert alert-warning" role="alert"><strong>User already exist!</strong></div>';
                    res.render("pages/signup", {
                        layout: "public",
                        message: message,
                        config: config
                    });
                } else {
                    message = '<div class="alert alert-success" role="alert"><strong>User registration successful</strong></div>';
                    res.render("pages/login", {
                        layout: "public",
                        message: message,
                        config: config
                    });
                }
            });
        } else {
            message = '<div class="alert alert-info" role="alert"><strong>Password Mis-Match</strong></div>';
            res.render("pages/signup", {
                layout: "public",
                name: req.body.name,
                userName: req.body.userName,
                eMail: req.body.eMail,
                message: message,
                config: config
            });
        }
    });
    route.post("/forgot", function (req, res) {
        res.render("page/forgotPass", {
            layout: "public",
            config: config
        });
    });
    route.post("/user/createRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.gitInit(req, res, config);
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    route.post("/user/deleteRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.deleteRepo(req, res, config);
        } else {
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
    var git = require("./git");
    route.get(config.gitURL + '/:repoName/info/refs', function (req, res) {
        git.getInfoRefs(req, res, config);
    });
    route.post(config.gitURL + '/:repoName/git-receive-pack', function (req, res) {
        git.postReceivePack(req, res, config);
    });
    route.post(config.gitURL + '/:repoName/git-upload-pack', function (req, res) {
        git.postUploadPack(req, res, config);
    });
    return route;
};

function unAuthorisedRequest(config, res) {
    if (config.logging)
        console.log("Un-Authorised access request redirected");
    res.redirect("/");
}
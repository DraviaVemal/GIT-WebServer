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
    //Git login verification
    var gitRequest = false;
    route.all(config.gitURL + "/:repoName.git/?*", function (req, res, next) {
        if (req.params.repoName) {
            if ("gzip" === req.headers["accept-encoding"] &&
                "git/" === req.headers["user-agent"].substring(0, 4)) {
                gitRequest = true;
                git.checkAuth(req, res, next, config);
            } else {
                res.redirect(config.gitURL + "/" + req.params.repoName);
            }
        } else {
            res.status(401);
            res.send();
        }
    });
    //user login verification
    route.all(config.gitURL + "/:repoName/?*", function (req, res, next) {
        if (!gitRequest) {
            if (validation.loginValidation(req, res, config)) {
                next(); //TODO
            } else {
                unAuthorisedRequest(config, res);
            }
        } else {
            next(); //If it's a gitRequest Call the URL pattern match skips
        }
    });
    //Git/Web Access Control
    route.all(config.gitURL + "(/:repoName)?(*)", function (req, res, next) {
        if (req.params.repoName) {
            next(); //TODO
        } else {
            res.redirect("/");
        }
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
                    res.redirect(config.gitURL + "/" + result.repo + "/readme");
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
    route.get(config.gitURL + "/:repoName/:repoPage", function (req, res) {
        var gitRepo = require("../dbSchema/gitRepo");
        var page;
        switch (req.params.repoPage) {
            case "files":
                page = "repo/files";
                break;
            case "branchs":
                page = "repo/branchs";
                break;
            case "setting":
                page = "repo/setting";
                break;
            case "readme":
                page = "repo/readme";
                break;
            default:
                res.redirect(config.gitURL + "/" + req.params.repoName + "/readme");
                break;
        }
        if (req.body.opti) {
            //TODO : Front End Partial Load 
        } else {
            gitRepo.find({}, req, res, config, function (req, res, config, repoResult) {
                var currentRepoDetails = {};
                repoResult.forEach(function (repoDetails) {
                    if (repoDetails.repo == req.params.repoName) {
                        currentRepoDetails.descripton = repoDetails.description;
                        currentRepoDetails.url = repoDetails.url + ".git";
                        currentRepoDetails.private = repoDetails.private;
                        currentRepoDetails.repo = repoDetails.repo;
                    }
                });
                if (currentRepoDetails.url) {
                    res.render("repo/repoHome", { //Read Me
                        helpers: {
                            selectedRepo: function (repo) {
                                if (repo == req.params.repoName) return "list-group-item-info";
                                else return "";
                            },
                            activeTab: function () {
                                return page.toLowerCase();
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
                } else {
                    res.redirect("/");
                }
            });
        }
    });
    route.get("(/user)?(/user/:userPage)?", function (req, res) {
        var page;
        switch (req.params.userPage) {
            case "setting":
                page = "user/setting";
                break;
            case "profile":
                page = "user/profile";
                break;
            default:
                res.redirect("/");
                break;
        }
        if (req.body.opti) {
            //TODO : Front End Partial Load 
        }
        res.render("partials/user/" + req.params.userPage, {
            name: req.session.userData.name,
            config: config
        });
    });
    route.get("/user/createRepo", function (req, res) {
        res.render("user/createRepo", {
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
                res.render("pages/login", {
                    layout: "public",
                    failure: true,
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
    route.get(config.gitURL + '/:repoName.git/info/refs', function (req, res) {
        git.getInfoRefs(req, res, config);
    });
    route.post(config.gitURL + '/:repoName.git/git-receive-pack', function (req, res) {
        git.postReceivePack(req, res, config);
    });
    route.post(config.gitURL + '/:repoName.git/git-upload-pack', function (req, res) {
        git.postUploadPack(req, res, config);
    });
    return route;
};

function unAuthorisedRequest(config, res) {
    if (config.logging)
        console.log("Un-Authorised access request redirected");
    res.redirect("/");
}
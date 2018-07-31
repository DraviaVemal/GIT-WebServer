/**
 * User Validation based on URL filter
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.userValidation = function (route, config) {
    var git = require("./git");
    var validate = require("./validation");
    //Retrive/update loged in user privilage
    route.all("*", function (req, res, next) {
        if (validate().loginValidation(req, res, config)) {
            var accessCntrl = require("../dbSchema/accessCntrl");
            accessCntrl.accessCntrlGetAccessPermission(req, res, config, next);
        } else {
            next();
        }
    });
    //Login verification for user data
    route.all("/user*", function (req, res, next) {
        if (validate().loginValidation(req, res, config)) {
            next();
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    //Git login verification
    var gitRequest = false;
    route.all(config.gitURL + "/:repoName.git*", function (req, res, next) {
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
    route.all(config.gitURL + "/:repoName*", function (req, res, next) {
        if (!gitRequest) {
            if (validate().loginValidation(req, res, config)) {
                next(); //TODO : Futher Validation and mapping
            } else {
                unAuthorisedRequest(config, res);
            }
        } else {
            next(); //If it's a gitRequest Call the URL pattern match skips
        }
    });
    //Git/Web Access Control
    route.all(config.gitURL + "/:repoName*", function (req, res, next) {
        if (req.params.repoName) {
            var data = {
                authorised: false,
                owner: false, //Has access to repository settings
                private: false,
                userList: [{
                    userName: "",
                    readOnly: true
                }],
                readOnly: true
            };
            config.repoAccess = data;
            next(); //TODO : Access Control
        } else {
            if (gitRequest) {
                res.status(403);
                res.send();
            } else {
                res.redirect("/");
            }
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
    route.get("/bootbox.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/bootbox.min.js");
    });
    route.get("/home.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/home.js");
    });
    route.get("/favicon.ico", function (req, res) {
        res.sendFile(config.dirname + "/public/img/favicon.ico");
    });
    route.get("/fonts/:fontFile", function (req, res) {
        res.sendFile(config.dirname + "/public/fonts/" + req.params.fontFile);
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
    var validate = require("./validation");
    route.get("/", function (req, res) {
        if (validate().loginValidation(req, res, config)) {
            var gitRepo = require("../dbSchema/gitRepo");
            gitRepo.gitRepoFindOne({
                createdUser: req.session.userData.userNameDisplay
            }, req, res, config, function (req, res, config, result) {
                if (result) {
                    res.redirect(config.gitURL + "/" + result.repo + "/readme");
                } else {
                    res.render("user/home", {
                        helpers: {
                            controlPannelPage: function () {
                                if (req.session.userAccess.Serverconfiguration) {
                                    return "configuration";
                                } else if (req.session.userAccess.userControl) {
                                    return "userAccess";
                                } else {
                                    return "";
                                }
                            }
                        },
                        name: req.session.userData.name,
                        config: config,
                        userAccess: req.session.userAccess
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
        var validate = require("./validation");
        if (validate().loginValidation(req, res, config)) {
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
        var validate = require("./validation");
        if (validate().loginValidation(req, res, config)) {
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
        var validate = require("./validation");
        if (validate().loginValidation(req, res, config)) {
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
        var validate = require("./validation");
        if ((validate(req.params.repoName)
                .isNotEmpty()
                .boolResult()) &&
            (validate(req.params.repoPage)
                .isNotEmpty()
                .boolResult())) {
            var repoDetails = require("./branchesCommits");
            var headDetails = repoDetails.generalDetails(config, req.params.repoName);
            headDetails.head = validate(headDetails.head)
                .isNotEmpty()
                .boolResult() ? headDetails.head : "emptyRepository";
            res.redirect(config.gitURL + "/" + req.params.repoName + "/" + req.params.repoPage + "/" + headDetails.head);
        } else {
            if (gLogging) console.log("Invalid Input rejected");
            res.status(503);
            res.send();
        }
    });
    route.get(config.gitURL + "/:repoName/:repoPage/:repoBranch", function (req, res, next) {
        var validate = require("./validation");
        if ((validate(req.params.repoName)
                .isNotEmpty()
                .boolResult()) &&
            (validate(req.params.repoPage)
                .isNotEmpty()
                .boolResult())) {
            var gitRepo = require("../dbSchema/gitRepo");
            var page;
            var details = {};
            var repoDetails = require("./branchesCommits");
            var branchDetails = repoDetails.generalDetails(config, req.params.repoName);
            req.params.repoBranch = req.params.repoBranch || branchDetails.head;
            req.params.repoBranch = validate(req.params.repoBranch)
                .isNotEmpty()
                .boolResult() ? req.params.repoBranch : "emptyRepository";
            details.branchDropDown = branchDetails.branches;
            //Inverted Context If emptyBranch is true the repo has branches
            var emptyBranch = req.params.repoBranch != "emptyRepository";
            switch (req.params.repoPage) {
                case "files":
                    var document = require('html-element').document;
                    var directoryTree = require("directory-tree");
                    //Folder Hirecharch creation uling html doc element
                    var directoryStructureBuilder = function (data) {
                        var masterList = document.createElement('ul');
                        if (typeof directoryStructureBuilder.itemCounter == 'undefined') {
                            directoryStructureBuilder.itemCounter = 0;
                            masterList.setAttribute("class", "file-structure primary");
                        } else {
                            ++directoryStructureBuilder.itemCounter;
                            masterList.setAttribute("style", "display: none;");
                            masterList.setAttribute("class", "file-structure");
                        }
                        masterList.setAttribute("data-fileitem", directoryStructureBuilder.itemCounter);
                        for (var i in data.children) {
                            var item = document.createElement('li');
                            var itemIcon = document.createElement("span");
                            if (data.children[i].children) {
                                itemIcon.setAttribute("class", "glyphicon glyphicon-folder-close");
                                var aitem = document.createElement('a');
                                aitem.appendChild(document.createTextNode(" " + data.children[i].name));
                                aitem.setAttribute("onclick", "$('[data-fileitem=" + (directoryStructureBuilder.itemCounter + 1) + "]').toggle();");
                                item.setAttribute("href", "javascript:;;;");
                                item.appendChild(itemIcon);
                                item.appendChild(aitem);
                                item.appendChild(new directoryStructureBuilder(data.children[i]));
                            } else {
                                if (data.children[i].type == "file") {
                                    itemIcon.setAttribute("class", "glyphicon glyphicon-file");
                                } else {
                                    itemIcon.setAttribute("class", "glyphicon glyphicon-folder-open");
                                }
                                item.appendChild(itemIcon);
                                item.appendChild(document.createTextNode(" " + data.children[i].name));
                            }
                            masterList.appendChild(item);
                        }
                        return masterList;
                    };
                    var folders = directoryTree(config.dirname + "/" + config.repoDir + "/" + req.params.repoName, {
                        exclude: /.git/
                    });
                    if (folders.children.length) {
                        details.folders = new directoryStructureBuilder(folders).outerHTML;
                    } else {
                        details.folders = "<h3>Repository is empty</h3>";
                    }
                    page = "repo/files";
                    if (req.body.opti) {
                        res.render("partials/" + page, {
                            folders: details.folders
                        });
                    }
                    break;
                case "branches":
                    var branchesCommits = require("./branchesCommits");
                    details = branchesCommits.generalDetails(config, req.params.repoName);
                    var verify = false; //Check for empty repository
                    if (details.head) {
                        verify = true;
                    }
                    page = "repo/branches";
                    if (req.body.opti) {
                        res.render("partials/" + page, {
                            branchName: details.head,
                            branches: details.branches,
                            verify: verify
                        });
                    }
                    break;
                case "pullrequest":
                    page = "repo/pullRequest";
                    //TODO : Opti Load
                    break;
                case "history":
                    var branchHistory = require("./branchesCommits");
                    details.history = branchHistory.repoHistory(config, req.params.repoName);
                    page = "repo/history";
                    break;
                case "setting":
                    page = "repo/setting";
                    if (req.body.opti) {
                        gitRepo.gitRepoFindOne({
                            repo: req.params.repoName
                        }, req, res, config, function (req, res, config, repoResult) {
                            var setting = false;
                            if (repoResult.createdUser.toUpperCase() == req.session.userData.userName) {
                                setting = true;
                            }
                            res.render("partials/" + page, {
                                branchName: details.head,
                                branches: details.branches,
                                setting: setting,
                                verify: verify
                            });
                        });
                    }
                    break;
                case "readme":
                    var fileSystem = require("fs");
                    var markdown = require("markdown").markdown;
                    var path = config.dirname + "/" + config.repoDir + "/" + req.params.repoName + "/README.md";
                    if (fileSystem.existsSync(path)) {
                        var mdFileData = fileSystem.readFileSync(path, 'utf8');
                        details.readmeHTML = markdown.toHTML(mdFileData);
                    } else {
                        details.readmeHTML = '<h3 class="text-center">No README.md file found in repository</h3>';
                    }
                    if (req.body.opti) {
                        res.render("partials/" + page, {
                            readmeHTML: details.readmeHTML
                        });
                    }
                    page = "repo/readme";
                    break;
                default:
                    next();
                    break;
            }
            if (page) {
                gitRepo.gitRepoFind({}, req, res, config, function (req, res, config, repoResult) {
                    var currentRepoDetails = {};
                    repoResult.forEach(function (repoDetails) {
                        if (repoDetails.repo == req.params.repoName) {
                            currentRepoDetails.descripton = repoDetails.description;
                            currentRepoDetails.url = repoDetails.url;
                            currentRepoDetails.private = repoDetails.private;
                            currentRepoDetails.repo = repoDetails.repo;
                            if (repoDetails.createdUser.toUpperCase() == req.session.userData.userName) {
                                currentRepoDetails.setting = true;
                            }
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
                                    return page;
                                },
                                controlPannelPage: function () {
                                    if (req.session.userAccess.Serverconfiguration) {
                                        return "configuration";
                                    } else if (req.session.userAccess.userControl) {
                                        return "userAccess";
                                    } else {
                                        return "";
                                    }
                                }
                            },
                            name: req.session.userData.name,
                            repo: repoResult,
                            descripton: currentRepoDetails.descripton,
                            url: currentRepoDetails.url,
                            private: currentRepoDetails.private,
                            repoName: currentRepoDetails.repo,
                            branchName: details.head,
                            branches: details.branches,
                            readmeHTML: details.readmeHTML,
                            config: config,
                            userAccess: req.session.userAccess,
                            setting: currentRepoDetails.setting,
                            verify: verify,
                            folders: details.folders,
                            history: details.history,
                            branchDropDown: details.branchDropDown,
                            activeBranch: req.params.repoBranch,
                            emptyBranch: emptyBranch
                        });
                    } else {
                        res.redirect("/");
                    }
                });
            }
        } else {
            if (gLogging) console.log("Invalid Input rejected");
            res.status(503);
            res.send();
        }
    });
    route.get("/user/setting/:settingPage", function (req, res, next) {
        var page;
        var loadSettingPage = function () {
            res.render("user/setting", {
                helpers: {
                    controlPannelPage: function () {
                        if (req.session.userAccess.Serverconfiguration) {
                            return "configuration";
                        } else if (req.session.userAccess.userControl) {
                            return "userAccess";
                        } else {
                            return "";
                        }
                    },
                    settingPage: function () {
                        return page;
                    }
                },
                name: req.session.userData.name,
                config: config,
                userAccess: req.session.userAccess
            });
        };
        switch (req.params.settingPage) {
            case "privacy":
                page = "user/privacy";
                loadSettingPage();
                break;
            case "security":
                page = "user/security";
                loadSettingPage();
                break;
            case "notification":
                page = "user/notification";
                loadSettingPage();
                break;
            default:
                next();
                break;
        }
    });
    route.get("/user/createRepo", function (req, res) {
        if (req.session.userAccess.createRepo) {
            res.render("user/createRepo", {
                helpers: {
                    controlPannelPage: function () {
                        if (req.session.userAccess.Serverconfiguration) {
                            return "configuration";
                        } else if (req.session.userAccess.userControl) {
                            return "userAccess";
                        } else {
                            return "";
                        }
                    }
                },
                name: req.session.userData.name,
                config: config,
                userAccess: req.session.userAccess
            });
        } else {
            if (gLogging) console.log("Un-Authorized zone redirected");
            res.redirect("/");
        }
    });
    route.get("/user/controlPannel/:settingPage", function (req, res, next) {
        if (req.session.userAccess.ServerControlPannel || req.session.userAccess.userControl) {
            var page;
            var loadControlPannelPage = function (req, res, config) {
                res.render("user/controlPannel", {
                    helpers: {
                        getPage: function () {
                            return page;
                        },
                        controlPannelPage: function () {
                            if (req.session.userAccess.Serverconfiguration) {
                                return "configuration";
                            } else if (req.session.userAccess.userControl) {
                                return "userAccess";
                            } else {
                                return "";
                            }
                        },
                        currentUser: function (userName) {
                            if (userName == req.session.userData.userName) {
                                return "disabled";
                            }
                        }
                    },
                    name: req.session.userData.name,
                    config: config,
                    userAccess: req.session.userAccess,
                    user: config.userResult
                });
            };
            switch (req.params.settingPage) {
                case "configuration":
                    page = "controlPannel/configuration";
                    loadControlPannelPage(req, res, config);
                    break;
                case "userAccess":
                    var user = require("../dbSchema/user");
                    user.getAllUsers(req, res, config, function (req, res, config) {
                        loadControlPannelPage(req, res, config);
                    });
                    page = "controlPannel/userAccess";
                    break;
                default:
                    next();
                    break;
            }
        } else {
            if (gLogging) console.log("Un-Authorized zone redirected");
            res.redirect("/");
        }
    });
    route.get("/user/:userPage", function (req, res, next) {
        var page;
        var loadUserControlPage = function () {
            res.render(page, {
                helpers: {
                    controlPannelPage: function () {
                        if (req.session.userAccess.Serverconfiguration) {
                            return "configuration";
                        } else if (req.session.userAccess.userControl) {
                            return "userAccess";
                        } else {
                            return "";
                        }
                    }
                },
                name: req.session.userData.name,
                config: config,
                userAccess: req.session.userAccess
            });
        };
        switch (req.params.userPage) {
            case "setting":
                //Removed as the page will be redired to security page on empty page setting call
                // page = "user/setting";
                // loadUserControlPage();
                res.redirect("/user/setting/security");
                break;
            case "profile":
                page = "user/profile";
                loadUserControlPage();
                break;
            default:
                next();
                break;
        }
        if (req.body.opti) {
            //TODO : Front End Partial Load 
        }
    });
    route.get("/logout", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.clearCookie(config.advProperties.sessionName);
            res.clearCookie(config.advProperties.cookieChecksumName);
            req.session.destroy(function (err) {
                if (err) {
                    if (gLogging) console.log(err);
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
    var validate = require("./validation");
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
                        if (gLogging) console.log(err);
                        res.status(403);
                        res.send();
                    } else {
                        var accessData = {
                            ServerControlPannel: true,
                            userControl: true,
                        };
                        req.session.active = true;
                        req.session.access = accessData;
                        req.session.userData = {
                            name: config.result.name,
                            userName: config.result.userName,
                            userNameDisplay: config.result.userNameDisplay,
                            eMail: config.result.eMail,
                        };
                        validate().loginInitialisation(req, res, config);
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
                    message = '<div class="alert alert-warning" data-test="signupMessage" role="alert"><strong>User already exist!</strong></div>';
                    res.render("pages/signup", {
                        layout: "public",
                        message: message,
                        config: config
                    });
                } else {
                    message = '<div class="alert alert-success" data-test="signupMessage" role="alert"><strong>User registration successful</strong></div>';
                    res.render("pages/login", {
                        layout: "public",
                        message: message,
                        config: config
                    });
                    var accessCntrl = require("../dbSchema/accessCntrl");
                    accessCntrl.createUser(req, data, config);
                }
            });
        } else {
            message = '<div class="alert alert-info" data-test="signupMessage" role="alert"><strong>Password Mis-Match</strong></div>';
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
        git.gitInit(req, res, config);
    });
    route.post(config.gitURL + "/:repoName/setting", function (req, res) {
        if (req.body.repoName) {
            git.deleteRepo(req, res, config);
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
    if (gLogging)
        console.log("Un-Authorised access request redirected");
    res.redirect("/");
}
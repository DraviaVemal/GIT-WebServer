/**
 * User object cretaion function
 * @param  {JSON} user Git Authentication user details
 */
exports.User = function (user) {
    this.username = user.username;
    this.password = user.password;
};

/**
 * Check the authentication of incomming request
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {function} next Callback function(req, res, config)
 * @param  {JSON} config Master Configuration JSON
 */
exports.checkAuth = function (req, res, next, config) {
    var auth = require('http-auth');
    var basic = auth.basic({
        realm: "Web."
    }, function (userId, password, callback) {
        var data = {
            eMail: userId,
            password: password
        };
        var user = require("../dbSchema/user");
        config.git = true;
        user.loginUser(req, res, data, config, callback);
    });
    auth.connect(basic)(req, res, next);
};

/**
 * Git clone request handling (Get method)
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.getInfoRefs = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var service = req.query.service;
    var repoName = req.params.repoName;
    if (gLogging) console.log('GET ' + service + ' / ' + repoName);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-' + service + '-advertisement');
    var packet = "# service=" + service + "\n";
    var length = packet.length + 4;
    var hex = "0123456789abcdef";
    var prefix = hex.charAt(length >> 12 & 0xf);
    prefix = prefix + hex.charAt(length >> 8 & 0xf);
    prefix = prefix + hex.charAt(length >> 4 & 0xf);
    prefix = prefix + hex.charAt(length & 0xf);
    res.write(prefix + packet + '0000');
    if (service == "git-upload-pack") {
        service = "gitUpload";
    } else {
        service = "gitReceive";
    }
    var git;
    if (process.platform === "win32") {
        git = spawn(config.dirname + "/scripts/" + service + ".cmd", ['--stateless-rpc', '--advertise-refs', config.repoDir + "/" + repoName + ".git"]);
    } else if (process.platform === "linux") {
        git = spawn(config.dirname + "/scripts/" + service + ".sh", ["--stateless-rpc", "--advertise-refs", config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git"]);
    } else {
        res.status(503);
        res.send();
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (gLogging) console.log("stderr: " + data);
    });
    git.on('exit', function () {
        res.end();
    });
};

/**
 * Git Push code handling (Post Method)
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.postReceivePack = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var repoName = req.params.repoName;
    if (gLogging) console.log('POST git-receive-pack / ' + repoName);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    var git;
    if (process.platform === "win32") {
        git = spawn(config.dirname + "/scripts/" + "gitReceive.cmd", ['--stateless-rpc', config.repoDir + "/" + repoName + ".git"]);
    } else if (process.platform === "linux") {
        git = spawn(config.dirname + "/scripts/" + "gitReceive.sh", ["--stateless-rpc", config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git"]);
    } else {
        res.status(503);
        res.send();
    }
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (gLogging) console.log("stderr: " + data);
    });
    git.on('exit', function () {
        res.end();
        exports.syncRepo(req, res, {
            repo: repoName
        }, config);
    });
};

/**
 * Git clone request handling (Post method)
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.postUploadPack = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var repoName = req.params.repoName;
    if (gLogging) console.log('POST git-upload-pack / ' + repoName);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    var git;
    //TODO : Remove Script Files
    if (process.platform === "win32") {
        git = spawn(config.dirname + "/scripts/" + "gitUpload.cmd", ['--stateless-rpc', config.repoDir + "/" + repoName + ".git"]);
    } else if (process.platform === "linux") {
        git = spawn(config.dirname + "/scripts/" + "gitUpload.sh", ["--stateless-rpc", config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git"]);
    } else {
        res.status(503);
        res.send();
    }
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (gLogging) console.log("stderr: " + data);
    });
};

/**
 * Function to create and initialise Git repository in DB and File system
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.gitInit = function (req, res, config) {
    var validate = require("./validation");
    if (validate(req.body.repo).isNotEmpty().boolResult()) {
        var gitDB = require("../dbSchema/gitRepo");
        var privateRepo = false;
        if (req.body.type == "private") privateRepo = true;
        var data = {
            repo: req.body.repo,
            createdUser: req.session.userData.userNameDisplay,
            url: req.protocol + "://" + req.hostname + config.gitURL + "/" + req.body.repo + ".git",
            private: privateRepo,
            description: req.body.repoDescription
        };
        gitDB.gitRepoCreate(req, res, data, config, function (req, res, config) {
            var fileSystem = require("fs");
            if (!fileSystem.existsSync(config.repoDir + "/" + data.repo + ".git")) {
                fileSystem.mkdirSync(config.repoDir + "/" + data.repo + ".git");
            }
            if (fileSystem.existsSync(config.repoDir + "/" + data.repo)) {
                fileSystem.rmdirSync(config.repoDir + "/" + data.repo);
            }
            var simpleGit = require('simple-git')(config.repoDir + "/" + data.repo + ".git" + "/");
            simpleGit.init(true, function (err) {
                if (err) {
                    if (gLogging) {
                        console.log(err);
                        res.status(403);
                        res.send();
                    }
                } else {
                    res.redirect(config.gitURL + "/" + config.gitRepo.repo + "/readme");
                }
            });
        });
    } else {
        if (gLogging) console.log("Error : No Repo name received in Init");
        res.status(403);
        res.send();
    }
};
/**
 * Delete the Git repository from DB and File System
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.deleteRepo = function (req, res, config) {
    var validate = require("./validation");
    if (validate(req.params.repoName).isNotEmpty().boolResult()) {
        var gitDB = require("../dbSchema/gitRepo");
        var data = {
            repo: req.params.repoName
        };
        gitDB.gitRepoDelete(req, res, data, config, function () {
            var fileSystem = require("fs");
            var rimraf = require('rimraf');
            if (fileSystem.existsSync(config.dirname + "/" + config.repoDir + "/" + data.repo)) {
                if (gLogging) console.log("Clone repo deletion started");
                rimraf(config.dirname + "/" + config.repoDir + "/" + data.repo, function (err) {
                    if (err) {
                        if (gLogging) console.log(err);
                    }
                });
            } else {
                if (gLogging) console.log("Repo clone directory not found");
            }
            if (fileSystem.existsSync(config.appRoutePath + "/" + config.repoDir + "/" + data.repo + ".git")) {
                if (gLogging) console.log("Repo deletion started");
                rimraf(config.appRoutePath + "/" + config.repoDir + "/" + data.repo + ".git", function (err) {
                    if (err) {
                        if (gLogging) console.log(err);
                    } else {
                        if (gLogging) console.log("Repository deleted successfully");
                    }
                });
            } else {
                if (gLogging) console.log("Repo directory not found");
            }
            //TODO : Repo deletion msg feedback
            res.redirect("/");
            //TODO : Error handling
        });
    } else {
        if (gLogging) console.log("Error : No Repo name received in delete");
        res.status(403);
        res.send();
    }
};
/**
 * Delete the Git repository from DB and File System
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 * @param  {{repo:String,outputFile:String}} data Required data
 * @param {object} next Execute at sucessful execution functuin(res,data,config)
 */
exports.syncRepo = function (req, res, data, config, next) {
    var fullGitHistory = require('full-git-history'),
        checkHistory = require('full-git-history/test/check-history');
    data.outputFile = data.outputFile || "history.json";
    fullGitHistory([config.repoDir + "/" + data.repo + ".git/", '-o', config.repoDir + "/" + data.repo + ".git/" + data.outputFile], function (error) {
        if (error) {
            if (gLogging) console.error("Cannot read history: " + error.message);
        } else {
            if (next) {
                next(req, res, config);
            }
        }
    });
    if (req.body.repoReadMe != "") { // Avoid pull on created empty repository
        var simpleGit = require('simple-git')(config.dirname + "/" + config.repoDir + "/" + data.repo + "/");
        simpleGit.pull(function (err) {
            if (err) {
                if (gLogging) console.log(err);
            } else {
                if (gLogging) console.log("Repo : " + data.repo + " Sync completed");
            }
        });
    }
};
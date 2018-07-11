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
    if (config.logging) console.log('GET ' + service + ' / ' + repoName);
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
    var git = spawn(service + ".cmd", ['--stateless-rpc', '--advertise-refs', config.repoDir + "/" + repoName]);
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (config.logging) console.log("stderr: " + data);
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
    if (config.logging) console.log('POST git-receive-pack / ' + repoName);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    var git = spawn("gitReceive.cmd", ['--stateless-rpc', config.repoDir + "/" + repoName]);
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (config.logging) console.log("stderr: " + data);
    });
    git.on('exit', function () {
        var fullGitHistory = require('full-git-history'),
            checkHistory = require('full-git-history/test/check-history');
        fullGitHistory([config.repoDir + "/" + repoName + "/", '-o', config.repoDir + "/" + repoName + "/history.json"], function (error) {
            if (error) {
                if (config.logging) console.error("Cannot read history: " + error.message);
                return;
            }
            //TODO : Validate history need to be organised
            // if (checkHistory(config.repoDir + "/" + repoName + "/history.json")) {
            //     if (config.logging) console.log('No errors in history.');
            // } else {
            //     console.log('History has some errors.');
            // }
            res.end();
        });
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
    if (config.logging) console.log('POST git-upload-pack / ' + repoName);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    var git = spawn("gitUpload.cmd", ['--stateless-rpc', config.repoDir + "/" + repoName]);
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (config.logging) console.log("stderr: " + data);
    });
};

/**
 * Function to create and initialise Git repository in DB and File system
 * @param  {object} req Request Object
 * @param  {object} res Response Object
 * @param  {JSON} config Master Configuration JSON
 */
exports.gitInit = function (req, res, config) {
    var validation = require("./validation");
    if (validation.variableNotEmpty(req.body.repo)) {
        var gitDB = require("../dbSchema/gitRepo");
        var privateRepo = false;
        if (req.body.type == "private") privateRepo = true;
        var data = {
            repo: req.body.repo,
            createdUser: req.session.userData.userNameDisplay,
            url: req.protocol + "://" + req.host + config.gitURL + "/" + req.body.repo,
            private: privateRepo,
            description: req.body.repoDescription
        };
        gitDB.gitRepoCreate(req, res, data, config, function (req, res, config) {
            var fileSystem = require("fs");
            if (!fileSystem.existsSync(config.repoDir + "/" + req.body.repo)) {
                fileSystem.mkdirSync(config.repoDir + "/" + req.body.repo);
            }
            var simpleGit = require('simple-git')(config.repoDir + "/" + req.body.repo + "/");
            simpleGit.init(true, function (err) {
                if (err) {
                    if (config.logging) {
                        console.log(err);
                        res.status(403);
                        res.send();
                    }
                } else {
                    var fullGitHistory = require('full-git-history'),
                        checkHistory = require('full-git-history/test/check-history');
                    fullGitHistory([config.repoDir + "/" + data.repo + "/", '-o', config.repoDir + "/" + data.repo + "/history.json"], function (error) {
                        if (error) {
                            if (config.logging) console.error("Cannot read history: " + error.message);
                            return;
                        }
                        //TODO : Validate history need to be organised
                        // if (checkHistory(config.repoDir + "/" + repoName + "/history.json")) {
                        //     if (config.logging) console.log('No errors in history.');
                        // } else {
                        //     console.log('History has some errors.');
                        // }
                        res.redirect(config.gitURL + "/" + config.gitRepo.repo+"/readme");
                    });
                }

            });
        });
    } else {
        if (config.logging) console.log("Error : No Repo name received in Init");
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
    var validation = require("./validation");
    if (validation.variableNotEmpty(req.body.repo)) {
        var gitDB = require("../dbSchema/gitRepo");
        var data = {
            repo: req.body.repo
        };
        gitDB.gitRepoDelete(req, res, data, config, function () {
            var fileSystem = require("fs");
            if (fileSystem.existsSync(config.repoDir + "/" + req.body.repo)) {
                var rimraf = require('rimraf');
                rimraf(config.repoDir + "/" + req.body.repo, function () {
                    if (config.logging) console.log("Repositorie deleted successfully");
                    res.send("done");
                });
            } else {
                if (config.logging) console.log("Repositorie not found");
                res.send("done");
            }
        });
    } else {
        if (config.logging) console.log("Error : No Repo name received in delete");
        res.status(403);
        res.send();
    }
};
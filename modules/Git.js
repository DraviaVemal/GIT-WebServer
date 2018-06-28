exports.User = function (user) {
    this.username = user.username;
    this.password = user.password;
};

exports.checkAuth = function (req, res, next, config) {
    var auth = require('http-auth');
    var reponame = req.params.reponame;
    var users = config.defaultUsers;
    var repositories = config.repositories;
    if (repositories != undefined && repositories[reponame] != undefined)
        users = repositories[reponame];
    if (users.length > 0) {
        var basic = auth.basic({
            realm: "Web."
        }, function (username, password, callback) {
            if (config.logging) console.log("Authenticating user " + username + " for " + reponame + " ...");
            var passed = false;
            for (i = 0; i < users.length; i++) {
                if (users[i].username === username && users[i].password === password) {
                    passed = true;
                    break;
                }
            }
            if (config.logging)
                if (!passed) console.log("Authentication failed");
            callback(passed);
        });
        (auth.connect(basic))(req, res, next);
    } else {
        next(req, res, config);
    }

};

exports.getInfoRefs = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var service = req.query.service;
    var reponame = req.params.reponame;
    if (config.logging) console.log('GET ' + service + ' / ' + reponame);
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
    var git = spawn(service + ".cmd", ['--stateless-rpc', '--advertise-refs', config.repoDir + "/" + reponame]);
    git.stdout.pipe(res);
    git.stderr.on('data', function (data) {
        if (config.logging) console.log("stderr: " + data);
    });
    git.on('exit', function () {
        res.end();
    });
};

exports.postReceivePack = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var reponame = req.params.reponame;
    if (config.logging) console.log('POST git-receive-pack / ' + reponame);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    var git = spawn("gitReceive.cmd", ['--stateless-rpc', config.repoDir + "/" + reponame]);
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
        fullGitHistory(["../" + config.repoDir + "/" + reponame + "/", '-o', "../" + config.repoDir + "/" + reponame + "/history.json"], function (error) {
            if (error) {
                if (config.logging) console.error("Cannot read history: " + error.message);
                return;
            }
            if (checkHistory("../" + config.repoDir + "/" + reponame + "/history.json")) {
                if (config.logging) console.log('No errors in history.');
            } else {
                console.log('History has some errors.');
            }
            res.end();
        });
    });
};

exports.postUploadPack = function (req, res, config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var reponame = req.params.reponame;
    if (config.logging) console.log('POST git-upload-pack / ' + reponame);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    var git = spawn("gitUpload.cmd", ['--stateless-rpc', config.repoDir + "/" + reponame]);
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

exports.gitInit = function (req, res, config) {
    var gitDB = require("../dbSchema/git");
    var gitRepo = gitDB.gitRepo(config);
    gitRepo.create({
        Repo: req.body.repo,
        logicName: req.body.repo.toUpperCase()
    }, function (err) {
        if (config.logging)
            if (err) console.log(err);
    });
    var simpleGit = require('simple-git')("../" + config.repoDir + "/" + req.body.repo + "/");
    simpleGit.init(true, function (err) {
        if (!err) res.send("done");
        else {
            if (config.logging) console.log(err);
            res.send("fail");
        }
    });
};

exports.deleteRepo = function (req, res, config) {
    var fileSystem = require("fs");
    if (fileSystem.existsSync("../" + config.repoDir + "/" + req.body.repo + "/")) {
        fileSystem.unlinkSync("../" + config.repoDir + "/" + req.body.repo + "/");
        if (config.logging) console.log("Repository deleted");
    } else {
        if (config.logging) console.log("Repository folder not found");
    }
    res.send("done");
};
exports.User = function (config) {
    this.username = config.username;
    this.password = config.password;
};

exports.checkAuth = function (req, res, next,config) {
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
        next(req, res,config);
    }

};

exports.getInfoRefs = function (req, res,config) {
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
    git.on('exit', function() {
        res.end();
    });
};

exports.postReceivePack = function (req, res,config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var reponame = req.params.reponame;
    if (config.logging) console.log('POST git-receive-pack / ' + reponame);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    var git = spawn("git-receive-pack.cmd", ['--stateless-rpc', config.repoDir + "/" + reponame]);
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function(data) {
        if (config.logging) console.log("stderr: " + data);
    });
    git.on('exit', function() {
        res.end();
    });
};

exports.postUploadPack = function (req, res,config) {
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var reponame = req.params.reponame;
    if (config.logging) console.log('POST git-upload-pack / ' + reponame);
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    var git = spawn("git-upload-pack.cmd", ['--stateless-rpc', config.repoDir + "/" + reponame]);
    if (req.headers['content-encoding'] == 'gzip') {
        req.pipe(zlib.createGunzip()).pipe(git.stdin);
    } else {
        req.pipe(git.stdin);
    }
    git.stdout.pipe(res);
    git.stderr.on('data', function(data) {
        if (config.logging) console.log("stderr: " + data);
    });
};
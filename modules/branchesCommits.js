/**
 * Returns the specifired Repository branch detaisl
 * @param  {object} config Repository Name
 * @param  {String} repoName Repository Name
 */
exports.generalDetails = function (config, repoName) {
    var fileSystem = require("fs");
    if (fileSystem.existsSync(config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git/history.json")) {
        var historyString = fileSystem.readFileSync(config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git/history.json");
        var historyJSON = {};
        var branchName = [];
        try {
            historyJSON = JSON.parse(historyString);
        } catch (err) {
            if (config.logging) console.log(err);
            //TODO Error Handling
        }
        for (var branchHeads in historyJSON.heads) {
            branchName.push(branchHeads);
        }
        var data = {
            head: historyJSON.REFS.HEAD,
            branches: branchName
        };
        return data;
    } else {
        return {};
    }
};

/**
 * Returns all commit history in with branch ref
 * @param  {object} config Repository Name
 * @param  {String} repoName Repository Name
 */
exports.repoHistory = function (config, repoName) {
    var fileSystem = require("fs");
    if (fileSystem.existsSync(config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git/history.json")) {
        var historyString = fileSystem.readFileSync(config.appRoutePath + "/" + config.repoDir + "/" + repoName + ".git/history.json");
        var historyJSON = {};
        var result =[];
        try {
            historyJSON = JSON.parse(historyString);
        } catch (err) {
            if (config.logging) console.log(err);
            //TODO Error Handling
        }
        for(var i in historyJSON.commits){
            var data = {
                author:historyJSON.commits[i].author.user.name,
                message:historyJSON.commits[i].message,
                timestamp:historyJSON.commits[i].committer.date,
                sha:historyJSON.commits[i].sha1.substr(0,7),
                branch:historyJSON.commits[i].refs
            };
            result.push(data);
        }
        return result;
    } else {
        return {};
    }
};
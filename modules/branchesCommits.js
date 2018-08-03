/**
 * Returns the specifired Repository branch detaisl
 * @param  {object} config Repository Name
 * @param  {String} repoName Repository Name
 */
exports.generalDetails = function (config, repoName) {
    var execSync = require('child_process').execSync;
    var cmd = "git branch";
    //get the list of branch from executing git command in bare repo
    //the list is spilt into array and last empty record is removed
    var branchArray = execSync(cmd, {
            encoding: 'utf8',
            cwd: config.dirname + "/" + config.repoDir + "/" + repoName + ".git"
        })
        .split('\n')
        .slice(0, -1);
    //Branch details sanitisation to remove current branch * mentioning
    for (var branch in branchArray) {
        branchArray[branch] = branchArray[branch]
            .replace("*", "")
            .trim();
    }
    //Data formating to return data to the caller
    var data = {
        head: branchArray[0],
        branches: branchArray
    };
    return data;
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
        var result = [];
        try {
            historyJSON = JSON.parse(historyString);
        } catch (err) {
            if (gLogging) console.log(err);
            //TODO Error Handling
        }
        for (var i in historyJSON.commits) {
            var data = {
                author: historyJSON.commits[i].author.user.name,
                message: historyJSON.commits[i].message,
                timestamp: historyJSON.commits[i].committer.date,
                sha: historyJSON.commits[i].sha1.substr(0, 7),
                branch: historyJSON.commits[i].refs
            };
            result.push(data);
        }
        return result;
    } else {
        return {};
    }
};
/**
 * Returns JSON file structure of repo branch
 * @param  {object} config Repository Name
 * @param  {String} repoName Repository Name
 * @param  {String} branch Branch Name in that Repository
 */
exports.repoFileStructure = function (config, repoName, branch) {
    var execSync = require('child_process').execSync;
    //TODO : Branch,repoName sanitisation
    //Git Command to get the file structure of specific branch
    var cmd = "git ls-tree -r --name-only " + branch;
    //Recives the return string list and split it to array,removing the last empty entry
    var filesArray = (function () {
        try {
            return execSync(cmd, {
                    encoding: 'utf8',
                    cwd: config.dirname + "/" + config.repoDir + "/" + repoName + ".git"
                })
                .split('\n')
                .slice(0, -1);
        } catch (err) {
            if (gLogging) console.log(err);
            return "";
        }
    });
    var output = {};
    var current;
    //Loop to formulate the array input to structured JSON output
    //Note : This structure should be maintained. UI is built based on current format
    //Object pointer logic is used in this loop
    for (var a = 0; a < filesArray.length; a++) {
        var s = filesArray[a].split('/');
        current = output;
        for (var i = 0; i < s.length; i++) {
            if (s[i] != '') {
                if (current[s[i]] == null) {
                    current[s[i]] = {
                        name: s[i],
                        type: s[i].indexOf('.') !== -1 ? "file" : "Directory"
                    };
                }
                current = current[s[i]];
            }
        }
    }
    return output;
};
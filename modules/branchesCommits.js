/**
 * Returns the specifired Repository branch and commit detaisl
 * @param  {object} config Repository Name
 * @param  {String} repoName Repository Name
 */
exports.generalDetails = function (config, repoName) {
    var fileSystem = require("fs");
    if (fileSystem.existsSync(config.dirname + "/" + config.repoDir + "/" + repoName + "/history.json")) {
        var historyString = fileSystem.readFileSync(config.dirname + "/" + config.repoDir + "/" + repoName + "/history.json");
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
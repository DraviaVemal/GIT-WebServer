exports.webServer = function (appRoutePath) {
    config = {};
    var uidGenerator = require('node-unique-id-generator');
    var fileSystem = require('fs');
    if (fileSystem.existsSync("config.json")) {
        var fileString = fileSystem.readFileSync('config.json', 'utf8');
        try {
            config = JSON.parse(fileString);
        } catch (e) {
            console.log("Input Config file damaged.");
            console.log("Check file \"config_broke.json\" for inspection");
            console.log("Back up \"config.json\" file generated to launch the application");
            if (fileSystem.existsSync("config_broke.json")) {
                fileSystem.unlinkSync("config_broke.json");
            }
            fileSystem.rename("config.json", "config_broke.json", function (err) {
                if (err) {
                    console.log(err);
                }
            });
            config = {
                salt: uidGenerator.generateGUID(),
                cluster: true,
                logging: false,
            };
            fileSystem.writeFileSync("config.json", JSON.stringify(config));
        }
    } else {
        config = {
            salt: uidGenerator.generateGUID(),
            cluster: true,
            logging: false,
        };
        fileSystem.writeFileSync("config.json", JSON.stringify(config));
    }
    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;
    var gitWebServer = require("./Git-WebServer");
    config.numCPUs = config.numCPUs || numCPUs;
    config.appRoutePath = appRoutePath;
    if (cluster.isMaster && config.cluster) {
        console.log("Server Running in Cluster");
        for (var i = 0; i < config.numCPUs; i++) {
            cluster.fork();
        }
        cluster.on('exit', function (worker, code, signal) {
            console.log("worker " + worker.process.pid + " died");
        });
    } else {
        gitWebServer.server(config);
    }
};
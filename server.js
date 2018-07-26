/**
 * Exports module to initialise from external app
 * @param  {String} appRoutePath Accepts caller current directory path __dirname
 */
module.exports = function (appRoutePath) {
    config = {};
    //external dependency
    var uidGenerator = require('node-unique-id-generator');
    var fileSystem = require('fs');
    //Check Config Json exist
    if (fileSystem.existsSync("config.json")) {
        //Read config Json file 
        var fileString = fileSystem.readFileSync('config.json', 'utf8');
        //try catch to hande broken config json file read
        try {
            //parse json data from file to config variable
            config = JSON.parse(fileString);
        } catch (e) {
            console.log("Input Config file damaged.");
            console.log("Check file \"config_broke.json\" for inspection");
            console.log("Back up \"config.json\" file generated to launch the application");
            //deleting existing brokent config json file if exist
            if (fileSystem.existsSync("config_broke.json")) {
                fileSystem.unlinkSync("config_broke.json");
            }
            //renaming broken config json file
            fileSystem.rename("config.json", "config_broke.json", function (err) {
                if (err) {
                    console.log(err);
                }
            });
            //Passing defalut parameter to config variable
            config = {
                salt: uidGenerator.generateGUID(),
                cluster: true,
                logging: false,
            };
            //writing the default parameter to config json file for future read
            fileSystem.writeFileSync("config.json", JSON.stringify(config));
        }
    } else {
        //If config file not exist default parameter is loded in config variable
        config = {
            salt: uidGenerator.generateGUID(),
            cluster: true,
            logging: false,
        };
        //writing the default parameter to config json file for future read
        fileSystem.writeFileSync("config.json", JSON.stringify(config));
    }
    //external dependency
    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;
    //internal dependency
    var gitWebServer = require("./Git-WebServer");
    //updating config variable with additional data based on condition
    //load max possible  no. of cpu count to config.numCPUs if no data received from config json file
    config.numCPUs = config.numCPUs || numCPUs; 
    //App root path (package.json) location
    config.appRoutePath = appRoutePath;
    //Repo directory created based on user input or default input
    config.repoDir = config.repoDir || "repos";
    //Git-WebServer root directory is loaded in config file
    config.dirname = __dirname;
    //Create repo.git --bare repo is user app route path
    if (!fileSystem.existsSync(config.appRoutePath + "/" + config.repoDir)) {
        fileSystem.mkdirSync(config.appRoutePath + "/" + config.repoDir);
    }
    //Create repo clone directory inside Git-WebServer Projuct folder
    if (!fileSystem.existsSync(config.dirname + "/" + config.repoDir)) {
        fileSystem.mkdirSync(config.dirname + "/" + config.repoDir);
    }
    //if the config cluster option is true the server is ran in cluster mode
    //Initial cluster master will pass though this loop
    //fork child process based on no. of available cpu or config cluster no.
    if (cluster.isMaster && config.cluster) {
        console.log("Server Running in Cluster");
        for (var i = 0; i < config.numCPUs; i++) {
            //fork worker child
            cluster.fork();
        }
        //Event lister to listen for worker failure
        cluster.on('exit', function (worker, code, signal) {
            console.log("worker " + worker.process.pid + " died");
            //fork child process to replace the died worker
            cluster.fork();
        });
    } 
    //Cluster worker process will go thought the app code.
    else {
        //call the server funtion exported from Git-WebServer File
        gitWebServer.server(config);
    }
};
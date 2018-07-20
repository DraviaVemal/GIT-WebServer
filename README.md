# Message
    Under Development wait for release v1.0.0 for backward compatable updates to start

#Beta version instalation
    npm i git-webserver

#Beta version deployment
    In app file Ex:"index.js"
    ```javascript
    require("git-webserver")(__dirname);
    ```
# Config option
    create config.json in root directory
    Available options

   | Option |   Type   | required | Description | Default |
   | ------ |:------- :|:--------:|:-----------:| -------:|
   | salt   | String | true  | Encription secrect key.| *auto* |
   | cluster| Bool | false | To run the app in cluster mode across multiple processor. | true |
   | logging| Bool | false | Console logging. | false |
   | port   | Integer | false | port number for your application. | 80 |
   | gitURL | String | false | URL path for your git replository. | "/git"|
   | appName| String | false | Application name. | "Git-WebServer" |
   | dbname | String | false | DataBase name. | "GitWebServer" |
   | dbURL  | String | false | DataBase connection url. | "localhost" |
   | dbUser | String | false | DataBase Authendication user. | "" |
   | dbPassword | String | false | DataBase Authendication password. | "" |

    Note : There are still many config features provided to make application flexible to run in multiple environment.
    The detailed documents will be updated in future.

# Description
    Web base version control system backed by GIT.

# Contribution
    Contributors are welcome.
    please contact at contact@draviavemal.com for details.

# Supported Platform
    Windows
    Linux

# Pre-Requirement
        Node JS
        Git SCM
        MongoDB

    Note : Development underway to remove Git SCM dependency and to support multiple database.

# Ideas
    -All ideas are welcome and will be considered seriously for incorporation
# Git-WebServer

## Message

    Under Development project, wait for release v1.0.0 for backward compatable updates to start

## Beta version installation

    npm i git-webserver

## Beta version deployment

    In app file Ex:"index.js"

```javascript
require("git-webserver")(__dirname);
```

## Scope Coverd

    User Authentication System both web and git push
    Git Repo. Creation, File Explorer, Branch View, General History,Deletion
    Basic UI for all functionality

## Config option

    create config.json in root directory
    Available options

   | Option |   Type   | required | Description | Default |
   | ------ |:--------:|:--------:|:-----------:| -------:|
   | salt   | String | true  | Encription secrect key.| *auto* |
   | cluster| Bool | false | To run the app in cluster mode across multiple processor. | true |
   | logging| Bool | false | Console logging. | false |
   | port   | Integer | false | port number for your application. | 80 |
   | gitURL | String | false | URL path for your git repository. | "/git"|
   | appName| String | false | Application name. | "Git-WebServer" |
   | dbname | String | false | DataBase name. | "GitWebServer" |
   | dbURL  | String | false | DataBase connection url. | "localhost" |
   | dbUser | String | false | DataBase Authendication user. | *empty* |
   | dbPassword | String | false | DataBase Authendication password. | *empty* |

    Note : There are still many config features provided to make application flexible to run in multiple environment.
    The detailed documents will be updated in future.

## Description

    Web base version control system backed by GIT.

## Contribution

    Please have the code well commented.
    Cypress is the testing system used by dev team.
    add your code's test case in cypress if required before raising PR
    Contributors are welcome.
    please contact at contact@draviavemal.com for details.

## Supported Platform

    Windows
    Linux

## Pre-Requirement

    Node JS
    Git SCM
    MongoDB

    Note : Development underway to remove Git SCM instalation dependency and to support multiple database.

## TODO

    Pull Request Handling
    Code documentaion
    Test Case Update for dynamic feature
    UI modernisation
    Brute force protection
    Request rate limiter
    Strengthen validation and sanitisation

## Ideas

    -All ideas are welcome and will be considered seriously for incorporation
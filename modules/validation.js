/**
 * Function is used to check variable data is not empty
 * @param  {var} variable Variable to be checked
 * @param  {Integer} Lenght Min. lenght of variable - Default : 1 
 * @param  {JSON} config Master Configuration JSON
 * @returns {bool} return variable is empty or not
 */
exports.variableNotEmpty = function (variable, Lenght,config) {
    if (typeof (variable) != "number" && typeof (variable) != "object") {
        var lenght = Lenght || 1;
        if (variable != null && variable != undefined && variable != "" && variable.lenght >= lenght) {
            return true;
        } else return false;
    }else{
        if(config.logging) console.log("Invalid Input to function");
        return false;
    }
};
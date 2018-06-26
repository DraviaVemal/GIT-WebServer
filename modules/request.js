exports.get=function(route){
    route.get("/",function(req,res){
        res.render("pages/home",{

        });
    });
    route.get("/login",function(req,res){
        res.render("pages/login",{

        });
    });
    route.get("/signup",function(req,res){
        res.render("pages/signup",{

        });
    });
    route.get("/forgot",function(req,res){
        res.render("page/forgotPass",{

        });
    });
    return route;
};
exports.post=function(route){
    route.post("/login",function(req,res){
        res.render("pages/login",{

        });
    });
    route.post("/signup",function(req,res){
        res.render("pages/signup",{

        });
    });
    route.post("/forgot",function(req,res){
        res.render("page/forgotPass",{
            
        });
    });
    return route;
};
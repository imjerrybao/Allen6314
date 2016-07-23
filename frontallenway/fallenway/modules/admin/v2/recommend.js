var express = require('express');
var router = express.Router();
var request = require('request');

var Config = require('../../config/globalconfig.js');
var config = new Config();

var MyCookies = require('../../common_utils/mycookies.js');
var mycookies = new MyCookies();

var Logger = require('../../config/logconfig.js');
var logger = new Logger().getLogger();

var async = require('async');

router.get('',function(req,res,next){
    async.parallel({
        tags:function(callback){
            var url = config.getBackendUrlPrefix() + "auth/tag/find-tags-by-moduleid?moduleid=aaac4e63-2222-4def-a86c-6543d80a8a59";
            var options = {
                url:url,
                headers:{
                    'Authorization': "Bearer " + mycookies.getAdminAuthorizationCookie()
                },
            }
            request(options,function(error,response,body){
                var returnData = JSON.parse(body);
                if(returnData.statusCode != 0){
                    logger.error("admin/recommend.js -- /auth/tag/find-tags-by-moduleid fail ..." +
                            "response.statusCode = 200, but returnData.statusCode = " + returnData.statusCode);
                    res.render('error/unknowerror');
                } else {
                    callback(null,returnData.data.tags);
                }
            });
        },
        recommends:function(callback){
            var url = config.getBackendUrlPrefix() + "auth/recommend/find-all-recommends";
            var options = {
                url:url,
                headers:{
                    'Authorization': "Bearer " + cookies[AdminAuthorization]
                }
            }
            request(options,function(error,response,body){
                var returnData = JSON.parse(body);
                if(returnData.statusCode != 0){
                    logger.error("admin/recommend.js -- /auth/recommend/find-all-recommends fail ..." +
                        "response.statusCode = 200, but returnData.statusCode = " + returnData.statusCode);
                    res.render('error/unknowerror');
                } else {
                    callback(null,returnData.data.recommends);
                }
            })
        }
    },function(err,results){
        if(!err){
            logger.error(err.stack);
            res.render('error/unknowerror');
        } else {
            var data = {};
            data.tags = results.tags;
            data.recommends = results.recommends;
            res.render('admin/recommend/recommendIndex',{'data':results});
        }
    })
})



router.post('/add-recommend',function(req,res,next){
    var url = config.getBackendUrlPrefix() + "auth/recommend/add-recommend";
    var data = {profile:req.body.profile,link:req.body.link,classify:req.body.classify,other:req.body.other};

    var options = {
        url:url,
        headers:{
            'Authorization': "Bearer " + mycookies.getAdminAuthorizationCookie()
        },
		form:data
    }

    request.post(options,function(error,response,body){
        if(!error && response.statusCode == 200 ){
            var returnData = JSON.parse(body);
            if(returnData.statusCode == 0){
			    res.redirect('/admin/recommend');
		    } else {
                logger.error("admin/recommend.js -- /auth/recommend/add-recommend fail ..." +
                    "response.statusCode = 200, but returnData.statusCode = " + returnData.statusCode);
                res.render('error/unknowerror');
    	    }
        } else {
            logger.error("admin/recommend.js --  /auth/recommend/add-recommend fail ..." +
                "error = " + error);
            if(response != null){
                logger.error("admin/recommend.js -- /auth/recommend/add-recommend fail ..." +
                    "response.statuCode = " + response.statusCode + "..." +
                    "response.body = " + response.body);
            }
            res.render('error/unknowerror');
    	}
	});
})


module.exports = router;
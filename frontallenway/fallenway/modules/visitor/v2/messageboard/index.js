var express = require('express');
var router = express.Router();

var Logger = require('../../../../config/logconfig');
var logger = new Logger().getLogger();

var request = require('request');
var async = require('async');

var Config = require('../../../../config/globalconfig');
var config = new Config();



var getModule = function(callback){
    request(config.getBackendUrlPrefix() + "module/find-all-modules",function(error,response,body){
        if(!error && response.statusCode == 200){
            var returnData = JSON.parse(body);
            if(returnData.statusCode == 0){
                callback(null,returnData.data.modules);
            } else {
                logger.error("visitor/v2/visitor_learning/index.js -- module/find-all-modules fail ..." +
                    " returnData.statusCode = " + returnData.statusCode);
                res.render('error/unknowerror');
            }
        } else {
            res.render('error/unknowerror');
        }
    });
}




router.get('',function(req,res,next){
    async.parallel({
        modules:function(callback){
            getModule(callback);
        },
        messages_totalPage:function(callback){
            var url = config.getBackendUrlPrefix() + "message/find-messages-by-page?" +
                         "page=1" + "&size=" + config.getMessageListPageSize();
            logger.debug("url = " + url);
            request(url,function(error,response,body){
                var returnData = JSON.parse(body);
                if(returnData.statusCode == 0){
                    callback(null,returnData.data);
                } else {
                    logger.error("visitor/v2/messageboard/index.js -- module/find-all-modules fail ..." +
                        " returnData.statusCode = " + returnData.statusCode);
                    res.render('error/unknowerror');
                }
            });
        }
    },function(err,result){
        if(err == null){
            result.messages = result.messages_totalPage.messages;
            result.totalPage = new Array();
            for(var i = 1; i <= result.messages_totalPage.totalPage;i++){
                result.totalPage[i-1] = i;
            }
            result.nowPageLeft = 0;
            result.nowPage = 1;
            result.nowPageRight = 2;
            res.render('visitor/v3/messageboard/index',{"data":result});
        } else {
            logger.error(err.stack);
            res.render('error/unknowerror');
        }
    })
});


/*
 * 分页查询 留言 信息
 */
router.get('/page',function(req,res,next){
    var pageNum = req.query.pagenum;
    logger.debug("pageNum = " + pageNum);
    async.parallel({
        modules:function(callback){
            getModule(callback);
        },
        messages_totalPage:function(callback){
            var url = config.getBackendUrlPrefix() + "message/find-messages-by-page?" +
                         "page=" + pageNum + "&size=" + config.getMessageListPageSize();
            logger.debug("url = " + url);
            request(url,function(error,response,body){
                var returnData = JSON.parse(body);
                if(returnData.statusCode == 0){
                    callback(null,returnData.data);
                } else {
                    logger.error("visitor/v2/messageboard/index.js -- /page -- message/find-messages-by-page? fail ..." +
                        " returnData.statusCode = " + returnData.statusCode);
                    res.render('error/unknowerror');
                }
            });
        }
    },function(err,result){
        if(err == null){
            result.messages = result.messages_totalPage.messages;
            result.totalPage = new Array();
            for(var i = 1; i <= result.messages_totalPage.totalPage;i++){
                result.totalPage[i-1] = i;
            }
            result.nowPageLeft = parseInt(pageNum) - 1;
            result.nowPage = pageNum;
            result.nowPageRight = parseInt(pageNum) + 1;
            res.render('visitor/v3/messageboard/index',{"data":result});
        } else {
            logger.error(err.stack);
            res.render('error/unknowerror');
        }
    })
})




router.post('/addmessage',function(req,res,next){
    var username = req.body.username;
    var content = req.body.content;
    logger.debug("username = " + username + " content = " + content);

    if(validAddMessage(username,content)){
        var options = {
    	    url:config.getBackendUrlPrefix() + "message/save-message",
	        form:{"username":username,"content":content}
        }
        request.post(options,function(error,response,body){
            if(!error && response.statusCode == 200){
                var returnData = JSON.parse(body);
                if(returnData.statusCode == 0){
                    res.redirect('/visitor/messageboard');
                } else {
                    logger.error("visitor/v2/messagesboard/index.js -- /addmessage fail ..." +
                        " returnData.statusCode = " + returnData.statusCode);
                    res.render('error/unknowerror');
                }
            } else {
                logger.error("visitor/v2/messagesboard/index.js -- /addmessage fail ..." +
                    "error = " + error);
                res.render('error/unknowerror');
            }
        });
    } else {
        logger.error("validAddMessage(username,content) == false!");
        res.render('error/unknowerror');
    }
})


function validAddMessage(username,content){
    if(username == null || content == null){
        return false;
    } else if (username.trim() == '' || content.trim() == ''){
        return false;
    } else if(username.length > 100 || content.length > 100){
        return false;
    } else if(username.indexOf('\'') > -1 || content.indexOf('\'') > -1){
        return false;
    } else if(username.indexOf('\"') > -1 || content.indexOf('\"') > -1){
        return false;
    } else if(username.indexOf('<') > -1 || content.indexOf('<') > -1){
        return false;
    } else if(username.indexOf('>') > -1 || content.indexOf('>') > -1){
        return false;
    } else {
         return true;
    }
}


module.exports = router;

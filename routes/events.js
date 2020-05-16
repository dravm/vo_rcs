var express = require('express');
var router = express.Router();
var db = require("../core/db");

//	Check if login exists in DB.
router.post('/addEvent', function (req, res) {	
    console.log("Event received. Type: " + JSON.stringify(req.body.type));

    var event = req.body;

	db.addEvent(event, event.reporterId, function(event){
		event ? res.sendStatus(200) : res.sendStatus(500);
	});
});


module.exports = router;
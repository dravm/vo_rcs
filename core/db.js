var Sequelize = require("sequelize");
var crypto = require('crypto');
var fs = require("fs");
var path = require('path');
const colors = require('./colors');


//TODO: CUSTOMERS <<<<------>>>> USERS TABLE //////////////////////////////////////////////// 



/* ---------------- DATABASE DEFINITION ---------------- */

var sequelize = new Sequelize('database', 'root', 'pass', {
	host : 'localhost',
	dialect : 'sqlite',

	pool : {
		max : 10,
		min : 0,
		idle : 10000
	},

	// SQLite only
	storage : '../database.sqlite',
	logging: false
});

/* ---------------- MODELS DEFINITIONS ---------------- */

//  User model.
const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
	firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },
	lastName: {
        type: Sequelize.STRING,
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false
    },
	login: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
	randomString: {
        type: Sequelize.STRING,
        allowNull: false
    },
    hash: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    //	Model table name will be the same as the model name
	freezeTableName : true
});

//  Project system model.
const Project = sequelize.define('project', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
	name: {
        type: Sequelize.STRING,
        allowNull: false
    },
	description: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
    //	Model table name will be the same as the model name
	freezeTableName : true
});

//  Remote system model.
const Reporter = sequelize.define('reporter', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
	name: {
        type: Sequelize.STRING,
        allowNull: false
    },
	description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    location: {
        type: Sequelize.STRING,
        unique: true
    },
	login: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
	randomString: {
        type: Sequelize.STRING,
        allowNull: false
    },
    hash: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    //	Model table name will be the same as the model name
	freezeTableName : true
});

//  Event model.
const Event = sequelize.define('event', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    timestamp: {
        type: Sequelize.STRING,
        defaultValue: ""
    },
    description: {
        type: Sequelize.STRING,
        defaultValue: ""
    },
    properties: {
        type: Sequelize.STRING,
        defaultValue: ""
    },
}, {
    //	Model table name will be the same as the model name
	freezeTableName : true
});

//  Image model.
const Image = sequelize.define('image', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    imagePath: {
        type: Sequelize.STRING,
        defaultValue: ""
    }
}, {
    //	Model table name will be the same as the model name
	freezeTableName : true
});


/* ---------------- DATABASE ASSOCIATIONS ---------------- */

User.belongsToMany(Project, {through: 'user_project'});
Project.belongsToMany(User, {through: 'user_project'});

Project.belongsToMany(Reporter, {through: 'project_reporter'});
Reporter.belongsToMany(Project, {through: 'project_reporter'});

Reporter.hasMany(Event, {as: 'Events'});

User.hasOne(Image);
Image.belongsTo(User);

/* ---------------- DATABASE ASSOCIATIONS ---------------- */

//  Converts Object to JSON object (when saving elements in the DB).
function convertJSONtoOBJ(object) {
    try {
        var jsonObj = JSON.parse(object);
        if (jsonObj)
            jsonObj = jsonObj.get({ plain: true });
    }
    catch(e) {

    } 
}

//  Converts JSON object to Object (when retrieving elements from the DB).
function convertOBJtoJSON(obj) {
    for (var field in obj) {
        if (field && obj.hasOwnProperty(field)) {
            try {
                obj.field = JSON.stringify(obj.field);
            }
            catch (e) {
                console.log(e.stack);
            }
        }
    }
}

User.beforeValidate(convertOBJtoJSON);
User.afterFind(convertJSONtoOBJ);

Project.beforeValidate(convertOBJtoJSON);
Project.afterFind(convertJSONtoOBJ);

Reporter.beforeValidate(convertOBJtoJSON);
Reporter.afterFind(convertJSONtoOBJ);

Event.beforeValidate(convertOBJtoJSON);
Event.afterFind(convertJSONtoOBJ);

Image.beforeValidate(convertOBJtoJSON);
Image.afterFind(convertJSONtoOBJ);


/* ---------------- DB FUNCTIONS ---------------- */

/* ---------------- GENERAL ---------------- */

//  Resets the database and destroys all tables.
module.exports.reset = function() {
    User.destroy();
    Project.destroy();
    Reporter.destroy();
    Event.destroy();
    Image.destroy();
};

//  Generates a random string and an encrypted sha512 string as a password, given a password string.
function generateSHA512Pass(password, randomString, onResult) {
    var passObj = {};
    passObj.randomString = randomString;
    if (!randomString)
        passObj.randomString = crypto.randomBytes(16).toString('hex');
    passObj.hash = crypto.pbkdf2Sync(password, passObj.randomString, 100000, 512, 'sha512').toString('hex');        
    onResult(passObj);
}

//  Returns the users count.
module.exports.countUsers = function(onResult) {
    User.count().then(onResult(count));
};

/* ---------------- USERS ---------------- */

//  Adds a user to the DB.
module.exports.addUser = function(user, onResult) {
    if (user.password && user.login) {
        generateSHA512Pass(user.password, null, function(passObj) {
            user.randomString = passObj.randomString;
            user.hash = passObj.hash;
            User.create(user).then(function(userDB) {
                onResult(userDB);
            }, function(error) {
                onResult(null, error);
            });
        });
    } else {
        //TODO: go away 
    }
    
};

//  Retrieve a user given it's id.
module.exports.getUserById = function(userId, onResult) {
    User.findOne({
        where: {
            id: userId
        }
    }).then(onResult);
};

//  Retrieves a user given it's login.
module.exports.getUserByLogin = function(userLogin, onResult) {
    User.findOne({
        where: {
            login: userLogin
        }
    }).then(onResult);
};

//  Checks a user's login.
module.exports.checkUserLogin = function(login, password, onResult) {
    module.exports.getUserByLogin(login, function(user) {
        if (!user) {
            console.log("db: No such user " + login, "db", colors.FgRed);
            onResult(false);
        }
        else {
            console.log("db: Found user " + login, "db");
            generateSHA512Pass(password, user.randomString, function(passObj) {
                onResult(user.hash === passObj.hash);
            });
        }
    });
};

//  Remove a user given it's id.
module.exports.removeUser = function(userId, onResult) {
    User.destroy({
        where: {
            id: userId
        }
    }).then(onResult);
};

//  Retrieves all users from the DB.
module.exports.getAllUsers = function(onResult) {
    User.findAll().then(onResult);
};

//  Get users whom names begin with the given string
module.exports.searchUserPrefix = function(prefix, onResult) {
    module.exports.getAllUsers(function(users) {
        var userList = [];

        users.forEach(function(user) { 
            var fullname = user.firstName + " " + user.lastName;
            if (prefix !== "*" && fullname.indexOf(prefix) === 0) {
                console.log("found: " + fullname);
                userList.push({ label: fullname, id: user.id });
            }
            else if (prefix === "*") {
                console.log("pushing all: " + fullname);
                userList.push({ label: "*" + fullname + "*", id: user.id });   
            }
        });
        onResult(userList);
    });
};

//  Changes a given user's profile image.
/* module.exports.changeUserProfilePic = function(user, images, onResult) {

    user.getProfileImages().then(function(imagesDB) {
        //  If its empty, it means that the user had no profile image before, and had the regular user.png profile.
        //  Just add the newly given image without removing anything.
        if (imagesDB.length === 0) {
            addProfile(images);
        }

        //  There was a custom profile image before, delete it, and then add the new image.
        else {
            var oldImage = imagesDB[0];
            //  Remove the profile image from the UserProfileImage table.
            user.removeProfileImage(oldImage);
            //  Removes an image object from the Image table and also from the file system.
            module.exports.removeImage(oldImage, function() {
                addProfile(images);
            });
        }
    });

    //  Adds the profile image (from the images array which is size 1..).
    function addProfile(images) {
        if (images.length !== 0) {
            images.forEach(function(imageObj) {
                module.exports.addImage(imageObj, function(image) {
                    user.addProfileImage(image).then(onResult(image.imagePath));
                });
            });
        }
        else {
            onResult();
        }
    }
}; */

/* ---------------- PROJECTS ---------------- */

//  Adds a project to the DB.
module.exports.addProject = function(project, userId, onResult) {    
	Project.create(project).then(function(projectDB) {
        module.exports.getUserById(userId).then((userDB) => {
            return userDB.addReporter(projectDB)
        }); 
	}, function(error) {
		onResult(null, error);
	});
};


//  Retrieve a project given it's id.
module.exports.getProjectById = function(projectId, onResult) {
    Project.findOne({
        where: {
            id: projectId
        }
    }).then(onResult);
};

//  Retrieves projects belong to the given user.
module.exports.getProjectsByUser = function(userId, onResult) {
    module.exports.getUserById(userId, function(user) {
        user.getProjects().then(onResult);
    });
};


/* ---------------- REPORTERS ---------------- */


//  Adds a reporter to the DB.
module.exports.addReporter = function(reporter, projectId, onResult) {    

	Reporter.create(reporter).then(function(reporterDB) {

        module.exports.getProjectById(projectId).then((projectDB) => {
            return projectDB.addReporter(reporterDB)
        }); 
	}, function(error) {
		onResult(null, error);
	});
};


//  Retrieves reporters defined by the given user.
module.exports.getReportersByProject = function(projectId, onResult) {
    module.exports.getProjectById(projectId, function(project) {
        project.getReporters().then(onResult);
    });
};


module.exports.getAllReporters= function(onResult) {
    Reporter.findAll().then(onResult);
};


//  Retrieve a reporter by id.
module.exports.getReporterById = function(reporterId, onResult) {
    Reporter.findOne({
        where: {
            id: reporterId
        }
    }).then(onResult);
};


/* ---------------- EVENTS ---------------- */


//  Adds a reporter to the DB.
module.exports.addEvent = function(event, reporterId,  onResult) {    

	Event.create(event).then(function(eventDB) {
        var test = eventDB;

        module.exports.getReporterById(reporterId, (reporterDB) => {
            reporterDB.addEvent(eventDB).then(onResult);
        }); 
	}, function(error) {
		onResult(null, error);
	});
};


//  Retrieves events belongs to the given reporter.
module.exports.getEventsByReporter = function(reporterId, onResult) {
    module.exports.getReporterById(reporterId, function(reporter) {
        //TODO: check existence
        reporter.getEvents().then(onResult);
    });
};

//  Retrieve a reporter by id.
module.exports.getEventById = function(eventId, onResult) {
    Event.findOne({
        where: {
            id: eventId
        }
    }).then(onResult);
};

module.exports.getAllEvents= function(onResult) {
    //TODO: Check if necessary
    Event.findAll().then(onResult);
};


/* ---------------- IMAGES ---------------- */

//  Adds an image to the DB.
/* module.exports.addImage = function(image, onResult) {
	Image.create(image).then(function(imageDB) {
		onResult(imageDB);
	}, function(error) {
		onResult(null, error);
	});
};


//  Removes an image object from the Image table and also from the file system.
module.exports.removeImage = function(image, onResult) {
    if (image.imagePath.split("/").pop !== "user.png") {
        try {
            fs.unlink(path.join(__dirname, image.imagePath), function() {
                console.log("db: Successfully removed image " + path.join(__dirname, image.imagePath));
                Image.destroy({
                    where: {
                        id: image.id
                    }
                }).then(onResult);
            });
        }
        catch(err) {
            console.log("db: Error while removing image.");
            onResult();
        }
    }
};


//  Gets an image object given it's id.
module.exports.getImageById = function(imageId, onResult) {
    Image.findOne({
        where: {
            id: imageId
        }
    }).then(onResult);
}; */

module.exports.sha = generateSHA512Pass;

function initdb(){
    console.log('INITIALIZATION OF DB', "db", colors.FgGreen);

    // Create the models
    User.sync();
    Project.sync();
    Reporter.sync();
    Event.sync();
    Image.sync();

    sequelize.sync();
    /* ... //TODO: default values for tests */
}

initdb();
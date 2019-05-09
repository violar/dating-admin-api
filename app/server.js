const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');
const cors       = require('cors');
const User       = require('users');
const jwt        = require('jsonwebtoken');
const initMongoConnection = require('database-connection');
const initMysqlConnection = require('database-connection');
const mysqlConnection = initMysqlConnection();
initMongoConnection();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 8080;

const router = express.Router();

router.use(function(req, res, next) {
    next();
});

router.route('/joinReport')
    .post(verifyToken, (req, res) => {
        jwt.verify(req.token, process.env.SCHMUCKS_JWT_SECRET, (err) => {
            if(err) {
                res.status(404);
            } else { 
                if(req.body.groupBy === "joinDay") {
                    mysqlConnection.query(`
                    SELECT 
                        CAST(created_date AS Date) AS CreatedDate, 
                        COUNT(id) AS TotalJoins,
                        sum(IF(completion_status = 1, 1, 0)) as Incomplete,  
                        sum(IF(completion_status = 2, 1, 0)) as Complete
                    FROM users
                    WHERE 
                        CAST(created_date AS Date) BETWEEN "${req.body.startDate}" AND "${req.body.endDate}"
                    GROUP BY 
                        CAST(created_date AS Date);`,
                    function (err, result) {
                        if(err) {
                            res.status(404).json({
                                message: "not working"
                            });
                        } 

                        res.status(200).json({
                            result,
                            group: "dayJoin"
                        });
                    });
                } else if(req.body.groupBy === "joinMonth") {
                    mysqlConnection.query(`

                    SELECT 
                        MONTHNAME(CAST(created_date AS Date)) AS CreatedDate, 
                        COUNT(id) AS TotalJoins,
                        sum(IF(completion_status = 1, 1, 0)) as Incomplete,  
                        sum(IF(completion_status = 2, 1, 0)) as Complete
                    FROM users
                    WHERE 
                        CAST(created_date AS Date) BETWEEN "${req.body.startDate}" AND "${req.body.endDate}"
                    GROUP BY 
                        MONTH(created_date);`,
                        
                    function (err, result) {
                        if(err) {
                            res.status(404).json({
                                message: "not working"
                            });
                        } 

                        res.status(200).json({
                            result,
                            group: "monthJoin"
                        });
                    });
                }
            }
        })
    });

router.route('/createUser')
    .post(function(req, res) {

        var user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        user.save(function(err) {
            if(err){
                console.log(err);
                return handleError(err);
            }

            res.status(201).json({
                message: 'User created!',
                createdUser: user
            });
        });
    });

router.route('/authenticateUser')
    .post((req, res) => {

        User.findOne({email: req.body.email}, function(err, userExists){
           
            if(err){
                return handleError(err);
            }
            else {
                if(userExists && userExists.password === req.body.password) {
                    jwt.sign({userExists}, process.env.SCHMUCKS_JWT_SECRET, (err, token) => {
                        if(err){
                            res.status(500).json({error: 'Token not created'})
                        }
                        res.status(200).json({
                            token: token
                        })
                    });
                }
                else {
                    res.status(401).json({error: 'Incorrect Login'});
                } 
            }
        })
    });


//VERIFY TOKEN middleware
function verifyToken(req, res, next) {
    //get auth header value
    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
        //split at the space, turn string into array, look for space and split there
        const bearer = bearerHeader.split(' ');
        //get token from array
        const bearerToken = bearer[1];
        //set the token
        req.token = bearerToken;
        //next middleware
        next();
    } else {
        //Forbidden
        res.status(403).json({error: 'Forbidden'});
    }
}


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
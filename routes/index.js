var express = require('express');
const csvdata = require('csvdata');

var mysql = require('mysql');

var conn  = mysql.createConnection({
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'challenge'
});

var router = express.Router();

var MyData = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/revenue', function(req,res) {
    var sql = "SELECT transaction_year as YEAR, SUM(amount) as Revenue\n" +
        "FROM challenge.user_transactions\n" +
        "GROUP BY transaction_year";

    conn.query(sql, function (err, result) {
        if(err) throw err;

        console.log(result[0].total);
        res.send(result);
    })
});

router.get('/activeusers', function(req, res) {
    var sql = "SELECT distinct transaction_year as Year, count(user_id) as activeusers\n" +
        "FROM challenge.user_transactions\n" +
        "GROUP BY transaction_year";

    conn.query(sql, function (err, result) {
        if(err) throw err;

        console.log(result[0].activeUsers);
        res.send(result);
    })
});

router.get('/newusercount', function(req, res) {
    var sql = "SELECT distinct joining_year as Year, count(user_id) as newusers FROM challenge.user_transactions GROUP BY joining_year";

    conn.query(sql, function (err, result) {
        if(err) throw err;

        res.send(result);
    })
});

router.get('/arpau', function(req, res) {
    var sql = "SELECT user_id as user,\n" +
        "       SUM(amount) amount\n" +
        "FROM\n" +
        "    user_transactions\n" +
        "GROUP BY user;"

    conn.query(sql, function (err, result) {
        if(err) throw err;

        console.log(result);

     res.send(result);
    })
});

/* POST request to process the data */
router.post('/processData', function(req,res) {

    console.log(req.body);

    csvdata.load(__dirname+'/'+req.body.inputFile).then((data) => {

        //console.log(data);

        for(var i=0;i<data.length;i++) {
            var parsedData = data[i]['user\ttransaction date\tsales amount\tjoin date\tregion'].split(/\s+/);

            //insert data into mysql db

          //  console.log(parsedData[0] + " " + parsedData[1] + " " + parsedData[2] + " " + parsedData[3] + " " + parsedData[4]);

            var user_id = parsedData[0];
            var transaction_date = parsedData[1];
            var amount = parsedData[2];
            var join_date = parsedData[3];
            var region = parsedData[4];

            var parsedDate = transaction_date.split('/');

            var tran_month = parsedDate[0];
            var tran_day = parsedDate[1];
            var tran_year = parsedDate[2];

            var parsedDate1 = join_date.split('/');

            var join_month = parsedDate1[0];
            var join_day = parsedDate1[1];
            var join_year = parsedDate1[2];


           // console.log(user_id+" "+tran_month+" "+tran_day+" "+tran_year+" "+amount+" "+region+" "+join_month+" "+join_day+" "+join_year);

            var processed = [user_id, join_month, tran_month, amount, region, join_day, join_year, tran_day,tran_year];

            MyData.push(processed);
        }
    }).then(err => {
        if(err) throw err;

       console.log(MyData.length);

       var sql ="INSERT INTO user_transactions(user_id,joining_month,transaction_month,amount,region,joining_day,joining_year,transaction_day,transaction_year) VALUES ?";

       conn.query(sql, [MyData], function(err) {
          if(err) throw err;
          console.log("Data inserted");
          res.send("Data inserted Successfully");
       });

    })
});
module.exports = router;

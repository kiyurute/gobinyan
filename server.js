var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sanitize = require('validator').sanitize;
var fs= require('fs');
const { check, validationResult } = require('express-validator');
const port = process.env.PORT || 3000;
const mysql = require('mysql');
const AWS = require('aws-sdk')


require('date-utils');


AWS.config.loadFromPath('credentials.json');
AWS.config.update({region: 'ap-northeast-1'});
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// s3.listBuckets(function(err, data) {
//     if (err) {
//       console.log("Error", err);
//     } else {
//       console.log("Success", data.Buckets);
//     }
//   });
  

const connection=mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'choco',
    database: 'practice'
  });

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

let rName;
let rCreateTime;
let rCommentSum;


const rooms={
    room1:[rName,rCreateTime,rCommentSum]  
};


http.listen(port, function () {
    console.log('listening on:' + port);
});

app.get('/',(req,res)=>{
    res.render('top.ejs');
})

var loginValidate=[
    check('uname','').trim().escape()
];

app.post('/index',loginValidate,(req,res)=>{
    let uname=req.body.name;
    connection.query(
        'SELECT * FROM rooms',
        (error,results)=>{
            console.log(results);
            let samename=0;
            // res.render('index.ejs',{uname:uname,results:results,samename:samename});
            let target='index?uname='+uname+'&exists=';
            res.redirect(target);
        }
    )  
})


app.get('/index',(req,res)=>{
    let uname=req.query.uname;
    let exists=req.query.exists;
    setTimeout(roomquery,500);
    function roomquery(){
    connection.query(
        'SELECT * FROM rooms',
        (error,results)=>{
            console.log(results);
            let samename=0;
            res.render('index.ejs',{uname:uname,results:results,samename:samename});
        }
    )}  
})


app.post('/joinRoom',(req,res)=>{
    let roomName=req.body.roomName;
    let mberTableName="mber_table_of_"+roomName;
    let msgTableName="msg_table_of_"+roomName;
    let uname=req.body.uname;
    let mber;
    let msg;
    let samename=0;

    connection.query(
        'SELECT * FROM ??',
        [mberTableName],
        (error,results)=>{
            results.forEach((results)=>{
                if(results.name===uname){
                    samename+=1;
                }
            });
            if(samename>0){
                connection.query(
                    'SELECT * FROM rooms',
                    (error,results)=>{
                        // res.render('index.ejs',{uname:uname,results:results,samename:samename});
                        let target='index?uname='+uname+'&exists=true';
                        res.redirect(target);
                    }
                )
            }else{
            mber=results;
            let target='joinRoom?roomName='+roomName+'&uname='+uname;
            res.redirect(target);
            
            }
        }
    )
})

app.get('/joinRoom',(req,res)=>{
    let roomName=req.query.roomName;
    let mberTableName="mber_table_of_"+roomName;
    let msgTableName="msg_table_of_"+roomName;
    let uname=req.query.uname;
    connection.query(
        'SELECT * FROM ??',
        [msgTableName],
        (error,results)=>{
            let msg=results;
            connection.query(
                'SELECT * FROM ??',
                [mberTableName],
                (error,results)=>{
                    let mber=results;
                    res.render('room.ejs',{roomName:roomName,uname:uname,mber:mber,msg:msg});
                }
            )
        }
    )
});

var roomCreateValidation=[
    check('roomName','').trim().escape()
]


app.post('/room-create',roomCreateValidation,(req,res)=>{
    let roomName=req.body.roomName;
    let msgTableName="msg_table_of_"+roomName;
    let mberTableName="mber_table_of_"+roomName;
    let uname=req.body.uname;
    let roomExist=0;

    connection.query(
        'SELECT * FROM rooms',
        (error,results)=>{
            results.forEach((result)=>{
                if(result.rname===roomName){
                    roomExist+=1;
                }else{}
            })

            if(roomExist>0){
                let target='index?uname='+uname+'&roomexists=true';
                res.redirect(target);
            }else{
                connection.query(
                    'INSERT INTO rooms SET id=0, rname=?, start=NOW(),builder=?,numofpeople=0',
                    [roomName,uname],
                    (error,results)=>{
                        connection.query(
                            "CREATE TABLE ??(id INT AUTO_INCREMENT,time DATETIME,text TEXT,postedby TEXT,isimg TEXT,PRIMARY KEY(id)) DEFAULT CHARSET=utf8;",
                            [msgTableName],
                            (error,results)=>{
                                connection.query(
                                    "CREATE TABLE ??(id INT AUTO_INCREMENT,name TEXT,jointime DATETIME,lefttime DATETIME,PRIMARY KEY(id)) DEFAULT CHARSET=utf8;",
                                    [mberTableName],
                                    (error,results)=>{
                                        connection.query(
                                            'SELECT * FROM rooms',
                                            (error,results)=>{
                                                // res.redirect(307,'/index');
                                                let samename=0;
                                                // res.render('index.ejs',{uname:uname,results:results,samename:samename});
                                                let target=`index?uname=${uname}`;
                                                res.redirect(target);
                                            })
                                    }
                                )
                                
                            }
                        )
                    }
                )

            }
        }
    )

})

// app.get('/index.ejs',(req,res)=>{
//     res.render('index.ejs');
// })

var searchvalidation=[
    check('searchword').trim().escape()
]


app.post('/room-search',searchvalidation,(req,res)=>{
    let uname=req.body.uname;
    let searchword=req.body.searchword;
    let samename=0;
    console.log(searchword);
    connection.query(
        "SELECT * FROM rooms WHERE rname LIKE '%"+searchword+"%'",
        (error,results)=>{     
            console.log('resulets is '+results);
            res.render('index.ejs',{uname:uname,results:results,samename:samename});
        }
    )
})

// app.get('/joinRoom',(req,res)=>{
//     res.render('room.ejs');
// })

io.on('connection',(socket)=>{
    let username;
    let mberTableName;
    let currentRoomName;
    console.log('socket connected');

    socket.on('joinRoom',(roomName,uname)=>{
        username=uname;
        currentRoomName=roomName;
        mberTableName="mber_table_of_"+roomName; 
        
        socket.join(roomName);
            connection.query(
                'UPDATE rooms SET numofpeople=numofpeople+1 WHERE rname=?',
                [currentRoomName],
                (error,results)=>{
                    connection.query(
                        'INSERT INTO ?? VALUE (0,?,NOW(),NULL);',
                        [mberTableName,uname],
                        (error,results)=>{
                            connection.query(
                                'SELECT * FROM ??',
                                [mberTableName],
                                (error,results)=>{
                                    console.log(results);
                                    socket.to(roomName).emit('newJoined',results);
                                    socket.emit('newJoined',results);
                                }
                                )
                        }
                    )
                }
            )
                  
            
    })

    let counter=0;


    socket.on('sendmsg',(data)=>{
        counter+=1;
        console.log(data);
        console.log(counter);
        let msgval=data.msgval;
        let poster=data.poster;
        let img=data.img;
        let msgtable='msg_table_of_'+currentRoomName;
        let imgname;
        // fs.writeFile('getimg.text',img,function(error){});

        var dt = new Date();
        var formatted = dt.toFormat("YYYYMMDDHH24MISS");
        console.log(formatted);

        if(img!==undefined){
            imgname=formatted;
            const params={
                Bucket:"gobinyan",
                Key:formatted,
                Body:img
            };

            s3.upload(params,(err,data)=>{
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
            })
        }else{
            imgname=null;
        }

        // msgval=sanitize(rowmsgval).xss();
        connection.query(
            'INSERT INTO ?? VALUE (0,NOW(),?,?,?)',
            [msgtable,msgval,poster,imgname],
            (error,results)=>{
                console.log('insert result is ');
                console.log(results);
                connection.query(
                    'SELECT * FROM ?? ORDER BY id DESC LIMIT 1;',
                    [msgtable],
                    (error,results)=>{
                        if(error){
                            console.log('error');
                        }else{
                        console.log('new msg is ');//ここが繰り返されている
                        console.log(results);
                        socket.to(currentRoomName).emit('msgsendcomp',results);
                        socket.emit('msgsendcomp',results);
                        }

                    }
                    )
                
            }
        )
    })


    socket.on('disconnecting',()=>{
        console.log(username+' is disconnected');
        //ここにmberデータベースからメンバーを消す処理 
        connection.query(
            'UPDATE rooms SET numofpeople=numofpeople-1 WHERE rname=?',
            [currentRoomName],
            (error,results)=>{
                connection.query(
                    'DELETE FROM ?? WHERE name=?',
                    [mberTableName,username],
                    (error,results)=>{
                        connection.query(
                            'SELECT * FROM ??',
                            [mberTableName],
                            (error,results)=>{
                                socket.to(currentRoomName).emit('newJoined',results);
        
                            }
                        )
                    }
                )

            }
        )
        

    })

})
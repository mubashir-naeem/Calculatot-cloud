const requestIp = require('request-ip');
const fs = require("fs");
let dateTime = require('node-datetime');
let blocked = [];
let data = [];

function read_data() {
    try {
        data = JSON.parse(fs.readFileSync("./db.json"));
    } catch (err) {
        console.log(err);
        return;
    }
}

function get_user_object(ip){
    return data.find(item => {
        return item.ip == ip;
    })
}
function update_user_object(ip,user){
    let updated = false;
    for(let i=0;i < data.length; i++){
        if (data[i].ip === ip){
            data[i] = user;
            updated = true;
            break;
        }
    }
    if(!updated)
    {
        data.push(user);
    }
    fs.writeFileSync('./db.json', JSON.stringify(data))
}

function reset_count(ip){
    for(let i=0;i < data.length; i++){
        if (data[i].ip === ip) {
            data[i].count = 0;
            break;
        }
    }
    fs.writeFileSync('./db.json', JSON.stringify(data))
}

module.exports = function(server){
    //route - calculator
    server.route({
        method: 'GET',
        path: '/calculator/{par1}/{op}/{par2}',
        handler: async function (request, h) {
            let clientIp = requestIp.getClientIp(request);
            let check_blocked = blocked.find(item => {
                return clientIp === item.ip;
            })
            if(check_blocked)
                return [{status:-1,answer:"Blocked"},{}]

            let user = get_user_object(clientIp);
            if(!user)
            {
                user = {
                    ip:clientIp,
                    count:0,
                    total_requests:0,
                    requests:[]
                }
            }

            if(user.count<20) {
                const num1 = parseInt(request.params.par1);
                const num2 = parseInt(request.params.par2);
                const op = request.params.op;
                let result = calculate(num1,num2,op);
                if(result.status === 1) {
                    let dt = dateTime.create();
                    let new_data = {
                        id: user.requests.length + 1,
                        equation: num1 + op + num2 + "=" + result.answer,
                        time_stamp: dt.format('Y-m-d H:M:S')
                    }
                    user.count = user.count + 1;
                    user.total_requests = user.total_requests + 1;
                    user.requests.push(new_data);
                }
                update_user_object(clientIp,user);
                return [result,user];
            }
            else{
                blocked.push({createdAt: Date.now(), ip: clientIp});
                return [{status:-1,answer:"Blocked"},{}]
            }
        }
    });
}
function calculate(num1, num2, op){
    if (isNaN(num1) || isNaN(num2)) {
        return {
            status: 0,
            answer: "invalid"
        }
    }
    let result = '';
    switch (op) {
        case "+":
            result = num1 + num2;
            break;
        case "-":
            result = num1 - num2;
            break;
        case "*":
            result = num1 * num2;
            break;
        case "/":
            result = num1 / num2;
            break;
        case "%":
            result = num1 % num2;
            break;
    }
    if(result === '')
    {
        return {
            status: 0,
            answer: "invalid"
        };
    }
    return {
        status: 1,
        answer: result
    };

}
read_data();
let maxLifespan = 200000
// check once per second
setInterval(function checkItems(){
    console.log(blocked)
    blocked.forEach(function(item){
        if(Date.now() - maxLifespan > item.createdAt){
            console.log("removed blocked list");
            reset_count(item.ip);
            blocked.shift() // remove first item
        }
    })
}, 10000)
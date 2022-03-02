//Hapi framework
const Hapi = require('hapi');

//Address and port
const host = 'localhost';
const port = 3000;

//Create server
const server = Hapi.Server({
    host: host,
    port: port
});

//Start server
const init = async () => {
    await server.start();
    console.log("Server up! Port: " + port);
}

require("./routes")(server);
//Start App
init();

module.exports = {
    apps: [
        {
            name: "get_parked_server",
            script: './server.js',
            watch: false,
            instances: 2,
            exec_mode: "cluster",
        }
    ]
}

#!/usr/bin/env node

const http = require('http')
const finalhandler = require('finalhandler')
const Router = require('osprey').Router
const morgan = require('morgan')

const ospreyMockService = require('../')

const argv = require('yargs')
  .usage(
    'Generate an API mock server from a RAML definition.\n\n' +
    'Usage: $0 -f [file] -p [port number] --cors'
  )
  .demand(['f', 'p'])
  .describe('f', 'Path to the RAML definition')
  .describe('p', 'Port number to bind the proxy')
  .describe('cors', 'Enable CORS with the API')
  .argv

const options = {
  cors: !!argv.cors
}

ospreyMockService.loadFile(argv.f, options)
  .then(function (app) {
    const router = new Router()

    // Log API requests.
    router.use(morgan('combined'))
    router.use(app)

    const server = http.createServer(function (req, res) {
      router(req, res, finalhandler(req, res))
    })

    server.listen(argv.p, function () {
      console.log(
        'Mock service running at http://localhost:' +
        server.address().port)
    })
  })
  .catch(function (err) {
    console.log(err && (err.stack || err.message))
    process.exit(1)
  })

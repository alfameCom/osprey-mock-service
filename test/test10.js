/* global describe, it, before */

const expect = require('chai').expect
const ospreyMockService = require('../')
const httpes = require('http')
const path = require('path')
const finalhandler = require('finalhandler')
const makeFetcher = require('./utils').makeFetcher

describe('osprey mock service v1.0', function () {
  let http

  before(async function () {
    this.timeout(3000)
    const fpath = path.join(__dirname, '/fixtures/example10.raml')
    const opts = { server: { cors: true, compression: true } }
    return ospreyMockService.loadFile(fpath, opts)
      .then(server => {
        http = httpes.createServer(function (req, res) {
          return server(req, res, finalhandler(req, res))
        })
      })
  })

  describe('routes', function () {
    it('should expose a function', function () {
      expect(ospreyMockService).to.be.a('function')
    })

    it('should respond with example parameter', function () {
      return makeFetcher(http).fetch('/api/test', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(200)
          expect(JSON.parse(res.body)).to.deep.equal({ success: true })
        })
    })

    it('should respond with nested example parameter', function () {
      return makeFetcher(http).fetch('/api/nested', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(200)
          expect(JSON.parse(res.body)).to.deep.equal({ nested: { success: 'true' } })
        })
    })

    it('should respond with a boolean body', function () {
      return makeFetcher(http).fetch('/api/boolean', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(200)
          expect(JSON.parse(res.body)).to.equal(true)
        })
    })

    it('should respond with multiple examples', function () {
      return makeFetcher(http).fetch('/api/examples', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(200)
          const match = /example./.test(JSON.parse(res.body).name)
          expect(match).to.equal(true)
        })
    })

    it('should respond to consecutive requests', function () {
      return makeFetcher(http).fetch('/api/examples', { method: 'GET' })
        .then(function (res) {
          makeFetcher(http).fetch('/api/examples', { method: 'GET' })
            .then(function (res) {
              expect(res.status).to.equal(200)
              const match = /example./.test(JSON.parse(res.body).name)
              expect(match).to.equal(true)
            })
        })
    })

    it('should reject undefined route', function () {
      return makeFetcher(http).fetch('/api/unknown', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(404)
        })
    })

    it('should have empty body when there are no example property', function () {
      return makeFetcher(http).fetch('/api/noexample', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.status).to.equal(200)
          expect(res.body).to.equal('')
        })
    })

    it('should return a header \'foo\' equal to the \'default\' value \'test\' instead of the \'example\' value', function () {
      return makeFetcher(http).fetch('/api/headersdefaultbeforeexample', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.headers.get('foo')).to.equal('test')
        })
    })

    it('should return a header \'foo\' equal to the \'default\' value \'test\'', function () {
      return makeFetcher(http).fetch('/api/headersdefault', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.headers.get('foo')).to.equal('test')
        })
    })

    it('should return a header \'foo\' equal to the \'example\' value \'bar\'', function () {
      return makeFetcher(http).fetch('/api/headersexample', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.headers.get('foo')).to.equal('bar')
        })
    })

    it('should return a header \'foo\' equal to any of the \'examples\' value defined', function () {
      return makeFetcher(http).fetch('/api/headersexamples', {
        method: 'GET'
      })
        .then(function (res) {
          expect(res.headers.get('foo')).to.be.oneOf(['bar', 'foo', 'random', 'another'])
        })
    })

    it('should default to document\'s mediatype', function () {
      return makeFetcher(http).fetch('/api/defaultmediatype', {
        method: 'GET'
      })
        .then(function (res) {
          expect(JSON.parse(res.body))
            .to.deep.equal({ stringProperty: 'foo', numberProperty: 23 })
        })
    })

    it('should respect ext', function () {
      return makeFetcher(http).fetch('/api/ext.json', {
        method: 'GET'
      })
        .then(function (res) {
          expect(JSON.parse(res.body))
            .to.deep.equal({ stringProperty: 'foo', numberProperty: 23 })
        })
    })

    it('should return property-level examples from type.', function () {
      return makeFetcher(http).fetch('/api/user', {
        method: 'GET'
      })
        .then(function (res) {
          const body = JSON.parse(res.body)
          expect(body.name).to.equal('Kendrick')
          expect(body.lastname).to.equal('Lamar')
          expect(body.age).to.equal(10)
          expect(body.good).to.equal(true)
          expect(body.object).to.eql({ foo: 1, bar: 2 })
          expect(body.array).to.eql(['foo', 'bar'])
        })
    })
  })
})

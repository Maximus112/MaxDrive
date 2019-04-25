let mongoose = require("mongoose");
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let server = require("../app.js");
let user = require('../models/users');

chai.use(chaiHttp);

describe('Login', () => {

    beforeEach((done) => {
        user.remove({}, (err) => { 
            done();           
        });        
    });

    describe('/POST /api/users', () => {
        it('it should create a user', (done) => {
            chai.request(server)
            .post('/api/users')
            .send({email: "example@email.com", password: "secret"})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('success');
                done();
                
                describe('/POST /api/login', () => {
                    it('it should log the user in.', (done) => {
                        chai.request(server)
                            .post('/api/login')
                            .send({email: "example@email.com", password: "secret"})
                            .end((err, res) => {
                                res.should.have.cookie('jwt');
                                res.should.have.status(200);
                            done();
                        });
                    });
                }); 
            }); 
        });
    });
});

/*
describe('Users', () => {


    beforeEach((done) => {
        user.remove({}, (err) => { 
            done();           
        });        
    });

    describe('/POST /api/users', () => {
        it('it should create a user', (done) => {
          chai.request(server)
              .post('/api/users')
              .send({email: "example@email.com", password: "secret"})
              .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('success');

                    describe('/GET /api/users', () => {
                        it('it should retrieve the created user.', (done) => {
                            chai.request(server)
                                .get('/api/users')
                                .end((err, res) => {
                                    res.should.have.status(200);
                                    res.body.should.be.a('array');
                                    res.body.length.should.be.eql(1);
                                    res.body[0].should.have.property('_id');
                                    res.body[0].should.have.property('email');

                                    describe('/POST /api/login', () => {
                                        it('it should log the user in.', (done) => {
                                            chai.request(server)
                                                .post('/api/login')
                                                .send({email: "example@email.com", password: "secret"})
                                                .end((err, res) => {
                                                    res.should.have.cookie('jwt');
                                                    res.should.have.status(200);
    
                                                    describe('/DELETE /api/users/:id', () => {
                                                        it('it should delete the newly created user.', (done) => {
                                                            chai.request(server)
                                                                .delete('/api/users/' + _id)
                                                                .set('Cookie', jwt)
                                                                .end((err, res) => {
                                                                    console.log(res.body);
                                                                });
                                                                done();
                                                        });
                                                    });

                                                done();
                                            });
                                        });
                                    });

                                done();
                            });
                        });
                    });

                done();
              });
        });
    });
});

*/

/*

describe('/SELETE /api/users/:id', () => {
            it('it should delete the newly created user.', (done) => {
                chai.request(server)
                    .delete('/api/users/' + _id)
                    .set('Cookie', jwt)
                    .end((err, res) => {
                        console.log(res.body);
                    });
                    done();
            });
        });


 var jwt = "";
 res.headers["set-cookie"].toString().split(';').forEach(function(cookie){ 
     if(cookie.indexOf('jwt=') > -1)
         jwt = cookie + ";";
 });


*/
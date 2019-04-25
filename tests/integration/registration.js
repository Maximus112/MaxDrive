let mongoose = require("mongoose");
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let server = require("../app.js");
let user = require('../models/users');

chai.use(chaiHttp);

describe('Registration', () => {

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
        
                describe('/GET /api/users', () => {
                    it('it should retrieve the created user.', (done) => {
                        chai.request(server)
                        .get('/api/users')
                        .set('Cookie', 'admin=super_secret_password;')
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            res.body.length.should.be.eql(1);
                            res.body[0].should.have.property('_id');
                            res.body[0].should.have.property('email');
                            res.body[0].email.should.be.eql('example@email.com');
                            done();
                        }); 
                    }); 
                }); 
            }); 
        });
    });
});
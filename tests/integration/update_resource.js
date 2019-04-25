let mongoose = require("mongoose");
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let server = require("../app.js");
let user = require('../models/users');

chai.use(chaiHttp);

var jwt = null;
var _id = null;

describe('Update Resource', () => {

    beforeEach((done) => {

        user.remove({}, (err) => { 

            chai.request(server)
            .post('/api/users')
            .send({email: "example@email.com", password: "secret"})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('success');
                res.should.have.cookie('jwt');
                _id = res.body._id;
                res.headers["set-cookie"].toString().split(';').forEach(function(cookie){ 
                    if(cookie.indexOf('jwt=') > -1)
                        jwt = cookie + ";";
                });
                done();
            });      
        });
    });

    describe('/POST /api/users/:owner_id/resources', () => {
        it('It should create a new resource in root folder.', (done) => {
            chai.request(server)
            .post('/api/users/' + _id + '/resources')
            .set('Cookie', jwt)
            .send({
                target_folder_id: 'root',
                name: 'parent',
                type: 'folder'
            })
            .end((err, res) => {
                res.body.should.be.a('object');
                res.body.items[0].name.should.be.eql('parent');
                var guid = res.body.items[0].guid;
                var resource = res.body.items[0];
                done();

                describe('/PUT /api/users/:owner_id/resources/:resource_id', () => {
                    it('It should update the name of the newly created resource.', (done) => {
                        resource.name = "updated";
                        chai.request(server)
                        .put('/api/users/' + _id + '/resources/root')
                        .set('Cookie', jwt)
                        .send({
                            target: resource
                        })
                        .end((err, res) => {
                            res.body.should.be.a('object');
                            res.body.items[0].name.should.be.eql("updated");
                            done();
                        });
                    });
                });
            });
        });
    });

});

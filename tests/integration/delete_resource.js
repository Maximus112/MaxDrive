let mongoose = require("mongoose");
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let server = require("../app.js");
let user = require('../models/users');

chai.use(chaiHttp);

describe('Delete Resource', () => {

    beforeEach((done) => {
        user.remove({}, (err) => { 
            done();           
        });        
    });

    describe('/POST /api/users', () => {
        it('It should create a user', (done) => {
            chai.request(server)
            .post('/api/users')
            .send({email: "example@email.com", password: "secret"})
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('success');
                res.should.have.cookie('jwt');
                done();
                var _id = res.body._id;
                var jwt = "";
                res.headers["set-cookie"].toString().split(';').forEach(function(cookie){ 
                    if(cookie.indexOf('jwt=') > -1)
                        jwt = cookie + ";";
                });

                describe('/POST /api/users/:owner_id/resources', () => {
                    it('It should create a new resource under the users root folder.', (done) => {
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

                                done();

                                describe('/DELETE /api/users/:owner_id/resources/:resource_id', () => {
                                    it('It should delete the newly created resource from the root folder.', (done) => {
                                        chai.request(server)
                                            .delete('/api/users/' + _id + '/resources/root')
                                            .set('Cookie', jwt)
                                            .send({
                                                target_id: guid
                                            })
                                            .end((err, res) => {
                                                res.body.should.be.a('object');
                                                res.body.items.length.should.be.eql(0);

                                                done();
                                            });
                                       
                                    });
                                });

                            });
                       
                    });
                });

            }); 
        });
    });
});

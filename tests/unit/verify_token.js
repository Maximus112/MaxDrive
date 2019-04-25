let chai = require('chai');
let should = chai.should();
const jwt = require('jsonwebtoken');

/* Middleware function that verifies the authenticity of a JWT cookie. */
function verify_token(req, res, next){
	/* Get cookie. */
	var token = req.cookies['jwt'];
	if (!token)
		return res.redirect('/login');
	jwt.verify(token, 'Shhh!', function(err, decoded) {
		if (err) res.redirect('/login');
		/* If JWT is valid, save _id to request for use in other routes. */
		req.client_id = decoded._id;
		return next();
	});
}

function generate_jwt(id){
	    return (jwt.sign( { _id: id }, 'Shhh!', { expiresIn: 3600 } ));
}

describe('verify_token', () => {
    it('It should accept the valid token.', (done) => {
        var dummy_id = "123456789abcdefg";
        var req = { cookies: { "jwt": generate_jwt(dummy_id) }, client_id: "" };
        var res = { redirect: 
            function(route){
                console.log("redirecting to.. " + route);
            }
        };
        verify_token(req, res, function(){

            done();
        });
    });
    it('It should reject the invalid token.', (done) => {
        var dummy_id = "123456789abcdefg";
        var req = { cookies: { "jwt": "THIS IS NOT A JSON WEB TOKEN" }, client_id: "" };
        var res = { redirect: 
            function(route){
                done();
            } 
        };
        verify_token(req, res);
    });
});
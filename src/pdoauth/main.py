from app import app
from pdoauth.AuthProvider import AuthProvider
from pdoauth.auth import do_login, do_registration, do_get_by_email,\
    do_add_assurance
from flask import json
import flask
from pdoauth import auth
from pdoauth.models.Credential import Credential
from pdoauth.models.Assurance import Assurance
from flask_login import login_required

@app.route("/v1/oauth2/auth", methods=["GET"])
@login_required
def authorization_code():
    return AuthProvider.auth_interface()

@app.route("/login", methods=["GET", "POST"])
def login():
    return do_login()

@app.route("/v1/oauth2/token", methods=["POST"])
def token():
    return AuthProvider.token_interface()

@app.route("/v1/users/<userid>", methods=["GET"])
def showUser(userid):
    allowed, targetuser = auth.isAllowedToGetUser(userid)
    if allowed:
        data = {
                'email': targetuser.email,
                'userid': targetuser.id,
                'assurances': Assurance.getByUser(targetuser)
                }
        return json.dumps(data)
    return flask.make_response("no authorization", 403)

@app.route("/v1/register", methods=["POST"])
def register():
    return do_registration()

@app.route("/v1/verify_email/<token>", methods=["GET"])
def verifyEmail(token):
    cred = Credential.get('emailcheck', token)
    user = cred.user
    Assurance.new(user,'emailverification',user)
    cred.rm()
    if cred is not None:
        return flask.make_response("email verified OK", 200)
    return flask.make_response("unknown token", 404)

@app.route('/v1/user_by_email/<email>', methods=["GET"])
@login_required
def get_by_email(email):
    return do_get_by_email(email)

@app.route('/v1/add_assurance', methods=["POST"])
@login_required
def add_assurance():
    return do_add_assurance()
    
if __name__ == '__main__':
    app.run("localhost", 8888, True)



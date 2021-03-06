from integrationtest.helpers.IntegrationTest import IntegrationTest
from pdoauth.app import app
from integrationtest import config
from pdoauth.models.User import User
from pdoauth.models.Assurance import Assurance, emailVerification
import time
from integrationtest.helpers.CSRFMixin import CSRFMixin
from integrationtest.helpers.UserTesting import UserTesting

class HashIntegrationTest(IntegrationTest, UserTesting, CSRFMixin):

    
    def test_a_logged_in_user_can_record_its_hash(self):
        with app.test_client() as client:
            resp = self.login(client)
            csrf = self.getCSRF(client)
            self.assertUserResponse(resp)

            data = dict(
                digest= self.createHash(),
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(200,resp.status_code)
            self.assertEqual('{"message": "new hash registered"}', self.getResponseText(resp))

    
    def test_the_users_hash_is_changed_to_the_new_one(self):
        with app.test_client() as client:
            resp = self.login(client)
            self.assertUserResponse(resp)

            user = User.getByEmail(self.userCreationEmail)
            self.assertEqual(user.hash, None)
            digest = self.createHash()
            csrf = self.getCSRF(client)
            data = dict(
                digest= digest,
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(200,resp.status_code)
            userAfter = User.getByEmail(self.userCreationEmail)
            self.assertEqual(userAfter.hash, digest)

    
    def test_if_the_user_had_a_hash_before__it_is_overwritten(self):
        with app.test_client() as client:
            resp = self.login(client)
            self.assertUserResponse(resp)

            user = User.getByEmail(self.userCreationEmail)
            oldHash = self.createHash()
            user.hash = oldHash
            userToCheck = User.getByEmail(self.userCreationEmail)
            self.assertEqual(userToCheck.hash, oldHash)
            self.setupRandom()
            digest = oldHash
            csrf = self.getCSRF(client)
            data = dict(
                digest= digest,
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(200,resp.status_code)
            userAfter = User.getByEmail(self.userCreationEmail)
            self.assertEqual(userAfter.hash, digest)

    
    def test_it_is_possible_to_delete_the_hash_by_not_giving_a_digest_in_the_request(self):
        with app.test_client() as client:
            self.updateHashForUser(client,addDigest=False)
            self.assertEqual(self.userAfter.hash, None)

    
    def test_when_hash_is_deleted_no_hashgiven_assurance_remains(self):
        with app.test_client() as client:
            assurances=self.updateHashForUser(client,addDigest=False)
            self.assertEqual(set(assurances.keys()), set())


    def doUpdateHashForUser(self, client, assurance="test", addDigest=True, digest=None):
        resp = self.login(client)
        self.assertUserResponse(resp)
        user = User.getByEmail(self.userCreationEmail)
        Assurance.new(user, assurance, user, time.time())
        oldHash = self.createHash()
        user.hash = oldHash
        user.save()
        userToCheck = User.getByEmail(self.userCreationEmail)
        assurancesBefore = Assurance.getByUser(userToCheck)
        self.assertEqual(len(assurancesBefore), 1)
        self.setupRandom()
        csrf = self.getCSRF(client)
        data = dict(csrf_token=csrf)
        if addDigest:
            if digest is None:
                data['digest'] = self.createHash()
            else:
                data['digest'] = digest
        resp = client.post(config.BASE_URL + '/v1/users/me/update_hash', data=data)
        return resp

    def updateHashForUser(self, client, assurance="test", addDigest=True, digest=None):
        resp = self.doUpdateHashForUser(client, assurance, addDigest, digest)
        self.assertEqual(200, resp.status_code)
        self.userAfter = User.getByEmail(self.userCreationEmail)
        assurances = Assurance.getByUser(self.userAfter)
        return assurances

    
    def test_the_assurances_are_overwritten_on_hash_update(self):
        with app.test_client() as client:
            assurances = self.updateHashForUser(client)
            self.assertEqual(len(assurances), 1)
    
    def test_error_message_on_hash_collision(self):
        anotheruser = self.createUserWithCredentials().user
        digest = self.createHash()
        anotheruser.hash = digest
        Assurance.new(anotheruser, "test", anotheruser)
        anotheruser.save()

        with app.test_client() as client:
            resp = self.doUpdateHashForUser(client, digest=digest)
            self.assertEqual(400, resp.status_code)
            self.assertEqual('{"errors": ["another user is using your hash"]}', resp.data.decode('utf-8'))

    def a_hashgiven_assurance_is_created_when_a_hash_is_given(self):
        with app.test_client() as client:
            assurances = self.updateHashForUser(client)
            self.assertEqual(assurances.keys(), ["hashgiven"])

    
    def test_emailverification_assurance_is_an_exception_from_overwriting(self):
        with app.test_client() as client:
            assurances = self.updateHashForUser(client,emailVerification)
            self.assertEqual(len(assurances), 2)
            self.assertTrue("emailverification" in assurances.keys())

    
    def test_without_login_it_is_not_possible_to_update_the_hash(self):
        self.setupRandom()
        with app.test_client() as client:
            csrf = self.getCSRF(client)
            data = dict(
                digest= self.createHash(),
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(403,resp.status_code)

    
    def test_the_hash_update_request_should_contain_csrf_token(self):
        with app.test_client() as client:
            resp = self.login(client)
            self.assertUserResponse(resp)

            data = dict(
                digest= self.createHash(),
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(400,resp.status_code)
            self.assertEqual(
                '{"errors": ["csrf_token: csrf validation error"]}'
                ,self.getResponseText(resp)
            )

    
    def test_if_a_hash_is_given_it_should_be_valid(self):
        with app.test_client() as client:
            resp = self.login(client)
            self.assertUserResponse(resp)
            csrf = self.getCSRF(client)
            data = dict(
                digest= 'invalidhash',
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(400,resp.status_code)
            self.assertEqual(
                '{"errors": ["digest: Field must be between 128 and 128 characters long."]}'
                ,self.getResponseText(resp)
            )


    
    def test_hash_should_not_be_whitespace(self):
        with app.test_client() as client:
            resp = self.login(client)
            self.assertUserResponse(resp)
            csrf = self.getCSRF(client)
            data = dict(
                digest= '  ',
                csrf_token= csrf
            )
            resp = client.post(config.BASE_URL+'/v1/users/me/update_hash', data=data)
            self.assertEqual(400,resp.status_code)
            self.assertEqual(
                '{"errors": ["digest: Field must be between 128 and 128 characters long."]}'
                ,self.getResponseText(resp)
            )

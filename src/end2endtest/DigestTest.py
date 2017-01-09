from end2endtest.helpers.BrowsingUtil import BrowsingUtil
from test.helpers.CryptoTestUtil import CryptoTestUtil
from unittest.case import TestCase

class DigestTest(TestCase, BrowsingUtil, CryptoTestUtil):

    def test_you_can_add_a_digest_as_a_logged_in_user(self):
        digest = self.registerAndGiveHash()
        self.waitUntilElementEnabled("viewChangeHashForm")
        self.assertElementMatches("change-hash-form_digest-code", digest)

    #def test_many_times(self):
    #    for i in range(100):
    #        self.test_you_can_change_the_digest_as_a_logged_in_user()
    #        self.logOut()
        
    def test_you_can_change_the_digest_as_a_logged_in_user(self):
        self.registerAndGiveHash()
        digest=self.changeMyHash()
        self.waitUntilElementEnabled("viewChangeHashForm")
        self.assertElementMatches("change-hash-form_digest-code", digest)

    
    def test_you_can_delete_the_digest_as_a_logged_in_user_by_giving_empty_one(self):
        self.registerAndGiveHash()
        self.changeMyHash("")
        self.waitUntilElementEnabled("viewChangeHashForm")
        self.assertElementMatches("change-hash-form_digest-code", '-- nincs megadva --')
        
    def tearDown(self):
        BrowsingUtil.tearDown(self)

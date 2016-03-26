# encoding: utf-8
import gettext
gettext.install('PDOauth')

thereIsAlreadyAUserWithThatEmail = _("There is already a user with that email")
thereIsAlreadyAUserWithThatUsername = _("There is already a user with that username")
passwordShouldContainLowercase = _("password should contain lowercase")
passwordShouldContainUppercase = _("password should contain uppercase")
passwordShouldContainDigit = _("password should contain digit")
secretShouldContainLowercase = _("secret should contain lowercase")
secretShouldContainDigit = _("secret should contain digit")
credentialTypeString = _("credentialType")
credErrString = _("Invalid value, must be one of")
missingParameterUrlQuery = _('Missing parameter redirect_uri in URL query')
missingParameterResponse = _('Missing parameter response_type in URL query')
missingParameterClientId = _('Missing parameter client_id in URL query')
unsupportedGrantType = _('unsupported_grant_type')
invalidClient = _('invalid_client')
unsupportedResponseType = _('unsupported_response_type')
unauthorizedClient = _('unauthorized_client')
invalidScope = _('invalid_scope')
invalidRequest = _('Invalid request')
accessDenied = _('access_denied')
invalidGrant = _('invalid_grant')
missingRequiredParam = "Missing required OAuth 2.0 POST param"
youHaveToRegisterFirst = _("You have to register first")
noCertificateGiven = _("No certificate given")
anotherUserUsingYourHash = _("another user is using your hash")
sameHash = _("you already have this hash,so nothing is done")
moreUsersWarning = _("More users with the same hash; specify both hash and email")
noShowAuthorization = _("no authorization to show other users")
passwordResetSent = _("Password reset email has been successfully sent.")
cannotDeleteLoginCred = _("You cannot delete the login you are using")
noSuchUser = _("No such user")
badAuthHeader = _("bad Authorization header")
noAuthorization = _("no authorization")
authenticationNeeded = _("authentication needed")
loggedOut = _('logged out')
deregistrationEmailSent = _('deregistration email has been sent')
secretIsNeededForDeregistrationDoit = _("secret is needed for deregistration_doit")
notLoggedIn = _("not logged in")
badDeregistrationSecret = _("bad deregistration secret")
youAreDeregistered = _('you are deregistered')
newHashRegistered = _('new hash registered')
oldPasswordDoesNotMatch = _("old password does not match")
passwordChangedSuccessfully = _('password changed succesfully')
thisUserDoesNotHaveThatDigest = _('This user does not have that digest')
noUserWithThisHash = _('No user with this hash')
unknownToken = _("unknown token")
emailVerifiedOK = _("email verified OK")
verificationEmailSent = _("verification email sent")
invalidEmailAdress = _('Invalid email address')
expiredToken = _("expired token")
passwordSuccessfullyChanged = _('Password successfully changed')
theSecretHasExpired = _('The secret has expired')
noSuchCredential = _('No such credential')
credentialRemoved = _('credential removed')
addedAssurance = 'added assurance'
errorInCert = _("error in cert")
inactiveOrDisabledUser = _("Inactive or disabled user")
badUserNameOrPassword = _("Bad username or password")
cannotLoginToFacebook = _("Cannot login to facebook")
youHaveToRegisterFirst = _("You have to register first")
unknownApplication = _("Unknown application")
noHashGiven = _("No hash given")
exceptionSendingEmail = _("Nem sikerült elküldeni a levelet")
badChangeEmailSecret = _("bad secret for email change")
emailChangeEmailSent = _("email change email sent")
emailChanged = _("email address changed")

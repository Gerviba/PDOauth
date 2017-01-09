window.traces = new Array();

function PageScript(test) {
	var self = this
	test=test || { debug: false, uribase: "" }
	this.debug=test.debug
	win = test.win || window;
    self.uribase=test.uribase;
	this.isLoggedIn=false;
	this.isAssurer=false;
	this.registrationMethode="pw";
	this.isFBsdkLoaded=false;
	this.isFBconnected=false;

PageScript.prototype.QueryStringFunc = function (search) { //http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
  var query_string = {};
  var query = search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
};

    this.QueryString = self.QueryStringFunc(win.location.search);
	
	PageScript.prototype.getThis=function() {
		return this
	}
	
	PageScript.prototype.reportServerFailure = function(text){
		self.displayMsg({title:_("Server error occured"),error: text})
	}

	PageScript.prototype.callback = function(next,error){
		var next  = next || function(){return}
		var error = error || defaultErrorHandler
		function callback(status,text,xml) {
			switch (status){
				case 200:
					next(text,xml)
					break;
				case 500:
				case 405:
					self.reportServerFailure(text)
					break;
				default:
					error(status,text,xml)
			}
		}
		function defaultErrorHandler(status,text,xml){
            console.log(text)
			data=JSON.parse(text)
			self.displayMsg(self.processErrors(data))
		}
		return callback
	}
	
	PageScript.prototype.commonInit=function(text) {
		// initialising variables
		self.QueryString.uris = JSON.parse(text);
		self.uribase = self.QueryString.uris.BACKEND_PATH;
		if ( typeof facebook != "undefined" && self.QueryString.uris.FACEBOOK_APP_ID ) facebook.fbinit();

		// filling hrefs of anchors
		[].forEach.call(document.getElementsByClassName("digest_self_made_button"), function(a){a.href=self.QueryString.uris.ANCHOR_URL})
		self.initialise()
		window.traces.push('initialized')
	}
	
	PageScript.prototype.ajaxBase = function(callback) {
		var xmlhttp;
		if (win.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
		  xmlhttp = new win.XMLHttpRequest();
//		  xmlhttp.oName="XMLHttpRequest"; // for testing
		  }
		else
		  {// code for IE6, IE5
		  xmlhttp = new win.ActiveXObject("Microsoft.XMLHTTP");
//		  xmlhttp.oName="ActiveXObject";   // for testing
		  }
		xmlhttp.callback=callback // for testing
		xmlhttp.onreadystatechange=function()
		  {
		  if (xmlhttp.readyState==4)
		    {
		    	callback(xmlhttp.status,xmlhttp.responseText,xmlhttp.responseXML);
		    }
		  }
		return xmlhttp;
	}

	PageScript.prototype.ajaxpost = function( uri, data, callback ) {
		xmlhttp = this.ajaxBase( callback );
		xmlhttp.open( "POST", self.uribase + uri, true );
		xmlhttp.setRequestHeader( "Content-type","application/x-www-form-urlencoded" );
		l = []
		for (key in data) l.push( key + "=" + encodeURIComponent( data[key] ) ); 
		var dataString = l.join("&")
		xmlhttp.send( dataString );
	}

	PageScript.prototype.ajaxget = function( uri, callback, direct) {
		xmlhttp = this.ajaxBase( callback )
		if (direct) {
			theUri = uri;
		} else {
			theUri = self.uribase + uri;
		}
		xmlhttp.open( "GET", theUri , true);
		xmlhttp.send();
	}

	PageScript.prototype.processErrors = function(data) {
			var msg = {},
				translateError = function(e){
					console.log(e)
					var a=e.split(': ');
					for(var i=0; i<a.length; i++){
						a[i]=_(a[i])
					}
					return a.join(': ')
				};
				
			if (data.message) {
				msg.title=_("Server message");
				msg.message=self.parseMessage(data.message)
				if (typeof msg.message=="string") {
                    msg.message="<p>"+msg.message+"</p>";
				} else {
                    a="<ul>"
		            for(value in msg.message) {
                        m = msg.message[value];
                        console.log(m);
                        a += "<li>"+m+"</li>";
                    }
                    a+="</ul>";
                    msg.message=a;
                }
                console.log("message out: %o", msg.message)
			}
			
			if (data.assurances) {
				msg.title=_("User informations");
				msg.success=self.parseUserdata(data);
			}
			
			if (data.errors) {
				msg.title = _("Error message")
				msg.error = '<ul class="disced">';
				errs = data.errors;
				if (typeof(errs)!='string') {
					[].forEach.call(errs, function(e) {
						msg.error += "<li>"+ translateError(e) +"</li>" ;})
				}
				else {
					msg.error += "<li>"+ translateError(errs) +"</li>";
				}
				msg.error += "</ul>";
			}
			
			return msg;
	}
	
	PageScript.prototype.parseMessage = function(value,key,arr)  {
		if (typeof value == "string"){
			if (key==undefined || key!=0) return _(value)
			var pars=arr;
			pars.shift();
			return _(value, pars.map(function(v,k){return _(v)}))
		}
		if (typeof value[0]=="string") return self.parseMessage(value[0],0,value)
		var a=[];
		value.forEach( function(v,k,arr){a.push(self.parseMessage(v))})
		return a
	}
	
	PageScript.prototype.setAppCanEmailMe=function(appId, value, callback){
		var csrf_token = self.getCookie('csrf');
	    data= {
			canemail: value,
	    	appname: self.aps[appId].name,
	    	csrf_token: csrf_token
	    }
	    self.ajaxpost("/v1/setappcanemail", data, self.callback(callback))
	}
	
	PageScript.prototype.parseUserdata = function(data) {
		var result ='\
		<table>\
			<tr>\
				<td><b>'+_("User identifier")+'</b></td>\
				<td>'+data.userid+'</td>\
			</tr>\
		</table>\
		<h4><b>'+_("Assurances")+'</b></h4>\
		<table>\
			<thead>\
				<tr>\
					<th>'+_("Name")+'</th>\
					<th>'+_("Assurer")+'</th>\
					<th>'+_("Date of assurance")+'</th>\
					<th>'+_("Valid until")+'</th>\
				</tr>\
			<tbody>'
		for(assurance in data.assurances) {
			for( var i=0; i<data.assurances[assurance].length; i++){
				result += '\
				<tr>\
					<td>'+_(data.assurances[assurance][i].name)+'</td>\
					<td>'+data.assurances[assurance][i].assurer+'</td>\
					<td>'+self.timestampToString(data.assurances[assurance][i].timestamp)+'</td>\
					<td>'+
//					self.timestampToString(data.assurances[assurance][i].valid)+
					_("unlimited")+
					'</td>\
				</tr>'
			}
		}
		result += '\
			</tbody>\
		</table>'
		return result
	}
	
	PageScript.prototype.timestampToString=function(timestamp){
			var date=new Date(timestamp*1000)
			return date.toLocaleDateString();
		}
	
// oldie	
	PageScript.prototype.myCallback = function(text) {

		if( self.page=="login"){
			if( self.QueryString.next) {
				self.doRedirect(decodeURIComponent(self.QueryString.next))
			}
		}
		var data = JSON.parse(text);
		var msg = self.processErrors(data)
		self.displayMsg(msg);

	}
	
	PageScript.prototype.meCallback = function(text) {
		var data = JSON.parse(text);
		var msg = self.processErrors(data)
		self.get_me()
		self.displayMsg(msg);
	}

	PageScript.prototype.registerCallback = function(text) {
		self.isLoggedIn=true
		if( self.page=="account"){
			var msg={
				title:_("Congratulation!"),
				error:_("You have succesfully registered and logged in. </br> Please click the link inside the email we sent you to validate your email address, otherwise your account will be destroyed in one week.")
				}
			self.displayMsg(msg)
			self.userIsLoggedIn (text)
		}
		if( self.page=="login"){
			self.ajaxget('/v1/getmyapps',self.callback(self.finishRegistration))
		}
		window.traces.push("registerCallback")
	}	

	PageScript.prototype.reloadCallback = function(text) {
		var msg = self.processErrors(JSON.parse(text))
		msg.callback = self.doLoadHome;
		self.displayMsg(msg);
	}
	
	PageScript.prototype.doRedirect = function(href){ 
		win.location=href	
	}
	
	PageScript.prototype.doLoadHome = function() {
		self.doRedirect(self.QueryString.uris.START_URL);
	}
	
	PageScript.prototype.get_me = function() {
		this.success=self.userIsLoggedIn
		this.error=self.userNotLoggedIn
		self.ajaxget("/v1/users/me", self.callback(this.success, this.error))
	}
	
// Button actions

	PageScript.prototype.doPasswordReset = function() {
		secret = document.getElementById("PasswordResetForm_secret_input").value;
	    password = document.getElementById("PasswordResetForm_password_input").value;
	    this.ajaxpost("/v1/password_reset", {secret: secret, password: password}, self.callback(self.reloadCallback))
	}
	
	PageScript.prototype.InitiatePasswordReset = function(myForm) {
		var emailInput=document.getElementById(myForm+"_email_input").value
        emailInput = pageScript.mailRepair(emailInput);
		if (emailInput!="")
			self.ajaxget("/v1/users/"+document.getElementById(myForm+"_email_input").value+"/passwordreset", self.callback(self.myCallback));
		else {
			emailInput.className="missing";
			this.displayMsg({"title":"Hiba","error":"Nem adtál meg email címet"})
		}
	}
	
    PageScript.prototype.mailRepair = function(mail) {
        return self.mail = mail.replace(/\s+/g,'').toLowerCase();
	}
    
	PageScript.prototype.login = function() {
	    username = document.getElementById("LoginForm_email_input").value;
	    var onerror=false;
		var errorMsg="";
		if (username=="") {
			errorMsg+=_("User name is missing. ");
			onerror=true;
		}
	    password = document.getElementById("LoginForm_password_input").value;
	    if (password=="") {
			errorMsg+=_("Password is missing. ");
			onerror=true; 
		}
		if (onerror==true) self.displayMsg({error:errorMsg, title:_("Missing data")});
		else {
			var data = {
				credentialType: "password", 
				identifier: username, 
				password: password
				}
			self.ajaxpost( "/v1/login", data, self.callback(self.userIsLoggedIn) )
		}
	}

	PageScript.prototype.login_with_facebook = function(userId, accessToken) {
		console.log("facebook login")
	    username = userId
	    password = encodeURIComponent(accessToken)
	    data = {
	    	credentialType: 'facebook',
	    	identifier: username,
	    	password: password
	    }
	    self.ajaxpost("/v1/login", data , self.callback(self.userIsLoggedIn) )
	}

	PageScript.prototype.logoutCallback = function(status, text) {
		data=JSON.parse(text)
		if (data.error)	self.displayError();
		else {
			self.isLoggedIn=false
			self.doRedirect( self.QueryString.uris.START_URL)
		}
	}
	
	PageScript.prototype.logout = function() {
				console.log("logout")
	    this.ajaxget("/v1/logout", this.logoutCallback)
	}
	
	PageScript.prototype.getCookie = function(cname) {
	    var name = cname + "=";
	    var ca = win.document.cookie.split(';');
	    for(var i=0; i<ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1);
	        if (c.indexOf(name) == 0) {
				return c.substring(name.length,c.length);
			}
	    }
	    return "";
	} 

	PageScript.prototype.InitiateResendRegistrationEmail = function() {
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
		}

	PageScript.prototype.loadjs = function(src) {
	    var fileref=document.createElement('script')
	    fileref.setAttribute("type","text/javascript")
	    fileref.setAttribute("src", src)
	    document.getElementsByTagName("head")[0].appendChild(fileref)
	}
	
	PageScript.prototype.unittest = function() {
		this.loadjs("ts.js")
	}
	

	PageScript.prototype.RemoveCredential = function(formName) {
		self.formName = formName
		this.doRemove = function(type) {
			credentialType = (type)?type:document.getElementById(this.formName+"_credentialType").innerHTML;
			identifier = document.getElementById(this.formName+"_identifier").innerHTML;
			text = {
				csrf_token: self.getCookie("csrf"),
				credentialType: credentialType,
				identifier: identifier
			}
			console.log("text")
			this.ajaxpost("/v1/remove_credential", text, self.callback(self.meCallback));
		}
		return self
	}
	
	PageScript.prototype.GoogleLogin = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.GoogleRegister = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.TwitterLogin = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.addPasswordCredential = function(){
		var identifier=document.getElementById("AddPasswordCredentialForm_username_input").value;
		var secret=document.getElementById("AddPasswordCredentialForm_password_input").value;
		self.addCredential("password", identifier, secret);
	}
	
	PageScript.prototype.add_facebook_credential = function( FbUserId, FbAccessToken) {
		self.addCredential("facebook", FbUserId, FbAccessToken);
	}
	
	PageScript.prototype.addGoogleCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.addGithubCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.addTwitterCredential = function(){
		self.displayMsg({title:_("Under construction"), error:_("This function is not working yet.")});	
	}
	
	PageScript.prototype.doDeregister = function() {
		if ( document.getElementById("accept_deregister").checked ) {
			if ( self.QueryString.secret ) {
				text = {	csrf_token: self.getCookie("csrf"),
							deregister_secret: self.QueryString.secret
							}
				self.ajaxpost( "/v1/deregister_doit", text, self.callback(self.deregisterCallback) )
			}
			else {
				var msg={ 	title:_("Error message"),
							error:_("The secret is missing")}
				self.displayMsg(msg);			
			}
		}
		else {
			var msg={ 	title:_("Error message"),
						error:_("To accept the terms please mark the checkbox!")}
			self.displayMsg(msg);	
		}			
	}
	
	PageScript.prototype.initiateDeregister = function(theForm) {
		text = { csrf_token: self.getCookie("csrf") }
		self.ajaxpost("/v1/deregister", text, self.callback(self.myCallback))
	}
	
	PageScript.prototype.deregisterCallback = function(text) {
		var msg=self.processErrors(JSON.parse(text))
		self.isLoggedIn=false
		self.refreshTheNavbar();
		if (self.page=="account") {
			self.displayTheSection("login");
		}
		msg.callback=function(){self.doRedirect(self.QueryString.uris.START_URL)};
		self.displayMsg(msg);
	}
	
	PageScript.prototype.refreshTheNavbar=function(){
		if (self.isLoggedIn) {
			document.getElementById("nav-bar-login").style.display="none";
			document.getElementById("nav-bar-register").style.display="none";
			document.getElementById("nav-bar-my_account").style.display="block";
			document.getElementById("nav-bar-logout").style.display="block";
		}
		else {
			document.getElementById("nav-bar-my_account").style.display="none";
			document.getElementById("nav-bar-logout").style.display="none";
			document.getElementById("nav-bar-login").style.display="block";
			document.getElementById("nav-bar-register").style.display="block";
		}
	}

//Getdigest functions	
	PageScript.prototype.normalizeString = function(val) {
		var   accented="öüóőúéáűíÖÜÓŐÚÉÁŰÍ";
		var unaccented="ouooueauiouooueaui";
		var s = "";
		
		for (var i = 0, len = val.length; i < len; i++) {
		  c = val[i];
		  if(c.match('[abcdefghijklmnopqrstuvwxyz]')) {
		    s=s+c;
		  } else if(c.match('[ABCDEFGHIJKLMNOPQRSTUVXYZ]')) {
		    s=s+c.toLowerCase();
		  } else if(c.match('['+accented+']')) {
		    for (var j = 0, alen = accented.length; j <alen; j++) {
		      if(c.match(accented[j])) {
		        s=s+unaccented[j];
		      }
		    }
		  }
		}
		return s;
	}
	
	PageScript.prototype.digestGetter = function(formName) {
		var formName=formName
		var digestCallback
		
		digestCallback = function(status,text,xml) {
			var diegestInput=document.getElementById(formName + "_digest_input")
			if (status==200) {
				window.traces.push("digest cb")
				diegestInput.value = xml.getElementsByTagName('hash')[0].childNodes[0].nodeValue;
				console.log(diegestInput.value)
				$("#"+formName + "_digest-input").trigger('keyup');
				document.getElementById(formName + "_predigest_input").value = "";
				switch (formName) {
					case "assurancing":
						var messageBox=document.getElementById("assurance-giving_message")
						messageBox.innerHTML=_("The Secret Hash is given for assuring")
						messageBox.className="given"
						document.getElementById("assurance-giving_submit-button").className=""
						break;
					case "login":
					case "change-hash-form":
						self.changeHash()
						break;
					case "registration-form":
						console.log("formname is " + formName)
						var style = document.getElementById(formName+"_code-generation-input").style;
						console.log("style:" + formName)
						style.display="none"
						document.getElementById(formName+"_digest_input").style.display="block"
						self.activateButton( formName+"_make-here", function(){self.digestGetter(formName).methodChooser('here')})
						break;
					default:
						style.display="none"
				}
				window.traces.push("gotDigest")
			}
			else {
				self.displayMsg({title:_("Error message"),error: text});
				diegestInput.value =""
				if (formName=="assurancing") {
					var messageBox=document.getElementById("assurance-giving_message")
					messageBox.innerHTML=_("The Secret Hash isn't given yet")
					messageBox.className="missing"
					document.getElementById("assurance-giving_submit-button").className="inactive"
				}
			}
		}

		this.methodChooser = function(method) {
			var selfButton = formName+"_make-self"
			var hereButton = formName+"_make-here"
			switch (method) {
				case "here":
					document.getElementById(formName+"_code-generation-input").style.display="block"
					document.getElementById(formName+"_digest-input").style.display="none"
					self.activateButton( selfButton, function(){self.digestGetter(formName).methodChooser('self')} )
					self.deactivateButton( hereButton )
					break;
				case "self":
					document.getElementById(formName+"_code-generation-input").style.display="none"
					document.getElementById(formName+"_digest-input").style.display="block"
					self.activateButton( hereButton, function(){self.digestGetter(formName).methodChooser('here')} )
					self.deactivateButton( selfButton )
					break;
				default:
			}
		}
		
		this.getDigest = function() {
			text = createXmlForAnchor(formName)
			if (text == null) return;
			http = self.ajaxBase(digestCallback);
			http.open("POST",self.QueryString.uris.ANCHOR_URL+"anchor",true);
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		  	http.setRequestHeader("Content-length", text.length);
		  	http.setRequestHeader("Connection", "close");
			http.send(text);
		}
	
		function createXmlForAnchor(formName) {
			console.log(formName)
			personalId = document.getElementById(formName+"_predigest_input").value;
			motherValue = document.getElementById(formName+"_predigest_mothername").value;
			mothername = self.normalizeString(motherValue);
			if ( personalId == "") {
				self.displayMsg({title:_('Missing data'), error:_("Personal identifier is missing")})
				return;
			}
			if ( mothername == "") {
				self.displayMsg({title:_('Missing data'), error:_("Mother's name is missing")})
				return;
			}
			return ("<request><id>"+personalId+"</id><mothername>"+mothername+"</mothername></request>");
		}
		
		return this
	}
	
	PageScript.prototype.convert_mothername = function(formName) {
		var inputElement = document.getElementById( formName+"_mothername");
		var outputElement = document.getElementById( formName+"_monitor");
		outputElement.innerHTML=document.getElementById( formName+"_input").value +' - '+ self.normalizeString(inputElement.value);
	}	
	PageScript.prototype.setRegistrationMethode=function(methode){
		self.registrationMethode=methode;
		[].forEach.call( document.getElementById("registration-form-method-selector").getElementsByClassName("social"), function (e) { e.className=e.className.replace(" active",""); } );
		document.getElementById("registration-form-method-selector-"+methode).className+=" active"
		var heading
		switch (methode) {
			case "pw":
				heading=_("email address and/or username / password")
				document.getElementById("registration-form-password-container").style.display="block";
				document.getElementById("registration-form-username-container").style.display="block";
				document.getElementById("registration-form_secret_input").value="";
				document.getElementById("registration-form_identifier_input").value="";
			break;
			case "fb":
				heading=_("my facebook account")
				document.getElementById("registration-form-password-container").style.display="none";
				document.getElementById("registration-form-username-container").style.display="none";
				facebook.fbregister()
			break;
		}
		document.getElementById("registration-form-method-heading").innerHTML=_("Registration with %s ",heading);
	}

	PageScript.prototype.register = function(credentialType) {
		//
	    var identifier = (document.getElementById("registration-form_identifier_input").value=="")?
			document.getElementById("registration-form_email_input").value:
			document.getElementById("registration-form_identifier_input").value;
	    var secret = document.getElementById("registration-form_secret_input").value;
	    var email = document.getElementById("registration-form_email_input").value;
        email = pageScript.mailRepair(email);
		var d=document.getElementById("registration-form_digest_input");
		var digest =(d)?d.value:"";
	    var data= {
	    	credentialType: credentialType,
	    	identifier: identifier,
	    	email: email,
	    	digest: digest
	    }
		data.password=secret;
		window.traces.push(data)
		window.traces.push("register")
	    self.ajaxpost("/v1/register", data, self.callback(self.registerCallback))
	}

	PageScript.prototype.doRegister=function() {
		if ( document.getElementById("registration-form_confirmField").checked ) {
			console.log(self.registrationMethode)
			switch (self.registrationMethode) {
				case "pw":
					console.log('pw')
					var pwInput=document.getElementById("registration-form_secret_input")
					var pwBackup=document.getElementById("registration-form_secret_backup")
					if (pwInput.value!=pwBackup.value) self.displayMsg({title:_("Error message"),error:_("The passwords are not identical")})
					else self.register("password")
					break;
				case "fb":
					console.log('fb')
					self.register("facebook")
					break;
			}
		}
		else self.displayMsg({title:_("Acceptance is missing"),error:_("For the registration you have to accept the terms of use. To accept the terms of use please mark the checkbox!")})
	}
	
	PageScript.prototype.deactivateButton = function(buttonId) {
		b=document.getElementById(buttonId)
		if (b) {
			b.className+=" inactive";
			b.onclick=function(){return}
		}		
	}
	
	PageScript.prototype.activateButton = function(buttonId, onclickFunc) {
		console.log(buttonId)
		var b=document.getElementById(buttonId),
			c
		if (b) {
			b.className=b.className.slice(0,b.className.indexOf("inactive"))
			if (onclickFunc) {
				b.onclick = (typeof onclickFunc=="string")? function(){ eval(onclickFunc) } : onclickFunc 
			}
		}
	}

	PageScript.prototype.passwordChanged = function(formName) {
		var strength = document.getElementById(formName+"_pw-strength-meter");
		var strongRegex = new RegExp("^(?=.{10,})((?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9_])).*$", "g");
		var mediumRegex = new RegExp("^(?=.{8,})((?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])).*$", "g");
		var enoughRegex = new RegExp("(?=.{8,}).*", "g");
		var pwd = document.getElementById(formName+"_secret_input");
		if (pwd.value.length==0) {
			strength.innerHTML = _('Type Password');
		} 
		else if (false == enoughRegex.test(pwd.value)) {
				strength.innerHTML = _("More Characters");
			} 
			else if (strongRegex.test(pwd.value)) {
					strength.innerHTML = '<span style="color:green">'+_("Strong!")+'</span>';
				} 
				else if (mediumRegex.test(pwd.value)) {
						strength.innerHTML = '<span style="color:orange">'+_("Medium!")+'</span>';
					} 
					else {
						strength.innerHTML = '<span style="color:red">'+_("Weak!")+'</span>';	
					}
		self.pwEqual(formName)
	}
	
	PageScript.prototype.pwEqual = function(formName) {
		var pwInput=document.getElementById(formName+"_secret_input")
		var pwBackup=document.getElementById(formName+"_secret_backup")
		var pwEqual=document.getElementById(formName+"_pw-equal")
		if (pwInput.value==pwBackup.value) pwEqual.innerHTML = '<span style="color:green">'+_("OK.")+'</span>';	
		else pwEqual.innerHTML = '<span style="color:red">'+_("Passwords are not equal.")+'</span>';	
	}
	
	PageScript.prototype.initGettext = function(text) {
		// waiting for gettext loads po files
		try {
			self.dictionary=JSON.parse(text)
			_=function() { return self.gettext.apply( this, arguments ) } 
		}
		catch (e) {
			_=function(str) {return str;}
		}
		self.init_()
	}

	
	PageScript.prototype.gettext = function() {

		if (!arguments || arguments.length < 1 || !RegExp) return; // called without arguments
		arguments=$.map(arguments, function(value, index){return [value]})
        console.log(arguments)
        if (typeof arguments[0] != "string") {
                arguments=arguments[0]
                var str=arguments.shift()
                return self.gettext(str,arguments.map(function(value, index){return self.gettext(value)}))
        }
		var str = arguments.shift();

		if (arguments.length == 1 && typeof arguments[0] == 'object') {
			arguments=arguments[0].map(function(value, index){return [value]})
		}
	
		// Try to find translated string
		str = self.dictionary[str] || str

		// Check needed attrubutes given for tokens
		hasTokens = str.match(/%\D/g);
		hasPhytonTokens = str.match(/{\d}/g)
		if ( (hasTokens && hasTokens.length != arguments.length) || (hasPhytonTokens && hasPhytonTokens.length != arguments.length)) {
			console.log('Gettext error: Arguments count ('+ arguments.length +') does not match replacement token count ('+ ((hasTokens && hasTokens.length) + (hasPhytonTokens && hasPhytonTokens.length)) + ').');
			return str;
		}
		
		if (hasTokens) {
			// replace tokens with the given arguments
			var re  = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/; //'
			var a   = b = [], i = 0, numMatches = 0;		
			while (a = re.exec(str)) {
				var leftpart   = a[1], 
					pPad  = a[2], 
					pJustify  = a[3], 
					pMinLength = a[4],
					pPrecision = a[5], 
					pType = a[6], 
					rightPart = a[7];
				numMatches++;
				if (pType == '%') subst = '%';
				else {
					var param = arguments[i],
						pad   = '',
						justifyRight = true,
						minLength = -1,
						precision = -1,
						subst = param;
					if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
					else if (pPad) pad = pPad;
					if (pJustify && pJustify === "-") justifyRight = false;
					if (pMinLength) minLength = parseInt(pMinLength);
					if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
					if (pType == 'b')      subst = parseInt(param).toString(2);
					else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
					else if (pType == 'd') subst = parseInt(param) ? parseInt(param) : 0;
					else if (pType == 'u') subst = Math.abs(param);
					else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param) * Math.pow(10, precision)) / Math.pow(10, precision): parseFloat(param);
					else if (pType == 'o') subst = parseInt(param).toString(8);
					else if (pType == 's') subst = param;
					else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
					else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
				}
				str = leftpart + subst + rightPart;
				i++;
			}
		}
		if (hasPhytonTokens){
			arguments.forEach( function(value,key){ str=str.replace("{"+key+"}",value)} )
		}
		return str;
	}
	
}
	
pageScript = new PageScript();



/* 
==============================================
Back To Top Button
=============================================== */  
 
  $(window).scroll(function () {
            if ($(this).scrollTop() > 50) {
                $('#back-top').fadeIn();
            } else {
                $('#back-top').fadeOut();
            }
        });
      // scroll body to 0px on click
      $('#back-top').click(function () {
          $('#back-top a').tooltip('hide');
          $('body,html').animate({
              scrollTop: 0
          }, 800);
          return false;
      });
      
      if ($('#back-top').length!=0) $('#back-top').tooltip('hide');

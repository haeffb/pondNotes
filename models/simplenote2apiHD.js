/* Copyright 2011 Tiger Country Software Company, L.L.C. All rights reserved. */

enyo.kind({
	name: "simplenote",
	kind: enyo.Component,
	credentials: {email: "", pass: "", token: ""},
	notesList: [],
	events: {onToken: "", onIndex: "", onIndexDeleted: "", onNote: "", onUpdate: "", onCreate: "", onLogin: ""},
	components: [
		{name: "connectionService", kind: "PalmService", 
			service: "palm://com.palm.connectionmanager",
			method: "getstatus",
			onSuccess: "gotConnection", onFailure: "failedConnection"
		},
		{
			name: "login",
			kind: "WebService",
			url: "https://simple-note.appspot.com/api/login",
			method: "POST",
			onSuccess: "onSuccessToken",
			onFailure: "onFailureToken",
			contentType: 'application/json',
			handleAs: 'json'
		},
		{
			name: "index",
			kind: "WebService",
		    url: "https://simple-note.appspot.com/api2/index",
	        method: "GET",
	        onSuccess: "onSuccessIndex",
	        onFailure: "onFailureIndex",
			contentType: 'application/x-www-form-urlencoded',
			handleAs: 'json'	
		},
		{
			name: "indexfordeleted",
			kind: "WebService",
		    url: "https://simple-note.appspot.com/api2/index",
	        method: "GET",
	        onSuccess: "onSuccessIndexForDeleted",
	        onFailure: "onFailureIndexForDeleted",
			contentType: 'application/x-www-form-urlencoded',
			handleAs: 'json'	
		},
		{
			name: "notes",
			kind: "WebService",
		    url: "https://simple-note.appspot.com/api2/data",
	        method: "GET",
	        onSuccess: "onSuccessNote",
	        onFailure: "onFailureNote",
			contentType: 'application/x-www-form-urlencoded',
			handleAs: 'json'
		},
		{
			name: "updatenote",
			kind: "WebService",
		    url: "https://simple-note.appspot.com/api2/data",
	        method: "POST",
	        onSuccess: "onSuccessUpdate",
	        onFailure: "onFailure",
			contentType: 'application/x-www-form-urlencoded',
			handleAs: 'json'
		},
		{
			name: "createnote",
			kind: "WebService",
		    url: "https://simple-note.appspot.com/api2/data",
	        method: "POST",
	        onSuccess: "onSuccessCreate",
	        onFailure: "onFailure",
			contentType: 'application/x-www-form-urlencoded',
			handleAs: 'json'
		}
	],
	create: function () {
		this.inherited(arguments);
	},
	ready: function () {
		this.getCredentials();
	},
	setCredentials: function (email, pass) {
		this.credentials.email = email;
		this.credentials.pass = pass;
	},
	getCredentials: function () {
		var appPrefs = enyo.application.appPrefs;
		//this.log("Preferences in API", appPrefs);
		if (appPrefs) {
			this.credentials.email = appPrefs.email;
			this.credentials.pass = appPrefs.password;
		}
	},
	tryLogin: function (email, pass) {
		this.email = email;
		this.pass = pass;
		this.$.connectionService.call(); // event handler: doLogin 
		
	},
	gotConnection: function (inSender, inResponse) {
		//this.log("Connection Response", inResponse);
		//debugObject(inResponse, "noFuncs");
		if (inResponse.isInternetConnectionAvailable) {
			
			// FIXME change false to pref for sync only on wifi
			if (false ||
			inResponse.wifi.state === 'connected') {
				//this.log("Getting Token");
				this.sendLogin(this.email, this.pass);	
			}
			else {
				//this.log("Wifi not available!");
				this.doLogin({message: $L("Wifi not available!")});
			}
		}
		else {
				//this.log("Data connection not available!");
				this.doLogin({message: $L("Data connection not available!")});
		}	
	},			
	failedConnection: function(inSender, inResponse){
		//this.log("Connection Status Service Request FAILED!", inResponse);
		this.doLogin({message: $L("Connection Status Service Request failed")});
	},
	
	sendLogin: function (email, pass) {
		//this.log(email, pass);
	 	var postdata = Base64.encode('email='+ email + '&password=' + pass);
		//this.log ("Postdata", postdata);
		// Note: Must call the WebService with a string so that it doesn't
		// perform URL encoding on the object and ruin the Base64 encoding!!
		this.createComponent({name: "trylogin", kind: "WebService", 
			url: "https://simple-note.appspot.com/api/login",
			method: "POST",
			onSuccess: "loginSuccess", onFailure: "loginFailure",
			contentType: 'application/json',
			handleAs: 'json',
			//email: email,
			//pass: pass
			});		
		this.$.trylogin.call(postdata);	
	},
	loginSuccess: function (inSender, inResponse, inRequest) {
		this.log("Login Success!", inSender, inResponse, inRequest);
		//debugObject(inRequest.xhr, "noFuncs");
		// FIXME: don't send unencoded email & pass to server!!!!
		//this.setCredentials(inSender.email, inSender.pass);
		this.doLogin({
			token: inResponse,
			//email: inSender.email,
			//pass: inSender.pass
		});
		this.$.trylogin.destroy();
	},
	loginFailure: function (inSender, inResponse) {
		//this.log ("Login Failure! You should just do something different!", inSender, inResponse);
		this.doLogin({
			response: inResponse,
			message: $L("Unable to login. Please check your email and password.")
		});
		this.$.trylogin.destroy();
	},
	
/* TOKEN * --------------------------------------------------------- */
	getToken: function (email, pass) {
		this.getCredentials();
		email = email ? email: this.credentials.email;
		pass = pass ? pass: this.credentials.pass;
	 	var postdata = pass; //Base64.encode('email='+ email + '&password=' + pass);
		//this.log ("Postdata", postdata);
		// Note: Must call the WebService with a string so that it doesn't
		// perform URL encoding on the object and ruin the Base64 encoding!!
		this.$.login.call( postdata);
	},
	onSuccessToken: function(inSender, inResponse) {
		//this.log("success getToken response = ", inResponse, inSender);
		if (inResponse) {
			this.credentials.token = inResponse;
			this.doToken({
				token: "success"
			});
		}
		else {
			this.doToken({token: "failure"});
		}
	},
	onFailureToken: function ( inSender, inEvent ) {
		this.doToken({token: "failure"});
	},
	
/* INDEX * ----------------------------------------------- */
	getIndex: function (mark, lastSync) {
		this.$.index.call({
			auth: this.credentials.token,
			email: this.credentials.email,
			length: 100,
			mark: mark,
			since: lastSync			
		});
		
	},
	onSuccessIndex: function (inSender, inResponse, inRequest) {
		//this.log("success index response = ", inResponse, inSender, inRequest);
		//this.index = inResponse;
		
		this.doIndex({index: inResponse});
	},
	onFailureIndex: function (inSender, inResponse, inRequest) {
		//this.log("failure index response = ", inResponse, inSender, inRequest)
		this.doIndex({index: null})
	},
	getIndexForDeleted: function (mark, lastSync) {
		this.$.indexfordeleted.call({
			auth: this.credentials.token,
			email: this.credentials.email,
			length: 100,
			mark: mark,
			since: lastSync			
		});
		
	},
	onSuccessIndexForDeleted: function (inSender, inResponse, inRequest) {
		//this.log("success indexfordeleted response = ", inResponse, inSender, inRequest);
		this.doIndexDeleted({index: inResponse});
	},
	onFailureIndexForDeleted: function (inSender, inResponse, inRequest) {
		//this.log("================failure indexfordeleted!==============")
		this.doIndexDeleted({index: null})
	},
	
/* NOTE * ------------------------------------------------------------- */
	getNote: function (inNoteKey) {
		var name = "getNote" + inNoteKey;
		// used createComponent because I was having trouble getting multiple notes with a single
		// instance of WebService - each call resulted in the same note, regardless of the 
		// keys sent to the URL
		this.createComponent({name: name, kind: "WebService", onSuccess: "onSuccessNote", onFailure: "onFailureNote"});
		this.$[name].setUrl("https://simple-note.appspot.com/api2/data/" + inNoteKey)
		this.$[name].call({
			auth: this.credentials.token,
			email: this.credentials.email
		})
	},
	onSuccessNote: function (inSender, inResponse, inRequest) {
		//this.log("API success getNote response = ", inResponse, inSender, inRequest);
		//adjust from seconds to millis
		inResponse.createdate *= 1000;
		inResponse.modifydate *= 1000;
		this.doNote({
			note: inResponse
		});		
		// destroy the components after they're used
		this.$[inSender.name].destroy();
	},	
	onFailureNote: function (inSender, inResponse, inRequest) {
		this.doNote({
			note: {
				code: 123,
				message: "Failed to retrieve note"
			}
		});
		this.$[inSender.name].destroy();
	},
	updateNote: function (inNote) {
		//this.log("Updating", inNote);
		var name = "updateNote" + inNote.key;
		this.createComponent({name: name, kind: "WebService", method: "POST", 
			onSuccess: "onSuccessUpdate", onFailure: "onFailureUpdate",
			contentType: 'application/json',
			handleAs: 'json',
		});
		var url = "https://simple-note.appspot.com/api2/data/" + inNote.key + "?auth=" + this.credentials.token + "&email=" + this.credentials.email;
		this.$[name].setUrl(url);
		inNote.modifydate /= 1000;
		inNote.createdate /= 1000;
		this.$[name].call(encodeURIComponent(enyo.json.stringify(inNote)));
	},
	onSuccessUpdate: function (inSender, inResponse, inRequest) {
		//this.log("success update response = ", inResponse, inRequest);
		//adjust from seconds to millis
		inResponse.createdate *= 1000;
		inResponse.modifydate *= 1000;
		this.doUpdate({
			note: enyo.json.parse(decodeURIComponent(inRequest.params)),
			response: inResponse
		});
		this.$[inSender.name].destroy();
	},
	onFailureUpdate: function (inSender, inResponse, inRequest) {
		this.doUpdate({
			note: enyo.json.parse(decodeURIComponent(inRequest.params)),
			error: {code: 0, message: "Failed to update note in Simplenote!"},
			response: null
		});
		this.$[inSender.name].destroy();
		
	},
	createNote: function (inNote) {
		var note = {};
		note.tags = inNote.tags;
		note.systemtags = inNote.systemtags;
		note.content = inNote.content;
		note.modifydate = inNote.modifydate/1000;
		note.createdate = inNote.createdate/1000;
		note.deleted = inNote.deleted;
		note.value = inNote.value;
		var name = "createNote" + inNote.value;
		this.createComponent({name: name, kind: "WebService", method: "POST", 
			onSuccess: "onSuccessCreate", onFailure: "onFailureCreate",
			contentType: 'application/json',
			handleAs: 'json',
		})
		var url = "https://simple-note.appspot.com/api2/data?auth=" + this.credentials.token + "&email=" + this.credentials.email;
		this.$[name].setUrl(url);
		this.$[name].call(encodeURIComponent(enyo.json.stringify(note)));
	},
	onSuccessCreate: function (inSender, inResponse, inRequest) {
		//this.log("success create response = ", inResponse, inRequest);
		//adjust from seconds to millis
		inResponse.createdate *= 1000;
		inResponse.modifydate *= 1000;
		this.doCreate({
			note:  enyo.json.parse(decodeURIComponent(inRequest.params)),
			response: inResponse
		});
		this.$[inSender.name].destroy();
	},
	onFailureCreate: function (inSender, inResponse, inRequest) {
		this.doCreate({
			note: enyo.json.parse(decodeURIComponent(inRequest.params)),
			error: {code: 0, message: "Failed to create note in Simplenote!"},
			response: null
		});
		this.$[inSender.name].destroy();
	},
	onFailure: function (inSender, inResponse, inRequest) {
		//this.log("API: failure response = ", inSender, inResponse, inRequest)
	}
});

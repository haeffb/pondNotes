enyo.kind({
	name: "sync",
	kind: "Component",
	events: {
		onSyncFinished: "",
		onSyncLog: "",
		onLogin: "doLogin" //pass along event from API
	},
	components: [
		{name: "simplenoteAPI", kind: "simplenote", 
			onToken:		"apiGotToken",
			onIndex: 		"apiGotIndex",
			onIndexDeleted:	"apiGotIndexForDeleted",
			onNote: 		"apiGotNote",
			onUpdate: 		"apiGotUpdate",
			onCreate: 		"apiGotCreate",
			onDelete: 		"apiGotDelete",
			onLogin:		"apiLogin"},	
/*
		{name: "dataSQL", kind: "storage.SQLite",
			onNotesRetrieved: 	"dbNotesRetrieved",
			onNoteCreated: 		"dbNoteCreated",
			onNoteUpdated: 		"dbNoteUpdated",
			onNoteDeleted: 		"dbNoteDeleted",
		},

*/		{name: "connectionService", kind: "PalmService", 
			service: "palm://com.palm.connectionmanager",
			method: "getstatus",
			onSuccess: "gotConnection", onFailure: "failedConnection"
		}
	],
	//Object to track sync progress	
	create: function () {
		this.inherited(arguments);
		this.lastSyncLocal = 0;
		this.lastSyncServer = 0;
		this.dataSQL = enyo.application.appDB;
		
	},
	setSyncTimes: function () {
			this.lastSyncLocal = enyo.application.appPrefs.lastSyncLocal;
			this.lastSyncServer = enyo.application.appPrefs.lastSyncServer;
	},
	/* Used for initial login attempt from Account Login popup */
	tryLogin: function (email, pass) {
		this.$.simplenoteAPI.tryLogin(email, pass);
	},
	/* Event handler for API login */
	apiLogin: function (inSender, inEvent) {
		this.doLogin(inEvent);
	},
	
/* BEGIN SYNC PROCESS * ----------------------------------------- */
	beginSync: function() {
		//this.log(" ======================  Starting Sync Process ==============================");	
		this.setSyncTimes();
		this.webNotesModified = [];
		this.newLastSyncLocal = new Date().getTime();
		this.synced = {
			notes: false,
			notesdeleted: false,
			notesadded: false,
			localmodified: false,
			apinotes: true, // currently not used
		};
		// used to count number of database transactions that need to complete:
		this.count = {
			notes: 0,
			notesdeleted: 0,
			notesadded: 0,
			localmodified: 0,
			apinotes: 0
		};
		this.total = {
			token: 0,
			notes: 0,
			apinotes: 0,
			localmodified: 0,
			notesadded: 0,
			notesdeleted: 0,
			position: 1,
		};
		this.doing = {
			notes: false,
			apinotes: false,
			localmodified: false,
			notesadded: false,
			notesdeleted: false
		};
		this.doSyncLog({message:"Beginning Sync Process " + 
			new enyo.g11n.DateFmt({
				time: "long",
			}).format(new Date()),
			position: this.updatePosition()		
		});
		this.startedDeleted = false;
		this.startedLocal = false;
		this.webNotesModified = [];
		this.syncFail = [];
		this.webIndex = [] // array of keys for web notes - check against local for deleted web notes	
		this.$.connectionService.call(); // event handler: gotConnection 
	},
	updatePosition: function () {
		//this.log(this.doing);
		//this.log(this.count);
		//this.log(this.total);
		var pos = this.total.token + 2;
		if (this.doing.localmodified) pos += this.total.localmodified ? 20* (this.total.localmodified - this.count.localmodified)/this.total.localmodified: 20;
		if (this.doing.notesadded) pos += this.total.notesadded ? 20* (this.total.notesadded - this.count.notesadded)/this.total.notesadded: 20; 
		if (this.doing.notes) pos += this.total.notes ? 20* (this.total.notes - this.count.notes)/this.total.notes : 20;
		if (this.doing.apinotes) pos += this.total.apinotes ? 20* (this.total.apinotes - this.count.apinotes)/this.total.apinotes: 20; 
		if (this.doing.notesdeleted) pos += this.total.notesdeleted? 15* (this.total.notesdeleted - this.count.notesdeleted)/this.total.notesdeleted: 15;
		//this.log("position: ", pos);
		return pos;
	},
	gotConnection: function (inSender, inResponse) {
		//this.log("Connection Response", inResponse);
		//debugObject(inResponse, "noFuncs");
		if (inResponse.isInternetConnectionAvailable) {
			
			// FIXME change false to pref for sync only on wifi
			if (false ||
			inResponse.wifi.state === 'connected') {
				//this.log("Getting Token");
				this.$.simplenoteAPI.getToken();	
			}
			else {
				//this.log("Wifi not available!");
				this.syncFail.push({
					type: "wifi"
				});
				this.doSyncLog({message: "Sync Failed - Wifi connection not available!"});
				this.syncFinished({sync: "failure", message: $L("Sync Failed - wifi connection not available!")})	
			}
		}
		else {
				//this.log("Data connection not available!");
				this.syncFail.push({
					type: "connection"
				});
				this.doSyncLog({message: "Sync Failed - Data connection not available!"});
				this.syncFinished({sync: "failure", message: $L("Sync Failed - data connection not available!")})	
		}
	},			
	failedConnection: function(inSender, inResponse){
		//this.log("Connection Status Service Request FAILED!");
		this.syncFail.push({type: "connectionservice"});
		this.syncFinished({sync: "failure", message: $L("Failed to get connection information from device!")})	
	},
	
/* FIRST STEP - retrieve token call from gotConnection and get modified notes from DB * ----------------------------- */
	apiGotToken: function (inSender, inEvent) {
		if (inEvent.token && inEvent.token === "success") {
			//this.log("Token retrieved!");
			this.total.token = 3;
			//this.log(this.updatePosition());
			this.doSyncLog({message: "Token Retrieved", position: this.updatePosition()});
			
			// Get locally modified notes
			var sqlString = "SELECT * FROM notes WHERE modifydate > " +
			this.lastSyncLocal +
			" AND key != 0;";
			//this.dataSQL.getNotes(sqlString, "modified", null, enyo.bind(this, this.dbNotesRetrieved));
			//this.log("Getting index for deleted notes");
			this.$.simplenoteAPI.getIndexForDeleted(null, null);
		}
		else {
			this.syncFail.push({type: "token"});
			//this.log("Failed to retrieve token for sync");
			this.doSyncLog({message: "Sync Failed - Failed to retrieve token from Simplenote"});
			this.syncFinished({sync: "failure", message: $L("Failed to retrieve token from Simplenote!")})
		}
	},
	dbNotesRetrieved: function (inSender, inEvent) {
		// handle notes depending on which type of request
		//this.log("SYNC: Got notes from DB:", inEvent.notes, inEvent.type, inEvent.originalNote);
		switch(inEvent.type) {
			// any notes that are new on device (key = 0)
			case "new":
				this.syncNewLocalToWeb(inEvent.notes);
				break;
			// any notes that have been modified on device (modifydate > sync date)
			case "modified":
				//this.log ("Got Notes");
				this.syncLocalToWeb(inEvent.notes);
				break;
			// single note from API - check against database to see if updated or new
			case "notes":
				this.checkedNote(inEvent);
				break;
			// all notes in DB to see if have been deleted from web
			case "notesdeleted":
				this.checkWebDeleted(inEvent.notes);
		}
	},
	
/* SECOND STEP - local modified notes update to web * ----------------------------- */
	syncLocalToWeb: function (inNotes) {
		var i;
		// Sync Local Modified notes to web
		//this.log("SYNC: Local modified to web", inNotes.length);

		this.total.localmodified = inNotes.length ? inNotes.length : 0; 
		this.doing.localmodified = true;
		
		this.doSyncLog({message: "Sending " + inNotes.length + 
				" locally modified notes to Simplenote"		
		});
		if (inNotes.length) {
			for (i = 0; i < inNotes.length; i++) {
				this.count.localmodified += 1;
				// event handled by this.gotUpdate and returns inEvent with note and response from server
				this.$.simplenoteAPI.updateNote(inNotes[i]);
			}
		}
		else {
			this.count.localmodified = 1;
			this.finishTransactions("localmodified");
		}
		
		//Get new local notes and send to web
		var sqlString = "SELECT * FROM notes WHERE key = 0;";
		this.dataSQL.getNotes(sqlString, "new", null, enyo.bind(this, this.dbNotesRetrieved));
	},
	syncNewLocalToWeb: function (inNotes) {
		var i;
		//this.log("Sending New Notes to Web: ", inNotes.length);
		this.doSyncLog({message: "Sending " + inNotes.length + 
			" new local notes to Simplenote"
		});
		this.total.notesadded = inNotes.length ? inNotes.length : 0;
		this.doing.notesadded = true;
		if (inNotes.length) {
			for (i = 0; i < inNotes.length; i++) {
				//this.log("Creating note", i, inNotes[i]);
				this.count.notesadded += 1;
				this.$.simplenoteAPI.createNote(inNotes[i]);
			}
		}
		else {
			this.count.notesadded = 1;
			this.finishTransactions('notesadded');
		}
		
		this.$.simplenoteAPI.getIndex(null, this.lastSyncServer);
	},	
	apiGotCreate: function (inSender, inEvent) {
		//this.log("SYNC note created", inEvent);
		if (inEvent.error) {
			//failure in api.createNote request
			//this.log("Failure in api createNote!");
			this.finishTransactions('notesadded');
			this.doSyncLog({message: "Failed to create note in Simplenote: " + inEvent.note.content.substr(0, 30)});
			this.syncFail.push({type: "create", note: inEvent.note});
			enyo.windows.addBannerMessage($L("Failed to create note in Simplenote!"), "{}", "smallicon");
		}
		else {
			// delete original local version
			this.dataSQL.deleteNote(inEvent.note, "notesadded", enyo.bind(this, this.dbNoteDeleted));
			if (!inEvent.response.content) {
				inEvent.response.content = inEvent.note.content;
			} 
			inEvent.response.value = inEvent.response.key;
			// add web server version
			this.dataSQL.createNote(inEvent.response, 'notesadded', enyo.bind(this, this.dbNoteCreated));
		}
		
	},
	dbNoteCreated: function (inSender, inType) {
		//this.log("SYNC: Note created", inType, inSender);
		this.doSyncLog({position: this.updatePosition()});
		this.finishTransactions(inType);
	},
	apiGotUpdate: function (inSender, inEvent) {
		//this.log("Local mod note", inEvent.note);
		//this.log("Response from updateNote API", inEvent.response);
		if (inEvent.response && inEvent.note.key === inEvent.response.key) {
			// we're good!
			//if response contains content, the note had previously been
			//edited in another client so the server combined versions
			//otherwise response contains no content and our original
			//note content is good.
			inEvent.response.content = inEvent.response.content || inEvent.note.content;
			//inEvent.response.createdate *= 1000;
			//inEvent.response.modifydate *= 1000;
			inEvent.response.value = inEvent.note.value;
			this.dataSQL.updateNote(inEvent.response, "localmodified", enyo.bind(this, this.dbNoteUpdated));
		}
		else {
			// failure in api.updateNote
			//this.log("Failure in API Update!!!");
			this.finishTransactions('localmodified');
			this.syncFail.push({type: "update", note: inEvent.note});
			this.doSyncLog({message: "Failed to update note in Simplenote: " + inEvent.note.content.substr(0,30)});
			
			enyo.windows.addBannerMessage($L("Failed to update note in Simplenote!"), "{}", "smallicon");

		}
	},
	dbNoteUpdated: function (inSender, inType) {
		this.doSyncLog({position: this.updatePosition()});
		this.finishTransactions(inType);
	},
	
	apiGotIndex: function (inSender, inEvent) {
		if (inEvent.index && inEvent.index.data) {
			//this.log("SYNC: apiGotIndex:", inEvent.index.data.length);
			var index = inEvent.index;
			this.newLastSyncServer = index.time;
			for (i = 0; i < index.data.length; i++) {
				//this.log("SYNC: data from index", i, index.data[i].key)
				this.webNotesModified.push(index.data[i]);
			}
			if (index.mark) {
				//need to retrieve more notes
				//this.log("SYNC: apiGotIndex, getting another index");
				this.$.simplenoteAPI.getIndex(index.mark, this.lastSyncServer);
			}
			else {
				this.count.apinotes = this.webNotesModified.length;
				this.total.apinotes = this.webNotesModified.length;
				this.doing.apinotes = true;
				this.syncWebToLocal();
			}
		}
		else {
			this.syncFail.push({type: "index"});
			//this.log("Failed to retrieve index");
			this.doSyncLog({message: "Sync Failed - Failed to retrieve index from Simplenote!"});
			this.syncFinished({sync: "failure", message: $L("Failed to retrieve index from Simplenote!")})
		}
		
	},
	syncWebToLocal: function () {
		var i;
		//this.log("SYNC: Syncing web to local", this.webNotesModified.length);
		this.doSyncLog({message: "Retrieving " + this.webNotesModified.length + " modified notes from Simplenote"});
		this.total.notes = this.webNotesModified.length ? this.webNotesModified.length : 0;
		this.doing.notes = true;
		if (this.webNotesModified.length) {
			for (i = 0; i < this.webNotesModified.length; i++) {
				this.count.notes += 1;
				//this.log("SYNC: getting note from API:", this.webNotesModified[i].key);
				this.$.simplenoteAPI.getNote(this.webNotesModified[i].key);
			}
		}
		else {
			this.count.notes = 1;
			this.finishTransactions('notes');
		}
		
		//retrieve web notes index to compare to local notes - find notes
		//that have been deleted from web but still on local
		//this.log("Getting index for deleted notes");
		//this.$.simplenoteAPI.getIndexForDeleted(null, null);
		
	},
	apiGotIndexForDeleted: function (inSender, inEvent) {
		if (inEvent.index && inEvent.index.data) {
			//this.log("SYNC: apiGotIndexForDeleted:", inEvent.index.data.length);
			var index = inEvent.index;
			//this.newLastSyncServer = index.time;			
			for (i = 0; i < index.data.length; i++) {
				//this.log("SYNC: data from index", i, index.data[i].key)
				this.webIndex.push(index.data[i]);
			}
			if (index.mark) {
				//need to retrieve more notes
				//this.log("SYNC: apiGotIndexForDeleted, getting another index");
				this.$.simplenoteAPI.getIndexForDeleted(index.mark, null);
			}
			else {
				// check list of notes on web versus device to see if notes deleted from
				// web need to be deleted from device
				var sqlString = "SELECT * FROM notes WHERE key > 0;";
				this.dataSQL.getNotes(sqlString, "notesdeleted", null, enyo.bind(this, this.dbNotesRetrieved));
			}
		}
		else {
			this.syncFail.push({type: "index"});
			//this.log("Failed to retrieve index from Simplenote");
			this.doSyncLog({message: "Sync Failed - Failed to retrieve index from Simplenote for deleted notes!"});
			this.syncFinished({sync: "failure", message: $L("Failed to retrieve index from Simplenote!")})
		}

	},
	checkWebDeleted: function (localNotes) {
		//this.log("Local notes index:", localNotes.length);
		//this.log("Web notex index", this.webIndex.length);
		// delete local notes that no longer exist on server
		this.doSyncLog({message: "Checking for notes deleted from Simplenote"});
		var ii, jj, count = 0, found, notesToDelete = [];
		for (ii = 0; ii < localNotes.length; ii++) {
			found = false;
			//this.log("local", localNotes[ii].key);
			for (jj = 0; jj < this.webIndex.length; jj++) {
				if (this.webIndex[jj].key == localNotes[ii].key) {
					found = true;
					//this.log("Found note!", ii, localNotes[ii].key);
				}
			}
			//this.log("Woo", localNotes[ii]);
			if (!found) {
				//this.log("Delete note", ii, count, localNotes[ii].key);
				this.count.notesdeleted += 1;
				count += 1;
				notesToDelete.push(localNotes[ii]);
				//this.dataSQL.deleteNote(localNotes[ii], "notesdeleted", enyo.bind(this, this.dbNoteDeleted);
			}
		}	
		this.total.notesdeleted = count;
		this.doing.notesdeleted = true;
		if (!count) {
			this.count.notesdeleted = 1;
			this.finishTransactions('notesdeleted');
		}
		else {
			for (ii = 0; ii < count; ii++) {
				this.dataSQL.deleteNote(notesToDelete[ii], "notesdeleted", enyo.bind(this, this.dbNoteDeleted));
			}
		}
	
	},
	dbNoteDeleted: function (inSender, inEvent) {
		//this.log("Deleted!");
		this.doSyncLog({position: this.updatePosition()});
		if (inEvent.type === "notesdeleted") {
			this.finishTransactions('notesdeleted');
		}
	},
	apiGotNote: function (inSender, inEvent) {
		if (inEvent.note.code) {
			// failure in api.getNote request
			this.syncFail.push({type: "note", note: inEvent.note});
			//this.log("Failure to get note from server");
			this.doSyncLog({message: "Failed to retrieve note from Simplenote!"});
			this.finishTransactions('notes');
			enyo.windows.addBannerMessage($L("Failed to get note from Simplenote!"), "{}", "smallicon");
		}
		else {
			// check to see if note already in database
			//this.log("SYNC: got Note from API, checking DB", inEvent.note.key);
			var sqlString;
			sqlString = "SELECT * FROM notes WHERE key = '" +
				inEvent.note.key +
				"';";
			this.dataSQL.getNotes(sqlString, "notes", inEvent.note, enyo.bind(this, this.dbNotesRetrieved));
			this.finishTransactions("apinotes");
			this.doSyncLog({position: this.updatePosition()});
		}
	},
	checkedNote: function (inEvent) {
		//this.log("Checking Note: ", inEvent.notes, inEvent.type, inEvent.originalNote);
		if (inEvent.notes.length) {
			//this.log("Checked note and found existing", inEvent.notes );
			inEvent.originalNote.value = inEvent.notes[0].value;
			this.dataSQL.updateNote(inEvent.originalNote, 'notes', enyo.bind(this, this.dbNoteUpdated));		
		}	
		else {
			inEvent.originalNote.value = inEvent.originalNote.key;
			//this.log("Checked note and creating new", inEvent.originalNote);
			this.dataSQL.createNote(inEvent.originalNote, 'notes', enyo.bind(this, this.dbNoteCreated));			
		}
		
	},
	
	// Keep track of what's been synced and finish sync when done
	finishTransactions: function (type) {
		this.count[type] -= 1;
		this.doSyncLog({position: this.updatePosition()});
		//this.log("Transaction type: ", type, this.count[type]);
		if (this.count[type] <= 0) {
			//Mojo.Log.info("Sync finished for ", type);
			this.synced[type] = true;
		}
		
		if (this.synced.notes &&
			//this.synced.notesdeleted &&
			this.synced.notesadded && 
			this.synced.localmodified &&
			this.synced.apinotes) //&& 
			//!this.startedDeleted) 
			{
				//this.startedDeleted = true;
				// check list of notes on web versus device to see if notes deleted from
				// web need to be deleted from device
				//var sqlString = "SELECT * FROM notes WHERE key > 0;";
				//this.dataSQL.getNotes(sqlString, "notesdeleted", null, enyo.bind(this, this.dbNotesRetrieved);
				
				//retrieve web notes index to compare to local notes - find notes
				//that have been deleted from web but still on local
			this.syncFinished({sync: "success", message: "Sync successful!"});
		}
		if (this.synced.notesdeleted &&
				!this.startedLocal) {
			// Get locally modified notes
			var sqlString = "SELECT * FROM notes WHERE modifydate > " +
			this.lastSyncLocal +
			" AND key != 0;";
			this.dataSQL.getNotes(sqlString, "modified", null, enyo.bind(this, this.dbNotesRetrieved));
			this.startedLocal = true
		}
	},
	syncFinished: function (inEvent) {
		if (inEvent.sync && inEvent.sync === "success" && !this.syncFail.length) {
			enyo.application.appPrefs.lastSyncLocal = this.newLastSyncLocal;
			this.lastSyncLocal = this.newLastSyncLocal;
			enyo.application.appPrefs.lastSyncServer = this.newLastSyncServer;
			this.lastSyncServer = this.newLastSyncServer;
		}		
		if (this.syncFail.length) {
			inEvent.message = $L("Sync Failed! See Sync Log.");
			inEvent.syncFail = this.syncFail;
		}
		this.doSyncLog({message: "Finished Sync Process " + 
			new enyo.g11n.DateFmt({
				time: "long",
			}).format(new Date()),
			//position: 100
		});
		this.doSyncFinished(inEvent);
	}
	
});

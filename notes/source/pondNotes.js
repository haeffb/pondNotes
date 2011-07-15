/* Copyright 2011 Tiger Country Software, L.L.C. All rights reserved. */


enyo.kind({
	name: "pondNotes",
	kind: enyo.VFlexBox,
	notes: [],
	selectedNote: {},
	selectedRowIndex: 0,
	showStampMenu: false,
	published: {
		launchParams: null,
		selectedNote: null,
		selectedRowIndex: 0
	},
	components: [			
		// Simplenote API kind from simplenoteAPIHD.js	
		{name: "simplenoteSync", kind: "sync", onSyncLog: "updateSyncLog", onSyncFinished: "syncFinished", onLogin: "checkLogin"},
		
		// Generic palm service to use for call to browser
		{name: "service", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},

		// Application events handlers
		{kind: "ApplicationEvents", onWindowParamsChange: "handleWinParamsChanged"},
		
		{kind: "AppMenu", onBeforeOpen: "beforeAppMenuOpen", components: [
			{kind: "EditMenu"},
			{caption: $L("Preferences"), onclick: "showSortMenu"},
			{caption: $L("About"), onclick: "supportInfo"},
			{caption: $L("Help"), onclick: "showHelp"},
		]},

		{name: "header", kind: "PageHeader", components: [
			{name: "backButton", kind: "Button", caption: $L("Back"), onclick: "closeHelp", showing: false},
			{kind: "Image", src: "images/1pondnoteslogo64.png", style: "margin: -15px 0px -15px 0px; padding: -20px;",
				onclick: "launchWebsite" },
			{kind: "Spacer"},
			{kind: "ActivityButton", name: "accountButton", caption: '', style: "font-size: 15px;", onclick: "accountClicked",
				components: [
					{kind: "Image", src: "images/menu-arrow.png"}
				]},
			{kind: "Image", src: "images/icon-sync.png", name: "syncButton", onclick: "syncNow"},
			{name: "syncSpinner", kind: "Spinner", showing: false},
			//{name: "folderUnread", className: "mail-unread-header", flex:0, style:"margin-right:8px;", showing: false},
 			//{name: "syncSpinner", nodeTag: "div", className: "sync-activity-animation", showing: false},
			{kind: "Menu", name: "accountMenu", onclick: "accountMenuSelected", components: [
				{caption: $L("Account Login"), value: "account", onclick: "accountSettings"},
				{caption: $L("Show Sync Log"), value: "sync", onclick: "showSyncLog"},
				//{caption: $L("Settings"), value: "settings", onclick: "showSortMenu"}
			]}
		]},
		{name: "syncProgressBar", kind: "ProgressBar", showing: false},
		{name: "mainPane", kind: "Pane", flex: 1, components: [
			{name: "mySlidingPane", kind: "SlidingPane", flex: 1, components: [
				{name: "listPane", kind: "SlidingView", width: "320px", components: [
					{name: "tags", kind: "Toolbar", className: "enyo-toolbar-light", components: [
						{kind: "Image", src: "images/15-tags.png", style: "padding: 0 10px;"},
						{name: "tagSelector", kind: "ListSelector", 
							style: "min-width: 100px;",
							onChange: "tagChanged", value: "All Notes", items: [{caption: "test", value: 1}]},
				//		{kind: "Spacer"},
				//		{kind: "Image", src: "images/icon-sort.png", onclick: "showSortMenu"},
						{kind: "Spacer"},
						{name: "noteCount", kind: "HtmlContent", className: "notes-count", content: "0"},
					]},
	
					{name: "list", kind: "VirtualList", className: "list", style: "width: 320px; ", flex: 1,
					      onSetupRow: "setupRow", components: [
						  		{name: "notesListDivider", kind: "Divider"},
								{name: "item", kind: "SwipeableItem", className: "item", onConfirm: "deleteSwiped", layoutKind: "HFlexLayout",
									tapHighlight: true, 
									onclick: "listClicked",
									components: [
										{layoutKind: "VFlexLayout", className: "notelist-width", components: [
	 										{layoutKind: "HFlexLayout", components: [
												{name: "pinIcon", kind: "Image", src: "images/icon-pin.png", showing: false, style: "padding-right: 5px;"}, 
												{name: "notetitle", className: "truncating-text notetitle-width", flex: 1},
												//style: "font-weight: bold;", flex: 1},
												{name: "notedate", className: "enyo-item-ternary notelist-date"}
											]}, 
											{name: "notebody", className: "enyo-item-secondary truncating-text notelist-width",}
										]}
					          		]}
					      	]
					},			
					{kind: "Toolbar", pack: "center", components: [
						{icon: "images/menu-icon-add.png", onclick: "addNoteButtonClicked"},
						{kind: "Spacer"},
						{name: "searchField", kind: "ToolSearchInput", 
							onkeypress: "logKeys", oninput: "searchNotes", onCancel: "searchCancel" },
					]}
	
				]},
				{name: "noteViewer", kind: "noteView1", onNoteSaved: "noteSaved",
					onDeleteClicked: "doDeleteClicked"}

			]},
			{name: "helpPane", kind: "pondNotes.Help"},
			{name: "prefsPane", kind: "Preferences"}
		]},
		{
			kind: "PalmService",
			service: "palm://com.palm.applicationManager/",
			method: "open"
   		},
		/* Login popup dialog*/
		
		{kind: "ModalDialog", name: "login", caption: $L("Simplenote Login"), onBeforeOpen: "accountSettingsBeforeOpen", components:[
				{kind: "HtmlContent", name: "accountHelp", onclick: "openSimplenoteWebsite",
					content: $L('A <a href="http://simple-note.appspot.com">Simplenote</a> account is required in order to sync your data.'),
					className: "enyo-item-ternary info-text"},
				{kind: "RowGroup", components: [
					{name: "emailInput", kind: "Input", inputType: "email", 
						autoCapitalize: "lowercase", 
					hint: "enter email address...", onchange: "inputChange", oninput: "emailChange",
					conkeypress: "logKeys"},
				]},
				{kind: "RowGroup", components: [
					{name: "passInput", kind: "PasswordInput", hint: "enter password...", 
						onchange: "inputChange", onkeypress: "logKeys"},
				]},
				{kind: "HtmlContent", name: "noPassword", content: $L("Account password is not saved on device."),
					className: "enyo-item-ternary info-text"},
				{kind: "HtmlContent", name: "loginChange", content: $L("WARNING! Changing account info will delete any existing pondNotes data. Choose Cancel if you need to save any data to Simplenote."), 
					className: "enyo-text-error warning-icon red", display: false},
			{kind: "HtmlContent", name: "loginFail", content: $L("Unable to login. Please check your email and password."), 
					className: "enyo-item-ternary info-text red", display: false},
			{layoutKind: "HFlexLayout", components: [  
	    		{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "cancelLogin"},
		    	{kind: "ActivityButton", name: "loginButton", caption: $L("Login"), flex: 1, onclick: "accountLogin", className: "enyo-button-dark"},
			]},
		]},
		
		// Settings Dialog
		{kind: "ModalDialog", name: "settings", caption: $L("Preferences"), onBeforeOpen: "settingsBeforeOpen",
			components: [
				{kind: "RowGroup", caption: $L("Sort"), components: [
					{kind: "ListSelector", name: "sortType"},
					{kind: "ListSelector", name: "sortOrder"}
				]},
				{layoutKind: "HFlexLayout", components: [
					{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "cancelSettings"},
					{kind: "Button", caption: $L("Done"), flex: 1, onclick: "saveSettings", className: "enyo-button-affirmative"}
				]}
			]
		
		},
		// Dialog Prompt
		{name: "deleteDialog", kind: "ModalDialog", caption: $L("Delete Note"),
			components: [
				{kind: "HtmlContent", content: $L("Delete the selected note?"), style: "text-align: center;"},
				{layoutKind: "HFlexLayout", align: "center", pack: "center", components: [
					{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "closeDeleteDialog"},
					{kind: "Button", caption: $L("Delete"), flex: 1, className: "enyo-button-negative", onclick: "doDeleteClicked"}
				]}
			]
		},
		
		// Sync Log Toaster
		{name: "syncLog", kind: "Toaster", lazy: false, flyInFrom: "Right", className: "sync-log", onclick: "removeSyncLog", components: [
				{name: "syncContent", kind: "HtmlContent", content: $L("Sync Log (tap to close)") + " <br/>"}
			]
			
		},
		
		// Support 
		{kind: "ModalDialog", caption: $L("About"), name: "support", components: [
			{kind: "generic.AppInfo", name: "supportInfo", onClose: "supportClose"},	
		]},
		
		// Spinner for initial data load
		{name: "dataSpinner", kind: "Spinner", showing: false}
		
	],
	logKeys: function (inSender, inEvent) {
		//this.log(inSender, inEvent);
		var enterPressed = (inEvent.charCode === 13);
		//this.log(enterPressed);
		switch (inSender.name) {
			case "emailInput":
			case "passInput":
				if (enterPressed) this.accountLogin();
				break;
			case "searchField":
				if (enterPressed) {
					this.addNote({
						note: this.$.searchField.getValue()
					});
					this.$.searchField.setValue("");
					this.searchCancel();
					
				}
				break;
		}
	},
/* SETUP STUFF * -------------------------------------------------- */
	handleWinParamsChanged: function (inSender, inEvent) {
		//this.log(enyo.windowParams);
		//this.setLaunchParams(enyo.windowParams);
		if (enyo.windowParams && enyo.windowParams.action) {
			switch (enyo.windowParams.action) {
				case "addnote":
					this.addNote({
						note: enyo.windowParams.note
					});
					break;
				case "sync":
					this.syncNow();
			}
		}

	},
/*
	launchParamsChanged: function (inSender, inEvent) {
		//this.log("Launch Params:",this.launchParams);
		switch (this.launchParams.action) {
			case "addnote":
				this.addNote({
					note: this.launchParams.note
				});
				break;
		}
	},

*/	create: function (inSender) {
		//this.log(arguments);
		this.inherited(arguments);
		this.dataSQL = enyo.application.appDB;
		//this.log (this.dataSQL);
		
		this.getPrefs();
		//this.$.dataSpinner.show();
		this.getData();
		this.tagsArray=[];
	},
	ready: function (inSender) {
		//this.log();
		this.inherited(arguments);
		this.$.mainPane.selectViewByName("mySlidingPane");
		//this.syncNow();
		//this.$.noteViewPane.selectViewByName("noteViewScroller");
		//this.$.noteViewer.setViewType("noteViewScroller");
	},
	getData: function () {
		//this.log();
		this.dataSQL.getNotes(null, "display", null, enyo.bind(this, this.updateList));
		this.dataSQL.getTags("display", enyo.bind(this, this.updateTags));		
	},

/* APP MENU * ---------------------------------------------------- */
	beforeAppMenuOpen: function() {
		
	},

/* PREFS * -------------------------------------------------------- */	
	getPrefs: function () {
		this.appPrefs = enyo.application.appPrefs;
		this.$.accountButton.setCaption(this.appPrefs.email ? this.appPrefs.email: $L("Login Here!"));

		//this.log("Preferences", this.appPrefs);	
		this.savePrefs();
	},
	savePrefs: function () {
		//enyo.setCookie("notedPrefs", enyo.json.stringify(this.appPrefs));
		enyo.application.appPrefs = this.appPrefs;
	},
	
/* ACCOUNT * ------------------------------------------------------- */
	accountClicked: function (inSender, inEvent) {
		//console.log("Clicked on account!");
		this.$.accountMenu.openAtEvent(inEvent);	
		//this.$.accountMenu.openAtControl(this.$.accountButton);
		
	},
	accountMenuSelected: function (inSender, inEvent) {
		//this.log("Account Menu Selected", inEvent, inSender);

	},
	accountSettings: function (inSender, inEvent) {
		//this.log("Account Settings selected!", inSender, inEvent);
		this.$.login.openAtCenter();
		//this.$.emailInput.forceFocus();
	},
	accountSettingsBeforeOpen: function (inSender, inEvent) {
		//this.log("Hi THere!");
		this.$.loginFail.hide();
		this.$.loginChange.hide();
		this.$.emailInput.setValue(this.appPrefs.email);
		this.$.passInput.setValue("");
	},
	emailChange: function (inSender, inEvent) {
		if (this.appPrefs.email.length && this.appPrefs.email != this.$.emailInput.getValue()) {
			this.$.loginChange.show();
			this.$.loginButton.removeClass("enyo-button-dark");
			this.$.loginButton.addClass("enyo-button-negative");
		}
		else {
			this.$.loginChange.hide();
			this.$.loginButton.addClass("enyo-button-dark");
			this.$.loginButton.removeClass("enyo-button-negative");
		}
	},
	accountLogin: function (inSender, inEvent) {
		this.enteredEmail = this.$.emailInput.getValue();
		this.enteredPass = this.$.passInput.getValue();
		
		if (this.validateEmail(this.enteredEmail)) {
			this.$.loginButton.setActive(true);
			this.$.simplenoteSync.tryLogin(this.enteredEmail, this.enteredPass);
		}
	},
	validateEmail: function (email) {
		if (email.indexOf("+") >= 0) {
			this.$.loginFail.setContent($L("The + symbol in your email address is not allowed by the Simplenote API! Please go to Simplenote and change your login email account."));
			this.$.loginFail.show();
			this.$.loginButton.setActive(false);
			return false;
		}
		
		return true;
			
	},
	checkLogin: function (inSender, inEvent) {
		//this.log("Checking login in NotedHD", inEvent);
		if (inEvent.token) {
			// login successful
			if (this.appPrefs.email && this.enteredEmail != this.appPrefs.email) {
				// FIXME changing user account
				this.deleteExistingAccount();
			}
			this.saveLogin(inSender, inEvent);
		}
		else {
			// login failed
			this.$.loginFail.setContent(inEvent.message);
			this.$.loginFail.show();
		}
		this.$.loginButton.setActive(false);
	},
	saveLogin: function (inSender, inEvent) {
			this.appPrefs.email = this.enteredEmail;
			this.appPrefs.password = Base64.encode('email='+ this.enteredEmail + '&password=' + this.enteredPass); //this.enteredPass;
			this.savePrefs();
			this.$.login.close();
			this.$.accountButton.setCaption(this.appPrefs.email);		
			this.syncNow();
	},
	deleteExistingAccount: function () {
		this.dataSQL.deleteAllNotes(enyo.bind(this, this.getData));
		this.appPrefs.lastSyncLocal = 0;
		this.appPrefs.lastSyncServer = 0;
		this.savePrefs();
	},
	cancelLogin: function (inSender, inEvent) {
		this.$.login.close();
	},
	openSimplenoteWebsite: function() {
		//this.log("Opening Website");
    	this.$.service.call({id: "com.palm.app.browser", params: {target: "http://simple-note.appspot.com"}, onSuccess: "openSimplenoteWebsiteSuccess", onFailure: "openSimplenoteWebsiteFailure"});
	},
	openSimplenoteWebsiteSuccess: function() {
		//this.log("open website success");
	},
	openSimplenoteWebsiteFailure: function() {
		//this.log("open website failure");   
	},

/* SUPPORT *-------------------------------------------------------- */	
	supportInfo: function (inSender, inEvent) {
		this.$.support.openAtCenter();
		
	},
	supportClose: function (inSender, inEvent) {
		this.$.support.close();
	},
	
/* LIST AND NOTES * ------------------------------------------------------- */
	addNoteButtonClicked: function (inSender, inEvent) {
		//this.log();
		this.addNote({note: ""});
	},
	addNote: function (inNote) {
		//this.log(arguments);
		var now = new Date().getTime(), note = {};
		note = {
			value: now,
			key: "0",
			deleted: 0,
			createdate: now,
			modifydate: now,
			content: inNote.note, //this.$.searchField.getValue(),
			version: 0,
			syncnum: 0,
			minversion: 0,
			sharekey: "",
			publishkey: "",
			tags: [],
			systemtags: [],
		};
		//this.log("Add Note:", note);
		this.dataSQL.createNote(note);
		// FIXME  - need to make sure the new note goes in the right place in sortorder!!!
		this.notes.push(note);
		//this.notes.splice(0,0,note);
		var rowIndex = (this.appPrefs.sortorder = "DESC" || (this.appPrefs.sort == "content" && this.appPrefs.sortorder == "ASC")) ? 0 : this.notes.length-1; 
		//this.listClicked(null, { 
		//	rowIndex: 0
		//});
		this.$.noteViewer.setNote(note);
		this.$.noteViewer.setViewType("noteEditScroller");
		//this.$.list.select(inEvent.rowIndex);
		this.selectedNote = note;
		//this.log(this.selectedNote);
		//this.getData();
		this.dataSQL.getNotes(null, "display", null, enyo.bind(this, this.updateList));
		//this.selectedRowIndex = inEvent.rowIndex;
		//this.$.noteEdit.forceFocus();
		this.$.noteCount.setContent(this.notes.length || "0");

	},
	noteSaved: function (inSender, inNote) {
		//this.log (inSender, inNote);
		this.notes[this.selectedRowIndex] = inNote;
		this.$.list.refresh();
		this.dataSQL.getTags("display", enyo.bind(this, this.updateTags));	
	},

	searchNotes: function (inSender, inEvent) {
		//this.log(inEvent);
		//this.log(inSender.value);
		var sqlString = null;
		if (inSender.value) {
			var sqlString = "SELECT n.value, n.content, n.deleted, n.createdate, " +
					"n.modifydate, n.key, " + 
					"n.tags, n.systemtags, n.sharekey, n.publishkey, " + 
					"n.syncnum, n.version, n.minversion," + 
			" CASE WHEN n.systemtags LIKE '%pinned%' THEN 1 ELSE 0 END as pinned" +
			" FROM notes n" +
			" WHERE (content LIKE '%" + this.escapeSQLString(inSender.value) + "%' OR tags like '%" + this.escapeSQLString(inSender.value) + "%')" +
			" AND deleted = 0" + 
			" ORDER BY pinned DESC, "  + 
			this.appPrefs.sort + " " + this.appPrefs.sortorder + ";";

		}
		this.dataSQL.getNotes(sqlString, null, null, enyo.bind(this, this.updateList));
	},
	escapeSQLString: function (inString) {
		return inString.replace(/\\/g, "\\\\").replace(/(%|_)/g, "\\$1")
	},

	searchCancel: function (inSender, inEvent) {
		//this.dataSQL.getNotes(null, null, null, enyo.bind(this, this.updateList));
		this.getData();
	},
	deleteSwiped: function (inSender, inEvent) {
		//this.log(inEvent);
		var note = this.notes[inEvent];
		//this.log ("Deleting", note);
		if (note.key == 0) {
			this.dataSQL.deleteNote(note);
		}
		else {
			note.deleted = 1;
			note.modifydate = new Date().getTime();
			this.dataSQL.updateNote(note);			
		}
		this.notes.splice(inEvent, 1);
		if (this.selectedRowIndex === inEvent) {
			//this.selectedNote = this.notes[this.selectedRowIndex];
			//this.listClicked(null, {rowIndex: inEvent});
		}
		if (this.selectedRowIndex > inEvent) {
			//this.selectedRowIndex -= 1; 
			this.selectedRowIndex = (this.selectedRowIndex ===  0) ? 0 : this.selectedRowIndex - 1;
			//this.selectedNote = this.notes[this.selectedRowIndex]; 
			this.$.list.select(this.selectedRowIndex);
		}
		//this.displayNote(this.notes[this.selectedRowIndex]);
		this.selectedNote = this.notes[this.selectedRowIndex];
		//this.log(this.selectedRowIndex, this.selectedNote);
		this.$.noteViewer.setNote(this.notes[this.selectedRowIndex]);
		this.$.list.refresh();
		this.dataSQL.getTags("display", enyo.bind(this, this.updateTags));		
		this.$.noteCount.setContent(this.notes.length || "0");
		
	},
	deleteClicked: function (inSender, inEvent) {
		this.$.deleteDialog.openAtCenter();
	},
	closeDeleteDialog: function (inSender, inEvent) {
		this.$.deleteDialog.close();
	},
	doDeleteClicked: function (inSender, inEvent) {
		this.$.deleteDialog.close();
		//this.log ("Deleting", this.selectedNote);
		if (this.selectedNote.key == 0) {
			this.dataSQL.deleteNote(this.selectedNote);
		}
		else {
			this.selectedNote.deleted = 1;
			this.selectedNote.modifydate = new Date().getTime();
			this.dataSQL.updateNote(this.selectedNote);			
		}
		this.notes.splice([this.selectedRowIndex], 1);
		this.selectedRowIndex = (this.selectedRowIndex >= this.notes.length  && this.notes.length > 0) ? this.notes.length-1 : this.selectedRowIndex;
		
		//this.log("New Selected Row", this.selectedRowIndex);
		//this.displayNote(this.notes[this.selectedRowIndex]);
		this.selectedNote = this.notes[this.selectedNoteIndex];
		this.$.noteViewer.setNote(this.notes[this.selectedRowIndex]);
		//this.listClicked(null, {rowIndex: this.selectedRowIndex});
		this.$.list.select(this.selectedRowIndex);
		this.$.list.refresh();
		this.dataSQL.getTags("display", enyo.bind(this, this.updateTags));		
		this.$.noteCount.setContent(this.notes.length || "0");
	},
	setupRow: function(inSender, inIndex) {
		if (this.notes[inIndex]) {
		//if (this.notes[inIndex + this.selectedRowIndex]) {
			this.setupDivider(inIndex);
			var lines = this.notes[inIndex].content.split('\n');
			if (!lines[0]) {
				lines[0] = "Empty note";
				// FIXME - color style not working!
				//this.$.notetitle.applyStyle("color", "#555555");
			}
			this.$.pinIcon.setShowing(enyo.indexOf("pinned", this.notes[inIndex].systemtags)!== -1);
			this.$.notetitle.setContent(lines[0]);
			this.$.notedate.setContent(this.setListDateString(this.notes[inIndex].modifydate));
			//this.$.notetitle.applyStyle("enyo-text-ellipsis");
			//this.$.notetitle.applyStyle("width: 100px;")
			this.$.notebody.setContent(lines[1]);
	    	// color the row if it is selected
			this.$.item.applyStyle("background-color", inSender.isSelected(inIndex) ? "#f2f2f2" : null);
				return true;
		}
	},
	setupDivider: function(inIndex) {
		// use group divider at group transition, otherwise use item border for divider
		var year = this.getYearName(inIndex);
		var sorter = this.appPrefs.sort === "content" ? false : true;
		this.$.notesListDivider.setCaption(year);
		this.$.notesListDivider.canGenerate = Boolean(year && sorter);
		//this.$.item.applyStyle("border-top", Boolean(year) ? "none" : "1px solid silver;");
	},
	getYearName: function(inIndex) {
		// get previous record
		var r0 = this.notes[inIndex -1];
		// get (and memoized) year
		if (r0 && !r0.year) {
			r0.year = new Date(r0[this.appPrefs.sort]).getFullYear();
		}
		var a = r0 && r0.year;
		// get record
		var r1 = this.notes[inIndex];
		if (!r1.year) {
			r1.year = new Date(r1[this.appPrefs.sort]).getFullYear();
		}
		var b = r1.year;
		// new group if first letter of last name has changed
		return a != b ? b : null;
	},
	
	updateList: function (inSender, inEvent) {
		//this.log("Notes", inEvent.notes);
		// FIXME - if no notes (first created or have deleted all notes!!!
		if (inEvent.notes) {
			this.notes = inEvent.notes;
			//this.$.list.refresh();
			this.$.list.punt();
			if (this.notes.length) {
				//FIXME modified 12 Jul 2011 - not tested
				this.selectedRowIndex = this.findSelectedNote(); //this.notes[0];
				this.selectedNote = this.notes[this.selectedRowIndex];
				this.$.noteViewer.setNote(this.selectedNote);
				//this.displayNote(this.selectedNote);
				this.$.list.select(this.selectedRowIndex);
			}
			else {
				this.disableNote();
				//this.addNote();			
			}
			
			//this.$.modifiedLabel.addStyles('pointer-events: none;')
		}
		//this.$.dataSpinner.hide();
		this.$.noteCount.setContent(this.notes.length || "0");
	},
	findSelectedNote: function () {
		var i;
		//this.log(this.selectedNote);
		if (this.selectedNote && this.selectedNote.value) {
			for (i = 0; i < this.notes.length; i++) {
				//this.log("Note", i, this.notes[i].value, this.selectedNote.value);
				if (parseInt(this.notes[i].value, 10) == parseInt(this.selectedNote.value, 10)) {
					//this.log("Found note", i, this.notes[i]);
					return i;
				}
			}
		}
		//this.log("Didn't find note");
		return 0;
	},
	setModifyString: function (inDate) {
		return new enyo.g11n.DateFmt({
				date: "medium",
				time: "short"
			}).formatRelativeDate(new Date(inDate), {
					referenceDate: new Date()
		});
	},
	setListDateString: function (inDate) {
		return new enyo.g11n.DateFmt({
				date: "MMM d",
			}).formatRelativeDate(new Date(inDate), {
					referenceDate: new Date()
		});
	},
	updateTags: function (inSender, inEvent) {
		//this.log("Tags in updateTags:", inEvent.tags);	
		var tagsArray = ["All Notes"]; //, tagsObjArray = [];
		tagsArray = tagsArray.concat(inEvent.tags.sort());
/*
		// trying to workaround the truncation in ListSelector - didn't workaround!
		for (i = 0; i < tagsArray.length; i++) {
			tagsObjArray[i] = {caption: tagsArray[i], value: tagsArray[i]};
		}

*/		this.$.tagSelector.setItems(tagsArray);
		//this.log(this.$.tagSelector.getItems());
		//this.tagsArray = tagsArray.slice(1);
		this.$.noteViewer.setTagsArray(tagsArray.slice(1));
		//this.log(tagsArray, this.tagsArray);
	},
	tagChanged: function (inSender, inValue, inOldValue) {
		//this.log("Tag Changed:", inSender, inValue, inOldValue);
		if (inValue == $L("All Notes")) { inValue = ""};
		var sqlString = "SELECT * FROM notes WHERE tags LIKE '%" + inValue + "%' ORDER BY " + this.appPrefs.sort + " " + this.appPrefs.sortorder + ";";
		this.dataSQL.getNotes(sqlString, null, null, enyo.bind(this, this.updateList));
	},
	sortNotes: function (a, b) {
		var sort = this.appPrefs.sort;
		var dir = (this.appPrefs.sortorder === 'DESC') ? -1 : 1;
		if (a.systemtags.length) {
			//Mojo.Log.info("A %j", a);
			return -1;
		}
		if (b.systemtags.length) {
			//Mojo.Log.info("B %j", b);
			return 1;
		}
		if (a[sort] > b[sort]) {
			return dir;
		}
		if (a[sort] < b[sort]) {
			return -dir;
		}
		return 0;
	
	},
	listClicked: function (inSender, inEvent) {
		//this.log("List Clicked", inEvent);
		if (this.notes.length) {
			//this.displayNote(this.notes[inEvent.rowIndex]);
			this.$.noteViewer.setNote(this.notes[inEvent.rowIndex]);
			this.$.list.select(inEvent.rowIndex);
			this.selectedNote = this.notes[inEvent.rowIndex];
			this.selectedRowIndex = inEvent.rowIndex;
			//this.$.modifiedLabel.setContent($L("Modified:") + " " + this.setModifyString(this.notes[inEvent.rowIndex].modifydate));
			//this.log("List selection!", this.$.list.getSelection());
		}
		else {
			this.disableNote();
		}
		this.$.noteViewer.setViewType("noteViewScroller");
		this.$.list.refresh();
	},
	showTagsMenu: function (inSender, inEvent) {
		// prepare menu items:
		var i, menuitems = [];
		if (this.tagsArray.length) {
			for (i = 0; i < this.tagsArray.length; i++) {
				menuitems[i] = {
					caption: this.tagsArray[i],
					value: this.tagsArray[i],
					onclick: "tagSelected"
				};
			}
		}
		else {
			menuitems = [{caption: "No Tags", value: "", onclick: "", disabled: true}];
		}
		this.$.tagsMenu.components = (menuitems);
		this.$.tagsMenu.openAtEvent(inEvent);
	},
	tagSelected: function (inSender, inEvent) {
		//this.log("Tag selected", inSender.caption);
		if (inSender.value) {
			this.selectedNote.tags.push(inSender.value);
			this.displayNote(this.selectedNote);
			this.saveNote();
		}
		this.$.tagsMenu.close();
		//this.$.tagsMenu.destroy();
	},
	showSortMenu: function (inSender, inEvent) {
/*
		var i, menuitems = [
			{caption: "Modified ASC", value: "modifydate ASC", onclick: "changeSort"},
			{caption: "Modified DESC", value: "modifydate DESC", onclick: "changeSort"},
			{caption: "Created ASC", value: "createdate ASC", onclick: "changeSort"},
			{caption: "Created DESC", value: "createdate DESC", onclick: "changeSort"},
			{caption: "Alphabet ASC", value: "content ASC", onclick: "changeSort"},
			{caption: "Alphabet DESC", value: "content DESC", onclick: "changeSort"},
			
		];
		this.createComponent({
			kind: "Menu",
			name: "sortMenu",
			components: menuitems
		})
		this.$.sortMenu.openAtEvent(inEvent);
*/
		this.$.settings.openAtCenter();
	},
	settingsBeforeOpen: function (inSender, inEvent) {
		//this.log("here");
		this.$.sortType.setItems([
			{caption: $L("Modified"), value: "modifydate"},
			{caption: $L("Created"), value: "createdate"},
			{caption: $L("Alphabetical"), value: "content COLLATE NOCASE"}
		]);
		this.$.sortType.setValue(this.appPrefs.sort);
		this.$.sortOrder.setItems([
			{caption: $L("Ascending"), value: "ASC"},
			{caption: $L("Descending"), value: "DESC"}
		]);
		this.$.sortOrder.setValue(this.appPrefs.sortorder);
	},
	saveSettings: function (inSender, inEvent) {
		//this.log(inSender.value);
		this.appPrefs.sort = this.$.sortType.getValue();
		this.appPrefs.sortorder = this.$.sortOrder.getValue();
		this.savePrefs();
		this.$.settings.close();
		this.dataSQL.getNotes(null, null, null, enyo.bind(this, this.updateList));
	},
	cancelSettings: function (inSender, inEvent) {
		this.$.settings.close();
	},
	
	/* HELP PANE * -------------------------------------------------- */
	showHelp: function () {
		this.log();
		this.$.backButton.show();
		this.$.mainPane.selectViewByName("helpPane");
	},
	closeHelp: function () {
		this.$.backButton.hide();
		this.$.mainPane.selectViewByName("mySlidingPane");
	},

	showPrefs: function (inSender) {
		//this.log();
		this.$.backButton.show();
		this.$.mainPane.selectViewByName("prefsPane");
		//this.log();
	},
	closePrefs: function (inSender) {
		this.$.backButton.hide();
	},
	
	
/* SYNC *--------------------------------------------------------- */
	syncNow: function (inSender, inEvent) {
		//this.log ("Sync Now from account menu");
		//this.$.accountButton.setActive(true);
		if (this.appPrefs.email && this.appPrefs.password) {
			this.$.simplenoteSync.beginSync();
			this.$.syncProgressBar.show();
			this.$.syncProgressBar.setPosition(0);
			this.$.syncButton.hide();
			this.$.syncSpinner.show();
			this.$.syncContent.setContent("Sync Log (tap to close) <br />");
		}
		//this.$.syncLog.open();
		//this.startSyncAnimation = enyo.bind(this, this.startSyncAnimation());
		//this.startSyncAnimation();
		
	},
	syncFinished: function (inSender, inEvent) {
		//this.log(" ========================= Sync Finished in NotedHD! ==================================", inSender, inEvent);
/*
			enyo.windows.addBannerMessage(inEvent.message,
				"{}",
				"smallicon"
				//inSoundClass: sound class to play
				//inSoundPath: path to sound to play
				//inSoundDuration: duration of sound to play
			);

*/		if (inEvent.syncFail && inEvent.syncFail.length) {
			// FIXME - do something with the failures
			//this.$.syncContent.setContent(this.$.syncContent + JSON.stringify(inEvent.syncFail));
		}

		this.getData();
		//this.$.accountButton.setActive(false);
		setTimeout(enyo.bind(this, function() {this.$.syncLog.close()}), 5000);		//this.$.syncProgressBar.hide();
		this.$.syncProgressBar.hide();
		this.$.syncSpinner.setShowing(false);
		this.$.syncButton.show();
		//this.$.syncLog.close();
		//this.$.list.refresh();
	},
	updateSyncLog: function (inSender, inEvent) {
		//this.log(inEvent);
		//this.$.syncLog.open();
		//this.$.syncContent.setContent("New Sync Log <br />");
		if (inEvent.message) {
			var newContent = this.$.syncContent.getContent() + inEvent.message + "<br/>";
			//this.log(newContent);
			this.$.syncContent.setContent(newContent);
		}
		if (inEvent.position) {
			//this.position += 10;
				this.$.syncProgressBar.setPosition(inEvent.position);
		}
		//this.$.syncContent.setContent("Newer Sync Log <br />");
		this.$.syncContent.render();
		//this.$.syncLog.render();
	},
	removeSyncLog: function (inSender, inEvent) {
		//this.$.syncContent.setContent("Sync Log (tap to close) <br />");
		this.$.syncLog.close();
	},
	showSyncLog: function (inSender, inEvent) {
		this.$.syncLog.open();
	},
	
	// Launch website
	launchWebsite: function (inSender, inEvent) {
		this.$.palmService.call({target: "http://smallpondapps.com/pondnotes"});
	}
	
});

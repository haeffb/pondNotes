enyo.kind({
	name: "pondAppLaunch",
	kind: "Component",
	syncTime: 60, // interval for sync timer
	
	components: [	
		// Application events handlers
		{kind: "ApplicationEvents", 
			onUnload: "cleanup",
			relaunchHandler: "relaunch",
			onWindowParamsChange: "saveWinParams"},
			
		// Alarms service
		{name: "alarmService", kind: "PalmService",
			service: "palm://com.palm.power/timeout/",
			method: "set",
			onSuccess: "alarmSuccess", onFailure: "alarmFailure"
		},
		// Launch service
		{name: "launchService", kind: "PalmService",
			service: "palm://com.palm.applicationManager", 
			method: "launch",
			params: {
				'id': enyo.fetchAppId(),
				'params': {
					action: 'sync'
				}
			}
			
		},
		
		
		// data storage kind from dataHD.js
		{name: "dataSQL", kind: "storage.SQLite", 
			onInitialized:		"dbInitialized",
			onNotesRetrieved: 	"dbNotesRetrieved", //"dbUpdateList",
			onTagsRetrieved: 	"dbTagsRetrieved, //dbUpdateTags", 
			onAllNotesDeleted: 	"dbAllNotesDeleted",
			onNoteCreated: 		"dbNoteCreated",
			onNoteUpdated: 		"dbNoteUpdated",
			onNoteDeleted: 		"dbNoteDeleted"
		},
					
		// Simplenote Sync kind from sync2apiHD.js	
		{name: "simplenoteSync", kind: "sync", 
			onLogin: 			"syncCheckLogin",
			onSyncLog: 			"syncUpdateSyncLog", 
			onSyncFinished: 	"syncFinished"
		},
	],
	create: function (inSender, inEvent) {
		this.inherited(arguments);
		//enyo.application.appDB = null;		
		this.getPrefs();
		this.$.dataSQL.initialize();
		//this.log(enyo.windows.getWindows());
		//this.setSyncTimer(this.syncTime);

		
	},
	getPrefs: function () {
		enyo.application.appPrefs = {
			email: "",
			password: "",
			lastSyncLocal: 0,
			lastSyncServer: 0,
			sort: "modifydate",
			sortorder: "DESC"
		}
		var cookie = enyo.getCookie("notedPrefs");
		//this.log(cookie);
		if (cookie) {
			enyo.application.appPrefs = enyo.mixin(enyo.application.appPrefs, enyo.json.parse(cookie));
		}	
	},
	savePrefs: function () {
		//this.log("Saving Prefs");
		enyo.setCookie("notedPrefs", enyo.json.stringify(enyo.application.appPrefs));
	},

// DATABASE Events
	dbInitialized: function (inSender, inEvent) {
		//this.log("Database has been initialized!", inEvent.database)
		enyo.application.appDB = this.$.dataSQL;
		enyo.application.appSync = this.$.simplenoteSync;
		var launcher = this;

		//var paramString = window.PalmSystem && PalmSystem.launchParams || "{}";
		//var params = JSON.parse(paramString);
		var params = enyo.windowParams;
		//this.log(params);
		
		launcher.relaunch(params);
		
	},
	dbNotesRetrieved: function (inSender, inEvent) {
		
		//enyo.application.notesWindow.pondNotes.updateList(inSender, inEvent);
		//this.log("appLaunch this", this);
		//this.$.pondNotes.updateList(inSender, inEvent);
		
	},
	dbTagsRetrieved: function (inSender, inEvent) {
		
	},
	dbNoteCreated: function (inSender, inEvent) {
		
	},
	dbNoteUpdated: function (inSender, inEvent) {
		
	},
	dbAllNotesDeleted: function (inSender, inEvent) {
		
	},
	
//SYNC Events - pass to display or ???
	syncFinished: function (inSender, inEvent) {
		window.close();
		
	},
	syncUpdateSyncLog: function (inSender, inEvent) {
		//this.log(inEvent);
		
	},
	syncCheckLogin: function (inSender, inEvent) {
		
	},

// 	
	constructor: function() {
		this.inherited(arguments);
		this.uniqueCardNums = {};
	},
	
	startup: function () {
//		this.$.dataSQL.initialize();
		//this.log("Startup in pondAppLaunch");
		//this.setSyncTimer(this.syncTime);
	},
	
	relaunch: function (params) {
		//this.log("Relaunch in pondAppLaunch", params);
		var notesWindow = enyo.windows.fetchWindow("notes");
		
		if (params.action) {
			switch (params.action) {
				case "addnote":
					this.openCard("notes", params, false);
					break;
				case "sync":
					if (notesWindow) {
						//this.openCard("notes", params, false);
						enyo.windows.setWindowParams(notesWindow, params);
					}
					else {
						this.launchSync(params);
					}
					//this.setSyncTimer(this.syncTime);
					//this.setSyncTimer(1);
					break;
			}
		}
		else {
			this.openCard("notes", params, false);	
		}
	},
	launchSync: function (params) {
		//this.log("Launching Background Sync");
		this.$.simplenoteSync.beginSync();
	},
	
	openCard: function (type, windowParams, forceNewCard) {
		var name, path, basePath, existingWin;
		
		name = type;
		//this.log(arguments);
		basePath = enyo.fetchAppRootPath() + "/";
		var search = typeof location !== undefined ? location.search : "";
		if (type === "notes") {
			path = basePath + "notes/index.html" + search;
		}
/*
		else if (type === "compose") {
			path = basePath + "compose/index.html" + search;
			
			// Use message ID in compose window name so we don't open multiple windows for the same draft.
			if(windowParams.edit && windowParams.edit._id) {
				name = name + "-" + windowParams.edit._id;
				forceNewCard = false;
			}
		} else if (type === "emailviewer") {
			path = basePath + "emailviewer/index.html" + search;

		} 
*/
		else {
			console.error("unknown launch type " + type);
			return; // bail out
		}
		
/*
		if (forceNewCard) {
			// generate a unique name
			if (!this.uniqueCardNums[type]) {
				this.uniqueCardNums[type] = 0;
			}
			
			name = name + "-" + (this.uniqueCardNums[type]++);
		}

*/		
		var window = enyo.windows.activate(path, name, windowParams);
		window.windowLaunchTime = Date.now(); // for profiling
		return window;
		
	},
	cleanup: function () {
		//this.log("Cleanup in appLaunch");
		this.savePrefs();
		//this.inherited(arguments);
	},
	setSyncTimer: function(delayInMinutes) {
		//this.log("Delay: ", delayInMinutes);
		var dashInfo, d, mo, yr, hrs, mins, secs, myDateString, dStr, bannerParams, date;
		
		//For testing purposes ONLY, set delay to 0.5 minutes!
		//delayInMinutes = 0.5;
		
		d = new Date();
		d.setTime(d.getTime() + delayInMinutes * 60 * 1000);
		mo = d.getUTCMonth() + 1;
		mo = (mo < 10) ? '0' + mo : mo;
		date = d.getUTCDate();
		date = (date < 10) ? '0' + date : date;
		yr = d.getUTCFullYear();
		//get hours according to GMT
		hrs = d.getUTCHours();
		hrs = (hrs < 10) ? '0' + hrs : hrs;
		mins = d.getUTCMinutes();
		mins = (mins < 10) ? '0' + mins : mins;
		secs = d.getUTCSeconds();
		secs = (secs < 10) ? '0' + secs : secs;
		myDateString = mo + "/" + date + "/" + yr + " " + hrs + ":" + mins + ":" + secs;
		//this.log("Date String", myDateString);
		
		//dStr = Mojo.Format.formatDate(d, 'medium');
		//this.log("Time is", dStr);
		
		this.$.alarmService.setParams({
				key: enyo.fetchAppId() + '.sync',
				//'in': 	'00:05:00',
				at: myDateString,
				wakeup: true,
				uri: 'palm://com.palm.applicationManager/launch',
				params: {
					'id': enyo.fetchAppId(),
					'params': {
						action: 'sync',
					}
				}
			})
		this.$.alarmService.call();
	},
	alarmSuccess: function (inSender, inEvent) {
		//this.log("Alarm Success");
	},
	alarmFailure: function (inSender, inEvent) {
		//this.log("Alarm failure", inEvent);
	}
	
});

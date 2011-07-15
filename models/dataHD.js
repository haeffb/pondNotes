/* Copyright 2011 Tiger Country Software, L.L.C. All rights reserved. */

enyo.kind ({
	name: "storage.SQLite",
	kind: "Component",
	databaseName: "ext:pondNotesDB",
	displayName: "pondNotes_Database",
	events: {
		onDBCreated: "",
		onTableCreated: "",
		onInitialized: "",
		onNotesRetrieved: "",
		onNoteCreated: "",
		onNoteUpdated: "",
		onNoteDeleted: "",
		onAllNotesDeleted: "",
		onTagsRetrieved: ""
	},
	create: function (inSender) {
		this.inherited(arguments);
	},
	initialize: function (inSender) {
		this.createDB(inSender);
		
	},
	createDB: function (inSender) {
		//this.log("Opening Database!");
		this.db = openDatabase(this.databaseName, "1.0", this.displayName, null);
		//this.doDBCreated();
		this.createTable(inSender);
	},
	createTable: function (inSender) {
		//this.log("Creating Table!");
		var sqlCreateNotesTable = "CREATE TABLE IF NOT EXISTS 'notes' " +
			"(value TEXT PRIMARY KEY, content TEXT, deleted INTEGER, createdate INTEGER, " +
			"modifydate INTEGER, key TEXT, " +
			"syncnum INTEGER, version INTEGER, minversion INTEGER, " + 
			"sharekey TEXT, publishkey TEXT, tags TEXT, systemtags TEXT " +
			");"; 

		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
					//transaction.executeSql('DROP TABLE IF EXISTS notes;', []); 
		            transaction.executeSql(sqlCreateNotesTable, [], enyo.bind(this,this.createTableDataHandler), enyo.bind(this,this.errorHandler)); 
		        }))
		    );
	},
	createTableDataHandler: function (transaction, results) {
		//this.log("Notes Table Created!");
		this.doInitialized({
			database: this.db
		});
		
	},
	createNote: function (inNote, inType, inCallback) {
		//this.log("db Create Note with ", inNote, inType);
		var sqlCreateNote = "INSERT INTO 'notes' " + 
			"(value, content, deleted, createdate, " +
			"modifydate, key, " + 
			"tags, systemtags, sharekey, publishkey, " + 
			"syncnum, version, minversion) " +
			"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sqlCreateNote, 
					[
						// tags and systemtags are arrays of strings. Use stringify() and
						// parse() to store the arrays as strings in SQLite
						inNote.value, inNote.content, inNote.deleted, inNote.createdate,
						inNote.modifydate, inNote.key, enyo.json.stringify(inNote.tags),
						enyo.json.stringify(inNote.systemtags), inNote.sharekey, inNote.publishkey, inNote.syncnum,
						inNote.version, inNote.minversion
					], 
					enyo.bind(this,this.createNoteDataHandler, inType, inCallback), enyo.bind(this,this.errorHandler)); 
		        }))
		    );
	},
	createNotes: function (inNotesArray, inType, inCallback) {
		//this.log("db Create Note with ", inNotesArray, inType);
		var i, inNote, sqlCreateNote = "INSERT INTO 'notes' " + 
			"(value, content, deleted, createdate, " +
			"modifydate, key, " + 
			"tags, systemtags, sharekey, publishkey, " + 
			"syncnum, version, minversion) " +
			"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
					for (i = 0; i < inNotesArray.length; i++) {
						inNote = inNotesArray[i];
						transaction.executeSql(sqlCreateNote, 
							[	
								// tags and systemtags are arrays of strings. Use stringify() and
								// parse() to store the arrays as strings in SQLite
								inNote.value, inNote.content, inNote.deleted, inNote.createdate, 
								inNote.modifydate, inNote.key, enyo.json.stringify(inNote.tags), 
								enyo.json.stringify(inNote.systemtags), inNote.sharekey, 
								inNote.publishkey, inNote.syncnum, inNote.version, 
								inNote.minversion
							], 
							enyo.bind(this, this.createNoteDataHandler, inType, inCallback), 
							enyo.bind(this, this.errorHandler));
					} 
		        }))
		    );
	},
	createNoteDataHandler: function (inType, inCallback, transaction, results) {
		//this.log("Created note:", inType, results, transaction);
		this.doNoteCreated(inType);
		if (inCallback) inCallback(this, inType);
	},
	updateNote: function (inNote, inType, inCallback) {
		//this.log("Update to: ", inNote, inType);
		var sqlUpdateNote = "UPDATE 'notes' SET content=?, deleted=?, " +
			"createdate=?, modifydate=?, key=?, tags=?, systemtags=?, " +
			"sharekey=?, publishkey=?, syncnum=?, version=?, " + 
			"minversion=? WHERE value=?;";
		    this.db.transaction( 
		        enyo.bind(this,(function (transaction) { 
		            transaction.executeSql(sqlUpdateNote, 
					[
						// tags and systemtags are arrays of strings. Use stringify() and
						// parse() to store the arrays as strings in SQLite
						inNote.content, inNote.deleted, inNote.createdate,
						inNote.modifydate, inNote.key, enyo.json.stringify(inNote.tags),
						enyo.json.stringify(inNote.systemtags), inNote.sharekey, inNote.publishkey, inNote.syncnum,
						inNote.version, inNote.minversion, inNote.value
					], 
					enyo.bind(this,this.updateNoteDataHandler, inType, inCallback), enyo.bind(this,this.errorHandler)); 
		        }))
		    );
		
	},
	updateNoteDataHandler: function (inType, inCallback, transaction, results) {
		//this.log("Updated note:", inType, results, transaction);
		this.doNoteUpdated(inType);
		if (inCallback) inCallback(this, inType);
	},
	deleteNote: function (inNote, inType, inCallback) {
		var sqlDeleteNote = "DELETE FROM 'notes' WHERE value=?;";
		//this.log(sqlDeleteNote, inNote.value);
	    this.db.transaction( 
	        enyo.bind(this,(function (transaction) { 
	            transaction.executeSql(sqlDeleteNote, [inNote.value], 
					enyo.bind(this,this.deleteNoteDataHandler, inType, inCallback), 
					enyo.bind(this,this.errorHandler)); 
	        }))
	    );
		
	},
	deleteNoteDataHandler: function (inType, inCallback, transaction, results) {
		//this.log("Note Deleted!", results);
		this.doNoteDeleted({type: inType});
		if (inCallback) inCallback(this, {type: inType});
	},
	deleteNotes: function (inNotesArray, inType, inCallback) {
		var i, sqlDeleteNote = "DELETE FROM 'notes' WHERE value = ?;";
		this.db.transaction(
			enyo.bind(this, function (transaction) {
				for (i = 0; i < inNotesArray.length; i++) {
					transaction.executeSql(sqlDeleteNote, [inNotesArray[i].value],
					enyo.bind(this,this.deleteNoteDataHandler, inType, inCallback), 
					enyo.bind(this,this.errorHandler)); 
				}
			})
		)
	},
	deleteAllNotes: function (inCallback) {
		var sqlDeleteAllNotes = "DELETE FROM 'notes';";
	    this.db.transaction( 
	        enyo.bind(this,(function (transaction) { 
	            transaction.executeSql(sqlDeleteAllNotes, [], 
					enyo.bind(this,this.deleteAllNotesDataHandler, inCallback), 
					enyo.bind(this,this.errorHandler)); 
	        }))
	    );
	},
	deleteAllNotesDataHandler: function (inCallback, transaction, results) {
		//this.log("All Notes Deleted!", results);
		this.doAllNotesDeleted();
		if (inCallback) inCallback(this, {});		
	},
	getNotes: function (inString, inType, inNote, inCallback) {
		var appPrefs = enyo.application.appPrefs;	
		var defaultString = "SELECT n.value, n.content, n.deleted, n.createdate, " +
				"n.modifydate, n.key, " + 
				"n.tags, n.systemtags, n.sharekey, n.publishkey, " + 
				"n.syncnum, n.version, n.minversion," + 
		" CASE WHEN n.systemtags LIKE '%pinned%' THEN 1 ELSE 0 END as pinned" +
		" FROM notes n" +
		" WHERE deleted = 0" + 
		" ORDER BY pinned DESC, "  + appPrefs.sort + " " + appPrefs.sortorder + ";";
		inString = inString ? inString : defaultString;
		//this.log("Getting notes with string:", inString);
		this.db.readTransaction(
			enyo.bind(this, (function (transaction) {
				transaction.executeSql(inString, [],
					enyo.bind(this, this.getNotesDataHandler, inType, inNote, inCallback), enyo.bind(this, this.errorHandler));
			}))
		);
		
	},
	getNotesDataHandler: function (inType, inNote, inCallback, transaction, results) {
		//this.log("Notes from DB", results.rows.length);
		var notes = [], i, aNote;
		if (results.rows) {
			for (i = 0; i < results.rows.length; i++) {
				aNote = results.rows.item(i);
				notes[i] = {};
				//this.log("Result in retrieveNotes db:", aNote);
/*
				for (prop in aNote) {
					//this.log("Property: ", prop, aNote[prop]);
					notes[i][prop] = aNote[prop];
				}

*/				// tags and systemtags are arrays of strings. Use stringify() and
				// parse() to store the arrays as strings in SQLite
				notes[i] = enyo.clone(results.rows.item(i));
				notes[i].tags = enyo.json.parse(notes[i].tags);
				notes[i].systemtags = enyo.json.parse(notes[i].systemtags);
				//this.log("Note is", notes[i]);
			}
		}
		if (inCallback) {
			inCallback(this, {
				notes: notes,
				type: inType,
				originalNote: inNote
			});
		}
		else {
			this.doNotesRetrieved({
				notes: notes,
				type: inType,
				originalNote: inNote
			});
		}
	},
	getTags: function (inType, inCallback) {
		var sqlString = "SELECT DISTINCT tags AS label FROM notes;"; 
		this.db.readTransaction(
			enyo.bind(this, (function (transaction) {
				transaction.executeSql(sqlString, [],
					enyo.bind(this, this.getTagsDataHandler, inCallback), enyo.bind(this, this.errorHandler));
			}))
		);
		
	},
	getTagsDataHandler: function (inCallback, transaction, results) {
		var tags = [], i, aTag;
		if (results.rows) {
			for (i = 0; i < results.rows.length; i++) {
				//this.log("Results", i, results.rows.item(i));
				tags = tags.concat(enyo.json.parse(results.rows.item(i).label));
			}
			// Note: unique added to Array prototype in utils.js
			tags = tags.unique();
			//this.log("Tags is:", tags);
		}
		if (inCallback) inCallback(this, {tags: tags});
		this.doTagsRetrieved({
			tags: tags
		});
		
	},
	errorHandler: function (transaction, error) {
		//this.log("Database error: ", error, transaction);
		
	}
});

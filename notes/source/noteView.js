enyo.kind({
	name: "noteView1",
	kind: "SlidingView",
	flex: 1,
	dismissible: false, dragAnywhere: false,
	published: {
		note: {},
		tagsArray: [],
		viewType: "noteViewScroller"
	},
	events: {
		onNoteSaved: "",
		onDeleteClicked: "",
	},
	components: [
						{kind: "Toolbar", align: "center", className: "enyo-toolbar-light", components: [
							{kind: "ToolInput", flex: 1, align: "center", name: 'tagEdit', alwaysLooksFocused: true,
								oninput: "saveNote", keypressInputDelay: 1000, autoCapitalize: "lowercase",
								hint: $L("Tag this note..."),
								style: "width: 100%;",
								components: [
									{kind: "CustomButton", className: "tag-input", onclick: "showTagsMenu", style: "margin: 2px;"},
								]
							}, 
							{kind: "Spacer"},
							{name: "noteViewEditRadio", kind: "RadioGroup", value: "noteViewScroller",
								onChange: "toggleViewEdit", components: [
								{label: $L("Edit"), value: "noteEditScroller"},
								{label: $L("View"), value: "noteViewScroller"}
							]}
						]},
						{kind: "Pane", flex: 1, name: "noteViewPane", components: [
								
							{name: "noteEditScroller", kind: "Scroller", flex: 1, classname: "note-view", 
									slidingHandler: false, autoHorizontal: false, horizontal: false, autoVertical: true, vertical: true,
									components: [
									{name: "noteEdit", kind: "RichText",  value: "",
										//nodeTag: "pre",
										oninput: "saveNote", onblur: "noteEditBlur", 
										//className: "enyo-input",
										keypressInputDelay: 1000, richContent: true,
										alwaysLooksFocused: true, //height: "100%",
										allowHtml: true, //autoLinking: true,
										 hint: $L("Enter note here...")
									},
								]},
									
							{name: "noteViewScroller", kind: "Scroller", flex: 1, classname: "note-view-scroller", 
									slidingHandler: false, 
									autoHorizontal: false, horizontal: true, 
									autoVertical: true, vertical: true,
									components: [
									{name: "noteView", flex: 1, kind: "HtmlContent", allowHtml: true,
										className: "note-view",
										onmousehold: "toggleEditMode",
										onLinkClick: "noteViewLinkClick",
									}
								]},
						]},
						{kind: "Toolbar", slidingHandler: false, components: [
							{kind: "GrabButton"},
							{kind: "Spacer"},
							{kind: "HtmlContent", name: "modifiedLabel", //width: "250px",
								content: "", 
								style: "color: #bbbbbb; font-size: 15px;",
							},
							{kind: "Image", src: "images/1smallpondlogo.png", height: "30px;", onclick: "launchWebsite"},
							{kind: "Spacer"},
							{icon: "images/icon-stamp.png", onmousehold: "addStampMenu", onclick: "addStamp", value: "both"},
							{icon: "images/icon-mail.png", onclick: "sendNote", value: "email"},
							{icon: "images/icon-info3.png", onclick: "openNoteInfo"},
							{icon: "images/menu-icon-print.png", onclick: "printView"},
							{icon: "images/toolbar-icon-multi-delete.png", onclick: "doDeleteClicked"}
						]},
						
						
		// Print dialog
		{name: "printDialog", kind: "PrintDialog", lazy: false,
			//duplexOption: true,
			//colorOption: true,
			frameToPrint: {name:"noteView", landscape:false},
			appName: enyo.fetchAppInfo.title},		

	
		// Note Info Dialog
		{name: "noteInfo", kind: "pondNotes.noteInfo", 
			onNoteInfoSave: "saveNoteInfo", onNoteInfoCancel: "cancelNoteInfo",
			onBeforeOpen: "noteInfoBeforeOpen"},
				
		{
			kind: "Menu",
			name: "tagsMenu",
			components: []		
		},
		{
			name: "stampMenu", kind: "Menu", components: [
				{caption: "Date", value: "date", onclick: "placeStamp"},
				{caption: "Time", value: "time", onclick: "placeStamp"},
				{caption: "Date and Time", value: "both", onclick: "placeStamp"},
			]
		},		
		{
			kind: "PalmService",
			service: "palm://com.palm.applicationManager/",
			method: "open"
   		},
	
	],
	create: function() {
		this.inherited(arguments);
		this.dataSQL = enyo.application.appDB;		
	},
	ready: function () {
		//this.log();
		this.inherited(arguments);
		this.$.noteViewPane.selectViewByName("noteViewScroller");
	},
	noteChanged: function (inSender, inNote) {
		//this.log(this.note);
		this.displayNote(this.note);
	},
	tagsArrayChanged: function (inSender, inTagsArray) {
		
	},
	viewTypeChanged: function (inSender) {
		//this.log(inSender);
		this.$.noteViewEditRadio.setValue(this.viewType);
		this.toggleViewEdit({
			value: this.viewType
		});
	},
	toggleEditMode: function (inSender) {
		this.viewType = "noteEditScroller";
		this.$.noteViewEditRadio.setValue(this.viewType);
		this.toggleViewEdit({
			value: this.viewType
		});
		
	},
	displayNote: function (note) {
		//this.log(note);
		var i, lines, content = "";
		
		if (note) {
		
			// hack to overcome bug in RichText control
			// also see this.saveNote() and this.placeStamp();

			lines = note.content.split("\n");
			for (i = 0; i < lines.length; i++) {
				lines[i] = (lines[i].length > 0) ? lines[i] : "<br>";
				lines[i] = lines[i].replace(/ /g, "&nbsp;");
				if (i > 0) 
					lines[i] = "<div>" + lines[i] + "</div>";
				content += lines[i];
			}

			//this.log(content);
			//content = note.content;
			
			this.$.noteEdit.setValue(content.replace(/\n/g, "<br>"));
			this.$.tagEdit.setValue(note.tags.join(" "))
			//this.$.modifiedLabel.setContent($L("Modified:") + " " + this.setModifyString(note.modifydate));
			this.$.noteEdit.setDisabled(false);
			this.$.tagEdit.setDisabled(false);
			//this.$.noteEdit.setHint($L("Enter note here..."))
			
			//this.log("List selection!", this.$.list.getSelection());
			//this.$.noteView.setContent(enyo.string.runTextIndexer(content));
			var viewContent = "";
			if (enyo.indexOf("markdown", note.systemtags) !== -1) {
				var converter = new Showdown.converter();
				viewContent = converter.makeHtml(note.content);
			}
			else {
				lines = note.content.split("\n");
				//this.log (note);
				//this.log(lines);
				for (i = 0; i < lines.length; i++) {
					lines[i] = (lines[i].length > 0) ? lines[i] : "<br>";
					lines[i] = lines[i].replace(/ /g, "&nbsp;");
					if (i > 0) {
						lines[i] = "<div>" + lines[i] + "</div>";
					}
					lines[i] = enyo.string.runTextIndexer(lines[i]);
					viewContent += lines[i];
				}
			}
			//this.log(viewContent);
			this.$.noteView.setContent(viewContent);
			
		}
		else {
			this.disableNote();
		}
	},
	disableNote: function () {
			this.$.noteEdit.setDisabled(true);
			this.$.tagEdit.setDisabled(true);
			this.$.tagEdit.setValue("");
			this.$.noteEdit.setValue("");
			this.$.noteView.setContent("");
			this.$.noteEdit.setHint($L("Tap plus icon to enter a new note..."))
			//this.$.modifiedLabel.setContent($L("Modified:"));
			//this.$.noteCount.setContent("0");
	},
	saveNote: function () {
		var note = this.note;
		note.content = this.$.noteEdit.getValue()
		
		//this.log(this.$.noteEdit.getText().toString());
		//this.log(this.$.noteEdit.getHtml());
		
		// hack to overcome bug in RichText (note: set richContent: false if fixed!
		// also see this.displayNote() and this.placeStamp();
		//this.log(note.content);
		note.content = note.content.replace(/<\/div>/g, "");
		note.content = note.content.replace(/<div><br>/g, "\n")
		note.content = note.content.replace(/<br>/g, "\n");
		note.content = note.content.replace(/<div>/g, "\n");
		note.content = note.content.replace(/&nbsp;/g, " ");
		//this.log(note.content);
		//
		
		note.tags = this.$.tagEdit.getValue().length ? this.$.tagEdit.getValue().split(" "): [];
		note.modifydate = new Date().getTime();
		//this.log("Save Note: ", note);
		this.dataSQL.updateNote(note, "plain", null);
		this.note = note;
		this.doNoteSaved(this.note);	
	},
	launchWebsite: function (inSender, inEvent) {
		this.$.palmService.call({
			target: "http://smallpondapps.com"
		});
	},
	
	noteViewLinkClick: function (inSender, inEvent) {
		//this.log(inSender, inEvent);
		//inEvent = inEvent || "http://smallpondapps.com";
		//var r = new enyo.PalmService();
		 // r.service = "palm://com.palm.applicationManager/";
		  //r.method = "open";
		  this.$.palmService.call({target: inEvent});		
	},
	
	toggleViewEdit: function (inSender, inEvent) {
		//this.log (inSender.value);
		//this.log("Edit", this.$.noteEdit.getShowing());
		//this.$.noteEdit.setShowing(!this.$.noteEdit.getShowing());
		//this.$.noteView.setShowing(!this.$.noteView.getShowing());
		this.$.noteViewPane.selectViewByName(inSender.value);
		this.displayNote(this.note);
	},
	
	noteInfoBeforeOpen: function (inSender, inEvent) {
		//this.$.noteInfo.markdownCheckbox.setChecked(enyo.indexOf("markdown", this.note.systemtags) == -1 ? false : true);
		//this.$.noteInfo.pinnedCheckbox.setChecked(enyo.indexOf("pinned", this.note.systemtags) == -1 ? false : true);
		var markdown = (enyo.indexOf("markdown", this.note.systemtags) == -1 ? false : true);
		var pinned = (enyo.indexOf("pinned", this.note.systemtags) == -1 ? false : true);
		this.$.noteInfo.setChecked(this, {markdown: markdown, pinned: pinned});
		//this.log();
	},
	openNoteInfo: function (inSender, inEvent) {
		this.$.noteInfo.openAtCenter();
		this.$.noteInfo.setMarkdown(enyo.indexOf("markdown", this.note.systemtags) == -1 ? false : true);
		this.$.noteInfo.setPinned(enyo.indexOf("pinned", this.note.systemtags) == -1 ? false : true);
	},
	saveNoteInfo: function (inSender, inEvent) {
		//this.log(inEvent);
		//this.log(this.note.systemtags);
		var markdownIndex = enyo.indexOf("markdown", this.note.systemtags);
		var pinnedIndex = enyo.indexOf("pinned",this.note.systemtags);
		//this.log(markdownIndex, pinnedIndex);
		if (inEvent.markdown) {
			if (markdownIndex == -1) {
				this.note.systemtags.push("markdown");
			}
		}
		else {
			if (markdownIndex !== -1) {
				this.note.systemtags.splice(markdownIndex, 1);
			}
		}
		if (inEvent.pinned) {
			if (pinnedIndex == -1) {
				this.note.systemtags.push("pinned");
			}
		}
		else {
			if (pinnedIndex !== -1) {
				this.note.systemtags.splice(pinnedIndex, 1);
			}
		}
		//this.log(this.note.systemtags);
		this.saveNote();
	},
	setModifyString: function (inDate) {
		return new enyo.g11n.DateFmt({
				date: "medium",
				time: "short"
			}).formatRelativeDate(new Date(inDate), {
					referenceDate: new Date()
		});
	},
/* SEND NOTE *--------------------------------------------------------- */	
	sendNote: function (inSender, inEvent) {
		//this.log("Sending Note");	
		//inSender.value = "email-cmd";
		switch (inSender.value) {
			case 'email':
				this.sendByEmail(this.note);
				break;
			case 'sms':
				this.sendBySMS(this.note);
				break;
		}
	},
	
	sendByEmail: function (note) {
		var text =  note.content; 
		text = enyo.string.runTextIndexer(note.content.replace(/\n/g, "<br />"));
	
		 this.$.palmService.call({
			id: 'com.palm.app.email',
				params: {
					summary: $L("Email from pondNotes"),
					text: text
				}
		});
	},
	
	sendBySMS: function (note) {
		var text = note.content;
		this.$.palmService.call({
			id: 'com.palm.app.messaging',
			params: {
				//composeAddress: '4085555555',
				messageText: text
			}
		});
	},

/* DATE TIME STAMP *--------------------------------------------------------- */	
	addStampMenu: function (inSender, inEvent) {
		//this.log("Stamp Menu");
		this.showStampMenu = true;
		this.$.stampMenu.openAtEvent(inEvent);
	},

	addStamp: function (inSender, inEvent) {
		if (this.showStampMenu) {
			//this.log("Showing Stamp Menu");
			this.showStampMenu = false;
		}
		else {
			this.placeStamp(inSender, inEvent);
		}
	},
	noteEditBlur: function (inSender, inEvent) {
		//this.log(inSender, inEvent);
			//var pos = this.$.noteEdit.getSelection();
			//this.log("Get position", pos);
	},
	placeStamp: function (inSender,inEvent) {
		//this.log(inSender, inEvent);
			this.toggleEditMode();
			var textField, pos, start, end, stamp, note;
			type = inSender.value ? inSender.value : 'both';
			textField = this.$.noteEdit;
			note = (textField.getValue()) ? textField.getValue() : "";
			pos = this.$.noteEdit.getSelection();
			//this.log("Get position", pos);
			//Mojo.Log.info("Position: %j", pos);
			switch (type) {
				case 'time':
					stamp = new enyo.g11n.DateFmt({
						time: "short"
					}).format(new Date());
					break;
				case 'date':
					stamp = new enyo.g11n.DateFmt({
						date: "medium"
					}).format(new Date());
					break;
				case 'both':
					stamp = new enyo.g11n.DateFmt({
						date: "medium",
						time: "short"
					}).format(new Date());
					break;
			}
			//this.log("Stamp", stamp);
			
			// hack to overcome bug in RichText control
			// also see this.saveNote() and this.displayNote();
			//stamp = "\n" + stamp;
			stamp = "<br />" + stamp;
			//Mojo.Log.info ("note length", note.length);
			pos = {
				start: note.length,
				end: note.length
			}
			start = "";
			end = "";
			if (note) {
				start = note.substring(0, pos.start);
				end = note.substring(pos.end, note.length);
			}
			//Mojo.Log.info("Note:", start, "+",  stamp, "+", end);
			this.$.noteEdit.setValue(start + " " + stamp + " " + end);
			if (pos) {
			//textField.mojo.setCursorPosition(pos.selectionStart + stamp.length, pos.selectionStart + stamp.length);
			}
			
			// need to save note!		
			this.saveNote();
	},
	printView: function (inSender, inEvent) {
		//this.log()
		this.$.printDialog.openAtCenter();
	}
		
});

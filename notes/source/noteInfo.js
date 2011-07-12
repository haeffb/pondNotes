enyo.kind({
	name: "pondNotes.noteInfo",
	kind: "ModalDialog",
	caption: $L("Note Info"),
	events: {
		onNoteInfoCancel: "",
		onNoteInfoSave: ""
	},
	published: {
		markdown: true,
		pinned: true,
	},
	components: [
		{kind: "RowGroup", caption: $L("Note Settings"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{name: "markdownCheckbox", kind: "CheckBox", style: "margin-right: 10px"},
				{content: $L("Markdown Formatted")}
			]},
			{kind: "HFlexBox", align: "center", components: [
				{name: "pinnedCheckbox", kind: "CheckBox", style: "margin-right: 10px"},
				{content: $L("Pinned")}
			]},
		]},
			{kind: "HFlexBox", components: [  
	    		{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "cancel"},
		    	{kind: "ActivityButton", name: "saveButton", caption: $L("Save"), flex: 1, onclick: "save", className: "enyo-button-affirmative"},
			]}
	],	
	componentsReady: function (inSender, inEvent) {
		this.inherited(arguments);
		this.log(this.markdown, this.pinned);
		//this.$.markdownCheckbox.setChecked(this.markdown);
		//this.$.pinnedCheckbox.setChecked(this.pinned);		
	},
	setChecked: function (inSender, inEvent) {
		this.$.markdownCheckbox.setChecked(inEvent.markdown);
		this.$.pinnedCheckbox.setChecked(inEvent.pinned);		
		
	},
	cancel: function (inSender, inEvent) {
		this.close();
	},
	save: function (inSender, inEvent) {
		this.doNoteInfoSave({
			markdown: this.$.markdownCheckbox.getChecked(),
			pinned: this.$.pinnedCheckbox.getChecked()
		});
		this.close();
	}
});

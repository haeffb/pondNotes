enyo.kind({
	name: "Preferences",
	kind: "VFlexBox",
	components: [
		{kind: "Header", caption: "Preferences"},
		{kind: "Scroller", flex: 1, autoHorizontal: false, horizontal: false, components: [
					{kind: "RowGroup", caption: $L("Sort"), components: [
						{kind: "ListSelector", name: "sortType"},
						{kind: "ListSelector", name: "sortOrder"}
					]},
					{layoutKind: "HFlexLayout", components: [
						{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "cancelSettings"},
						{kind: "Button", caption: $L("Done"), flex: 1, onclick: "saveSettings", className: "enyo-button-affirmative"}
					]}
				]
		}
	],
	create: function (inSender) {
		//this.log();
	}
})		
enyo.kind({
	name: "Help",
	kind: "VFlexBox",
	components: [
		{name: "loadHtml", kind: "WebService", onSuccess: "gotContent"},
		{kind: "Scroller", flex: 1, autoHorizontal: false, horizontal: false, components: [
			{name: "helpContents", kind: "HtmlContent", className: "help-base", flex: 1}
		]}
		
	],
	
	ready: function (inSender) {
		this.inherited(arguments);
		var file = enyo.fetchAppRootPath() + $L("/resources/en/") + "helpcontent.html";
		this.$.loadHtml.setUrl(file);
		this.$.loadHtml.call()
	},
	gotContent: function (inSender, inEvent) {
		this.log(inEvent);
		this.$.helpContents.setContent(inEvent);
		this.render();
		this.log();
	}
});

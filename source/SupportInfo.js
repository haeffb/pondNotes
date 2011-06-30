enyo.kind({
   name: "generic.AppInfo",
   kind: "Control",
   components: [
   		{kind: "HFlexBox", components: [
			{name: "appInfoHeaderIconImage", kind: "Image"},
			{kind: "VFlexBox", flex: 1, components: [
				{kind: "HtmlContent", name: "appInfoBodyTitle", className: ""},
				{kind: "HtmlContent", name: "appInfoBodySubtitle", className: "enyo-item-secondary"}
			]}
		]},
         {name: "appInfoRowGroupSupport", kind: "RowGroup", caption: $L("SUPPORT"), components: [
            {kind: "HFlexBox", onclick: "openWebsite", pack: "justify", align: "center", components: [
                 {name: "appInfoWebsiteImage", kind: "Image", src: "images/application-web.png"},
                 {content: $L("Visit Support Website"), flex: 1, style: "padding: 5px;"},
              ]},
             {kind: "HFlexBox", onclick: "openEmail", pack: "justify", align: "center", components: [
                 {name: "appInfoEmailImage", kind: "Image", src: "images/application-email.png"},
                 {content: $L("Send Support Email"), flex: 1, style: "padding: 10px;"},
             ]}
         ]},
         {kind: "HtmlContent", className: "enyo-subtext", 
		 		style: "text-align: center;", components:[
            {name: "appInfoCopyrightText", allowHtml: true}
         ]},
        {name: "appInfoCloseButton", kind: "Button", caption: $L("Close"), onclick: "closeClick", className: "enyo-button-dark"},
		{name: "service", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"}
    
	],
   published: {
   },
   events: {
      onClose: "",
   },
   create: function() {
      this.inherited(arguments);
      this.appInfo = enyo.fetchAppInfo();
      
      this.$.appInfoHeaderIconImage.setSrc(this.appInfo.smallicon);
      
      this.$.appInfoBodyTitle.setContent(this.appInfo.title);
      this.$.appInfoBodySubtitle.setContent(this.appInfo.version + " by " + this.appInfo.vendor);
      
      this.$.appInfoCopyrightText.setContent(this.appInfo.copyright);
   },
   closeClick: function() {
      this.doClose();
   },
   openWebsite: function() {
		this.log("Opening Website");
      this.$.service.call({id: "com.palm.app.browser", params: {target: this.appInfo.support.url}, onSuccess: "openWebsiteSuccess", onFailure: "openWebsiteFailure"});
   },
   openWebsiteSuccess: function() {
      console.log("open website success");
   },
   openWebsiteFailure: function() {
      console.log("open website failure");   
   },
   openEmail: function() {
   		this.log("Opening Email");
      this.$.service.call({id: "com.palm.app.email", params: {summary: this.appInfo.support.email.subject + " " + this.appInfo.version, address: this.appInfo.support.address}, onSuccess: "openEmailSuccess", onFailure: "openEmailFailure"});
   },
   openEmailSuccess: function() {
      console.log("open email success");
   },
   openEmailFailure: function() {
      console.log("open email failure");   
   }
});
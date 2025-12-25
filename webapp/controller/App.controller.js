sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("eformanager.controller.App", {
        
        onInit: function () {
            // Router'ı başlat
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.initialize();
            
            // Content density class uygula
            var oView = this.getView();
            var oComponent = this.getOwnerComponent();
            
            if (oComponent && oComponent.getContentDensityClass) {
                oView.addStyleClass(oComponent.getContentDensityClass());
            } else {
                // Fallback: compact mode
                oView.addStyleClass("sapUiSizeCompact");
            }
        }
    });
});
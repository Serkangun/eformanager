sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("eformanager.controller.Home", {

        onInit: function () {
            // Counter model
            var oCounterModel = new JSONModel({
                activeCount: 0,
                completedCount: 0,
                cancelledCount: 0
            });
            this.getView().setModel(oCounterModel, "counter");
            
            // Load counts
            this._loadCounts();
        },

        _loadCounts: function () {
            var oModel = this.getView().getModel();
            
            if (!oModel) {
                console.log("OData model yok");
                return;
            }

            // Aktif eforları say
            oModel.read("/EforSet", {
                filters: [
                    new Filter("Durum", FilterOperator.EQ, "Aktif")
                ],
                success: function (oData) {
                    var iCount = oData.results ? oData.results.length : 0;
                    this.getView().getModel("counter").setProperty("/activeCount", iCount);
                }.bind(this),
                error: function () {
                    console.log("Aktif efor count yüklenemedi");
                }
            });

            // Tamamlanan eforları say
            oModel.read("/EforSet", {
                filters: [
                    new Filter("Durum", FilterOperator.EQ, "Tamamlandı")
                ],
                success: function (oData) {
                    var iCount = oData.results ? oData.results.length : 0;
                    this.getView().getModel("counter").setProperty("/completedCount", iCount);
                }.bind(this),
                error: function () {
                    console.log("Tamamlanan efor count yüklenemedi");
                }
            });
        },

        onNavToEforListe: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("eforList");
        },

        onPersonelPress: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("personel");
        },

        onMusteriPress: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("musteri");
        },

        onNavToAktifEforlar: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("eforList");
            MessageToast.show("Aktif eforlar filtreleniyor...");
        },

        onNavToTamamlananEforlar: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("eforList");
            MessageToast.show("Tamamlanan eforlar filtreleniyor...");
        },

        onNavToRaporlar: function () {
            MessageToast.show("Raporlar modülü yakında eklenecek");
        }
    });
});
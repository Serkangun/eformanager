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
                completedCount: 0
            });
            this.getView().setModel(oCounterModel, "counter");
            
            // Click eventlerini bağla
            this._attachClickEvents();
            
            // Load counts
            this._loadCounts();
        },

        _attachClickEvents: function () {
            // VBox'lara click eventi ekle
            var that = this;
            
            setTimeout(function() {
                var oEforCard = that.byId("eforCard");
                var oGecmisCard = that.byId("gecmisEforCard");
                var oPersonelCard = that.byId("personelCard");
                var oMusteriCard = that.byId("musteriCard");
                
                if (oEforCard) {
                    oEforCard.attachBrowserEvent("click", function() {
                        that.onNavToEforListe();
                    });
                }
                
                if (oGecmisCard) {
                    oGecmisCard.attachBrowserEvent("click", function() {
                        that.onNavToGecmisEforlar();
                    });
                }
                
                if (oPersonelCard) {
                    oPersonelCard.attachBrowserEvent("click", function() {
                        that.onPersonelPress();
                    });
                }
                
                if (oMusteriCard) {
                    oMusteriCard.attachBrowserEvent("click", function() {
                        that.onMusteriPress();
                    });
                }
            }, 100);
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
                    this.getView().getModel("counter").setProperty("/activeCount", 0);
                }.bind(this)
            });

            // Geçmiş eforları say
            oModel.read("/EforSet", {
                filters: [
                    new Filter({
                        filters: [
                            new Filter("Durum", FilterOperator.EQ, "Geçmiş"),
                            new Filter("Durum", FilterOperator.EQ, "Tamamlandı")
                        ],
                        and: false
                    })
                ],
                success: function (oData) {
                    var iCount = oData.results ? oData.results.length : 0;
                    this.getView().getModel("counter").setProperty("/completedCount", iCount);
                }.bind(this),
                error: function () {
                    console.log("Geçmiş efor count yüklenemedi");
                    this.getView().getModel("counter").setProperty("/completedCount", 0);
                }.bind(this)
            });
        },

        onNavToEforListe: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("eforList");
        },

        onGecmisAylarPress: function() {
    this.getOwnerComponent().getRouter().navTo("gecmisaylar");
},

        onPersonelPress: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("personel");
        },

        onMusteriPress: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("musteri");
        }
    });
});
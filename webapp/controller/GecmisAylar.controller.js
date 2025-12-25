sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("eformanager.controller.GecmisAylar", {

        onInit: function () {
            // View model
            var oViewModel = new JSONModel({
                gecmisAylar: []
            });
            this.getView().setModel(oViewModel, "view");
            
            // Router pattern matched
            this.getOwnerComponent().getRouter().getRoute("gecmisaylar").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function () {
            this._loadGecmisAylar();
        },

        _loadGecmisAylar: function () {
            var oModel = this.getView().getModel();
            
            // OData'dan tüm eforları çek
            oModel.read("/EforSet", {
                success: function (oData) {
                    var aEforlar = oData.results;
                    this._groupByMonth(aEforlar);
                }.bind(this),
                error: function () {
                    MessageToast.show("Veriler yüklenemedi");
                }
            });
        },

        _groupByMonth: function (aEforlar) {
            // Bugünkü ay
            var oToday = new Date();
            var sBuAy = oToday.getFullYear().toString() + (oToday.getMonth() + 1).toString().padStart(2, '0');
            
            // Ayları grupla
            var oAylarMap = {};
            
            aEforlar.forEach(function (oEfor) {
                if (!oEfor.Tarih || oEfor.Tarih.length !== 8) return;
                
                var sYil = oEfor.Tarih.substring(0, 4);
                var sAy = oEfor.Tarih.substring(4, 6);
                var sAyKodu = sYil + sAy;
                
                // Sadece geçmiş ayları al
                if (sAyKodu < sBuAy) {
                    if (!oAylarMap[sAyKodu]) {
                        oAylarMap[sAyKodu] = {
                            ayKodu: sAyKodu,
                            ayAdi: this._formatAyAdi(sYil, sAy),
                            toplamEfor: 0,
                            eforSayisi: 0
                        };
                    }
                    
                    var fEfor = parseFloat(oEfor.EforGun) || 0;
                    oAylarMap[sAyKodu].toplamEfor += fEfor;
                    oAylarMap[sAyKodu].eforSayisi += 1;
                }
            }.bind(this));
            
            // Map'i array'e çevir ve sırala (en yeni ay üstte)
            var aGecmisAylar = Object.values(oAylarMap).sort(function (a, b) {
                return b.ayKodu.localeCompare(a.ayKodu);
            });
            
            // Toplam eforları yuvarla
            aGecmisAylar.forEach(function (oAy) {
                oAy.toplamEfor = Math.round(oAy.toplamEfor * 100) / 100;
            });
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/gecmisAylar", aGecmisAylar);
        },

        _formatAyAdi: function (sYil, sAy) {
            var aAylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            var iAy = parseInt(sAy) - 1;
            return aAylar[iAy] + " " + sYil;
        },

        onAyPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("view");
            var sAyKodu = oContext.getProperty("ayKodu");
            
            // Seçilen aya ait eforları göster
            this.getOwnerComponent().getRouter().navTo("aydetay", {
                ay: sAyKodu
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        }
    });
});
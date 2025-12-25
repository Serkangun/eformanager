sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"
], function (Controller, JSONModel, MessageToast, Spreadsheet) {
    "use strict";

    return Controller.extend("eformanager.controller.AyDetay", {

        onInit: function () {
            var oViewModel = new JSONModel({
                ayBaslik: "",
                eforlar: [],
                totalCount: 0,
                totalEfor: 0
            });
            this.getView().setModel(oViewModel, "view");
            
            this.getOwnerComponent().getRouter().getRoute("aydetay").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function (oEvent) {
            var sAy = oEvent.getParameter("arguments").ay;
            this._sCurrentAy = sAy;
            this._loadAyEforlari(sAy);
        },

        _loadAyEforlari: function (sAy) {
            var oModel = this.getView().getModel();
            
            // OData'dan tüm eforları çek
            oModel.read("/EforSet", {
                success: function (oData) {
                    var aEforlar = oData.results;
                    this._filterByMonth(aEforlar, sAy);
                }.bind(this),
                error: function () {
                    MessageToast.show("Veriler yüklenemedi");
                }
            });
        },

        _filterByMonth: function (aEforlar, sAy) {
            // Bu aya ait eforları filtrele
            var aAyEforlari = aEforlar.filter(function (oEfor) {
                if (!oEfor.Tarih || oEfor.Tarih.length !== 8) return false;
                var sEforAy = oEfor.Tarih.substring(0, 6);
                return sEforAy === sAy;
            });
            
            // Toplam hesapla
            var fTotalEfor = 0;
            aAyEforlari.forEach(function (oEfor) {
                fTotalEfor += parseFloat(oEfor.EforGun) || 0;
            });
            fTotalEfor = Math.round(fTotalEfor * 100) / 100;
            
            // Ay başlığını formatla
            var sYil = sAy.substring(0, 4);
            var sAyNo = sAy.substring(4, 6);
            var sAyBaslik = this._formatAyAdi(sYil, sAyNo) + " Eforları";
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/ayBaslik", sAyBaslik);
            oViewModel.setProperty("/eforlar", aAyEforlari);
            oViewModel.setProperty("/totalCount", aAyEforlari.length);
            oViewModel.setProperty("/totalEfor", fTotalEfor);
        },

        _formatAyAdi: function (sYil, sAy) {
            var aAylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            var iAy = parseInt(sAy) - 1;
            return aAylar[iAy] + " " + sYil;
        },

        formatDate: function (sDate) {
            if (!sDate || sDate.length !== 8) return "";
            return sDate.substring(6, 8) + "." + sDate.substring(4, 6) + "." + sDate.substring(0, 4);
        },

        formatEforGun: function (sEfor) {
            if (!sEfor) return "0";
            return parseFloat(sEfor).toString();
        },

        _getFormattedDateTime: function () {
            var oDate = new Date();
            var sYear = oDate.getFullYear();
            var sMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
            var sDay = oDate.getDate().toString().padStart(2, '0');
            var sHour = oDate.getHours().toString().padStart(2, '0');
            var sMin = oDate.getMinutes().toString().padStart(2, '0');
            return sYear + sMonth + sDay + "_" + sHour + sMin;
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("gecmisaylar");
        },

        onExportToExcel: function () {
            var oViewModel = this.getView().getModel("view");
            var aEforlar = oViewModel.getProperty("/eforlar");
            
            if (aEforlar.length === 0) {
                MessageToast.show("Dışa aktarılacak veri yok!");
                return;
            }

            var aExcelData = [];
            
            aEforlar.forEach(function (oData) {
                aExcelData.push({
                    "Tarih": this.formatDate(oData.Tarih),
                    "İş İsteyen": oData.IsIsteyen,
                    "Not Bilgisi": oData.NotBilgisi || "",
                    "Efor (Gün)": this.formatEforGun(oData.EforGun),
                    "İşin Sahibi": oData.IsinSahibi,
                    "Durum": oData.Durum,
                    "Teslim Tarihi": this.formatDate(oData.IsTeslimTarihi)
                });
            }.bind(this));

            var oSettings = {
                workbook: {
                    columns: [
                        { label: "Tarih", property: "Tarih", type: "string", width: 15 },
                        { label: "İş İsteyen", property: "İş İsteyen", type: "string", width: 20 },
                        { label: "Not Bilgisi", property: "Not Bilgisi", type: "string", width: 50, wrap: true },
                        { label: "Efor (Gün)", property: "Efor (Gün)", type: "number", width: 12 },
                        { label: "İşin Sahibi", property: "İşin Sahibi", type: "string", width: 20 },
                        { label: "Durum", property: "Durum", type: "string", width: 15 },
                        { label: "Teslim Tarihi", property: "Teslim Tarihi", type: "string", width: 15 }
                    ],
                    context: {
                        sheetName: oViewModel.getProperty("/ayBaslik"),
                        metainfo: { author: "Efor Yönetim Sistemi", created: new Date() }
                    }
                },
                dataSource: aExcelData,
                fileName: "Gecmis_Ay_Eforlar_" + this._getFormattedDateTime() + ".xlsx",
                worker: false
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
                MessageToast.show(aExcelData.length + " kayıt Excel'e aktarıldı");
            });
        }
    });
});
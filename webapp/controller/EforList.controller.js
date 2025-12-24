sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet"
], function (Controller, JSONModel, MessageBox, MessageToast, Fragment, Spreadsheet) {
    "use strict";

    return Controller.extend("eformanager.controller.EforList", {

        onInit: function () {
            // View model
            var oViewModel = new JSONModel({
                totalCount: 0,
                totalEfor: 0
            });
            this.getView().setModel(oViewModel, "view");
            
            // Create model
            var oCreateModel = new JSONModel({
                Tarih: new Date().toISOString().split('T')[0],
                IsIsteyen: "",
                NotBilgisi: "",
                EforGun: "",
                IsTeslimTarihi: "",
                IsinSahibi: "",
                Durum: "Aktif"
            });
            this.getView().setModel(oCreateModel, "create");
            
            // Edit model
            var oEditModel = new JSONModel({});
            this.getView().setModel(oEditModel, "edit");
            
            // Tablo data yüklendiğinde özet hesapla
            var that = this;
            setTimeout(function() {
                var oTable = that.byId("eforTable");
                var oBinding = oTable.getBinding("items");
                
                if (oBinding) {
                    oBinding.attachDataReceived(function() {
                        setTimeout(function() {
                            that._updateSummary();
                        }, 200);
                    });
                    oBinding.attachChange(function() {
                        setTimeout(function() {
                            that._updateSummary();
                        }, 200);
                    });
                }
            }, 1000);
        },

        _updateSummary: function() {
            var oTable = this.byId("eforTable");
            var aItems = oTable.getItems();
            var iTotalCount = aItems.length;
            var fTotalEfor = 0;
            
            aItems.forEach(function(oItem) {
                var oContext = oItem.getBindingContext();
                if (oContext) {
                    var oData = oContext.getObject();
                    var fEfor = parseFloat(oData.EforGun) || 0;
                    fTotalEfor += fEfor;
                }
            });
            
            fTotalEfor = Math.round(fTotalEfor * 100) / 100;
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/totalCount", iTotalCount);
            oViewModel.setProperty("/totalEfor", fTotalEfor);
        },

        formatDate: function(sDate) {
            if (!sDate || sDate.length !== 8) return "";
            return sDate.substring(6,8) + "." + sDate.substring(4,6) + "." + sDate.substring(0,4);
        },

        formatEforGun: function(sEfor) {
            if (!sEfor) return "0";
            return parseFloat(sEfor).toString();
        },

        _formatDateToOData: function(oDate) {
            if (!oDate) return "";
            var sYear = oDate.getFullYear().toString();
            var sMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
            var sDay = oDate.getDate().toString().padStart(2, '0');
            return sYear + sMonth + sDay;
        },

        _formatODataToDate: function(sDate) {
            if (!sDate || sDate.length !== 8) return "";
            return sDate.substring(0,4) + "-" + sDate.substring(4,6) + "-" + sDate.substring(6,8);
        },

        _getFormattedDateTime: function() {
            var oDate = new Date();
            var sYear = oDate.getFullYear();
            var sMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
            var sDay = oDate.getDate().toString().padStart(2, '0');
            var sHour = oDate.getHours().toString().padStart(2, '0');
            var sMin = oDate.getMinutes().toString().padStart(2, '0');
            return sYear + sMonth + sDay + "_" + sHour + sMin;
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        },

        onRefresh: function () {
            this.getView().byId("eforTable").getBinding("items").refresh();
            MessageToast.show("Liste güncellendi");
            
            setTimeout(function() {
                this._updateSummary();
            }.bind(this), 500);
        },

        onCreateEfor: function () {
            var oView = this.getView();
            
            if (!this._oCreateDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.CreateEforDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oCreateDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._resetCreateDialog();
                    oDialog.open();
                }.bind(this)).catch(function(oError) {
                    MessageBox.error("Dialog yüklenemedi: " + oError.message);
                });
            } else {
                this._resetCreateDialog();
                this._oCreateDialog.open();
            }
        },

        _resetCreateDialog: function () {
            var oCreateModel = this.getView().getModel("create");
            oCreateModel.setData({
                Tarih: new Date().toISOString().split('T')[0],
                IsIsteyen: "",
                NotBilgisi: "",
                EforGun: "",
                IsTeslimTarihi: "",
                IsinSahibi: "",
                Durum: "Aktif"
            });
        },

        onSaveEfor: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCreateModel = oView.getModel("create");
            var oData = oCreateModel.getData();

            if (!oData.Tarih || !oData.IsIsteyen || !oData.EforGun || !oData.IsinSahibi || !oData.Durum) {
                MessageBox.error("Lütfen zorunlu alanları doldurun!");
                return;
            }

            if (isNaN(parseFloat(oData.EforGun)) || parseFloat(oData.EforGun) <= 0) {
                MessageBox.error("Lütfen geçerli bir efor değeri girin!");
                return;
            }

            var sTarih = oData.Tarih.replace(/-/g, "");
            var sTeslimTarih = oData.IsTeslimTarihi ? oData.IsTeslimTarihi.replace(/-/g, "") : "";

            var oPayload = {
                Tarih: sTarih,
                IsIsteyen: oData.IsIsteyen,
                NotBilgisi: oData.NotBilgisi || "",
                EforGun: oData.EforGun,
                IsTeslimTarihi: sTeslimTarih,
                IsinSahibi: oData.IsinSahibi,
                Durum: oData.Durum,
                CreatedBy: ""
            };

            oModel.create("/EforSet", oPayload, {
                success: function (oResponseData) {
                    MessageToast.show("Efor başarıyla oluşturuldu: " + oResponseData.EforId);
                    this._oCreateDialog.close();
                    this.onRefresh();
                }.bind(this),
                error: function (oError) {
                    var sError = "Oluşturma hatası!";
                    try {
                        if (oError.responseText) {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            sError = oErrorResponse.error.message.value || sError;
                        }
                    } catch (e) {}
                    MessageBox.error(sError);
                }.bind(this)
            });
        },

        onCancelEfor: function () {
            this._oCreateDialog.close();
        },

        onEforPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sEforId = oContext.getProperty("EforId");
            MessageToast.show("Efor detayı: " + sEforId);
        },

        onEditEfor: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var oData = oContext.getObject();
            
            var oEditModel = this.getView().getModel("edit");
            oEditModel.setData({
                EforId: oData.EforId,
                Tarih: this._formatODataToDate(oData.Tarih),
                IsIsteyen: oData.IsIsteyen,
                NotBilgisi: oData.NotBilgisi,
                EforGun: oData.EforGun,
                IsTeslimTarihi: this._formatODataToDate(oData.IsTeslimTarihi),
                IsinSahibi: oData.IsinSahibi,
                Durum: oData.Durum
            });
            
            var oView = this.getView();
            
            if (!this._oEditDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.EditEforDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oEditDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oEditDialog.open();
            }
        },

        onUpdateEfor: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEditModel = oView.getModel("edit");
            var oData = oEditModel.getData();
            
            if (!oData.Tarih || !oData.IsIsteyen || !oData.EforGun || !oData.IsinSahibi || !oData.Durum) {
                MessageBox.error("Lütfen zorunlu alanları doldurun!");
                return;
            }
            
            if (isNaN(parseFloat(oData.EforGun)) || parseFloat(oData.EforGun) <= 0) {
                MessageBox.error("Lütfen geçerli bir efor değeri girin!");
                return;
            }
            
            var sTarih = oData.Tarih.replace(/-/g, "");
            var sTeslimTarih = oData.IsTeslimTarihi ? oData.IsTeslimTarihi.replace(/-/g, "") : "";
            
            var oPayload = {
                Tarih: sTarih,
                IsIsteyen: oData.IsIsteyen,
                NotBilgisi: oData.NotBilgisi || "",
                EforGun: oData.EforGun,
                IsTeslimTarihi: sTeslimTarih,
                IsinSahibi: oData.IsinSahibi,
                Durum: oData.Durum
            };
            
            var sPath = "/EforSet('" + oData.EforId + "')";
            
            oModel.update(sPath, oPayload, {
                success: function () {
                    MessageToast.show("Efor başarıyla güncellendi");
                    this._oEditDialog.close();
                    this.onRefresh();
                }.bind(this),
                error: function (oError) {
                    var sError = "Güncelleme hatası!";
                    try {
                        if (oError.responseText) {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            sError = oErrorResponse.error.message.value || sError;
                        }
                    } catch (e) {}
                    MessageBox.error(sError);
                }.bind(this)
            });
        },

        onCancelEdit: function () {
            this._oEditDialog.close();
        },

        onDeleteEfor: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var sEforId = oContext.getProperty("EforId");
            
            MessageBox.confirm("Bu efor kaydını silmek istediğinizden emin misiniz?", {
                title: "Efor Sil",
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this.getView().getModel().remove(oContext.getPath(), {
                            success: function() {
                                MessageToast.show("Efor kaydı silindi: " + sEforId);
                                this.onRefresh();
                            }.bind(this),
                            error: function(oError) {
                                var sError = "Silme işlemi başarısız!";
                                try {
                                    if (oError.responseText) {
                                        var oErrorResponse = JSON.parse(oError.responseText);
                                        sError = oErrorResponse.error.message.value || sError;
                                    }
                                } catch (e) {}
                                MessageBox.error(sError);
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
        },

        onExportToExcel: function () {
            var oTable = this.byId("eforTable");
            var aItems = oTable.getItems();
            
            if (aItems.length === 0) {
                MessageBox.error("Dışa aktarılacak veri yok!");
                return;
            }

            var aExcelData = [];
            
            aItems.forEach(function(oItem) {
                var oContext = oItem.getBindingContext();
                var oData = oContext.getObject();
                
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
                        sheetName: "Efor Listesi",
                        metainfo: { author: "Efor Yönetim Sistemi", created: new Date() }
                    }
                },
                dataSource: aExcelData,
                fileName: "Efor_Listesi_" + this._getFormattedDateTime() + ".xlsx",
                worker: false
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function() {
                oSpreadsheet.destroy();
                MessageToast.show(aExcelData.length + " kayıt Excel'e aktarıldı");
            });
        }
    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Controller.extend("eformanager.controller.MusteriList", {

        onInit: function () {
            // Create model
            var oCreateModel = new JSONModel({
                MusteriKodu: "",
                MusteriAdi: ""
            });
            this.getView().setModel(oCreateModel, "createMusteri");
            
            // Edit model
            var oEditModel = new JSONModel({});
            this.getView().setModel(oEditModel, "editMusteri");
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        },

        onRefresh: function () {
            this.getView().byId("musteriTable").getBinding("items").refresh();
            MessageToast.show("Liste güncellendi");
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("musteriTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) return;

            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("MusteriKodu", FilterOperator.Contains, sQuery),
                        new Filter("MusteriAdi", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            oBinding.filter(aFilters);
        },

        onCreateMusteri: function () {
            var oView = this.getView();
            
            if (!this._oCreateDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.CreateMusteriDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oCreateDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._resetCreateDialog();
                    oDialog.open();
                }.bind(this));
            } else {
                this._resetCreateDialog();
                this._oCreateDialog.open();
            }
        },

        _resetCreateDialog: function () {
            var oCreateModel = this.getView().getModel("createMusteri");
            oCreateModel.setData({
                MusteriKodu: "",
                MusteriAdi: ""
            });
        },

        onSaveMusteri: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCreateModel = oView.getModel("createMusteri");
            var oData = oCreateModel.getData();

            // Validation
            if (!oData.MusteriKodu || !oData.MusteriAdi) {
                MessageBox.error("Lütfen müşteri kodu ve adı alanlarını doldurun!");
                return;
            }

            // OData payload
            var oPayload = {
                MusteriKodu: oData.MusteriKodu,
                MusteriAdi: oData.MusteriAdi
            };

            // Create
            oModel.create("/MusteriSet", oPayload, {
                success: function (oResponseData) {
                    MessageToast.show("Müşteri başarıyla oluşturuldu: " + oResponseData.MusteriId);
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
                    } catch (e) {
                        // ignore
                    }
                    MessageBox.error(sError);
                }.bind(this)
            });
        },

        onCancelMusteri: function () {
            this._oCreateDialog.close();
        },

        onMusteriPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sMusteriId = oContext.getProperty("MusteriId");
            MessageToast.show("Müşteri detayı: " + sMusteriId);
        },

        onEditMusteri: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            
            var oData = oContext.getObject();
            
            var oEditModel = this.getView().getModel("editMusteri");
            oEditModel.setData({
                MusteriId: oData.MusteriId,
                MusteriKodu: oData.MusteriKodu,
                MusteriAdi: oData.MusteriAdi
            });
            
            var oView = this.getView();
            
            if (!this._oEditDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.EditMusteriDialog",
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

        onUpdateMusteri: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEditModel = oView.getModel("editMusteri");
            var oData = oEditModel.getData();
            
            // Validation
            if (!oData.MusteriKodu || !oData.MusteriAdi) {
                MessageBox.error("Lütfen müşteri kodu ve adı alanlarını doldurun!");
                return;
            }
            
            // OData payload
            var oPayload = {
                MusteriKodu: oData.MusteriKodu,
                MusteriAdi: oData.MusteriAdi
            };
            
            var sPath = "/MusteriSet('" + oData.MusteriId + "')";
            
            oModel.update(sPath, oPayload, {
                success: function () {
                    MessageToast.show("Müşteri başarıyla güncellendi");
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
                    } catch (e) {
                        // ignore
                    }
                    MessageBox.error(sError);
                }.bind(this)
            });
        },

        onCancelEditMusteri: function () {
            this._oEditDialog.close();
        },

        onDeleteMusteri: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var sMusteriId = oContext.getProperty("MusteriId");
            
            MessageBox.confirm("Bu müşteri kaydını silmek istediğinizden emin misiniz?", {
                title: "Müşteri Sil",
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        
                        oModel.remove(oContext.getPath(), {
                            success: function() {
                                MessageToast.show("Müşteri kaydı silindi: " + sMusteriId);
                                this.onRefresh();
                            }.bind(this),
                            error: function(oError) {
                                var sError = "Silme işlemi başarısız!";
                                try {
                                    if (oError.responseText) {
                                        var oErrorResponse = JSON.parse(oError.responseText);
                                        sError = oErrorResponse.error.message.value || sError;
                                    }
                                } catch (e) {
                                    // ignore
                                }
                                MessageBox.error(sError);
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
        }
    });
});
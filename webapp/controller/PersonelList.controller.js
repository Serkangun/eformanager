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

    return Controller.extend("eformanager.controller.PersonelList", {

        onInit: function () {
            // Create model (metadata uyumlu property isimleri)
            var oCreateModel = new JSONModel({
                Name: "",
                Surname: "",
                Email: "",
                Telefon: ""
            });
            this.getView().setModel(oCreateModel, "createPersonel");
            
            // Edit model
            var oEditModel = new JSONModel({});
            this.getView().setModel(oEditModel, "editPersonel");
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onRefresh: function () {
            this.getView().byId("personelTable").getBinding("items").refresh();
            MessageToast.show("Liste güncellendi");
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("personelTable");
            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;

            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("Surname", FilterOperator.Contains, sQuery),
                        new Filter("Email", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            oBinding.filter(aFilters);
        },

        onCreatePersonel: function () {
            var oView = this.getView();
            if (!this._oCreateDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.CreatePersonelDialog",
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
            var oCreateModel = this.getView().getModel("createPersonel");
            oCreateModel.setData({
                Name: "",
                Surname: "",
                Email: "",
                Telefon: ""
            });
        },

        onSavePersonel: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oCreateModel = oView.getModel("createPersonel");
            var oData = oCreateModel.getData();

            if (!oData.Name || !oData.Surname) {
                MessageBox.error("Lütfen ad ve soyad alanlarını doldurun!");
                return;
            }

            var oPayload = {
                Name: oData.Name,
                Surname: oData.Surname,
                Email: oData.Email || "",
                Telefon: oData.Telefon || ""
            };

            oModel.create("/PersonelSet", oPayload, {
                success: function (oResponseData) {
                    MessageToast.show("Personel başarıyla oluşturuldu: " + oResponseData.PersonelId);
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

        onCancelPersonel: function () {
            this._oCreateDialog.close();
        },

        onPersonelPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sPersonelId = oContext.getProperty("PersonelId");
            MessageToast.show("Personel detayı: " + sPersonelId);
        },

        onEditPersonel: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var oData = oContext.getObject();

            var oEditModel = this.getView().getModel("editPersonel");
            oEditModel.setData({
                PersonelId: oData.PersonelId,
                Name: oData.Name,
                Surname: oData.Surname,
                Email: oData.Email,
                Telefon: oData.Telefon
            });

            var oView = this.getView();
            if (!this._oEditDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.EditPersonelDialog",
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

        onUpdatePersonel: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEditModel = oView.getModel("editPersonel");
            var oData = oEditModel.getData();

            if (!oData.Name || !oData.Surname) {
                MessageBox.error("Lütfen ad ve soyad alanlarını doldurun!");
                return;
            }

            var oPayload = {
                Name: oData.Name,
                Surname: oData.Surname,
                Email: oData.Email || "",
                Telefon: oData.Telefon || ""
            };

            var sPath = "/PersonelSet('" + oData.PersonelId + "')";
            oModel.update(sPath, oPayload, {
                success: function () {
                    MessageToast.show("Personel başarıyla güncellendi");
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

        onCancelEditPersonel: function () {
            this._oEditDialog.close();
        },

        onDeletePersonel: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext();
            var sPersonelId = oContext.getProperty("PersonelId");

            MessageBox.confirm("Bu personel kaydını silmek istediğinizden emin misiniz?", {
                title: "Personel Sil",
                onClose: function(sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        oModel.remove(oContext.getPath(), {
                            success: function() {
                                MessageToast.show("Personel kaydı silindi: " + sPersonelId);
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
        }

    });
});

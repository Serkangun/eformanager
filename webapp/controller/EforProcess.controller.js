sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
], function (Controller, JSONModel, MessageBox, MessageToast, Spreadsheet, exportLibrary) {
    "use strict";

    const EdmType = exportLibrary.EdmType;

    return Controller.extend("efor.management.controller.EforProcess", {

        onInit: function () {
            // View model
            const oViewModel = new JSONModel({
                busy: false,
                mode: "display"
            });
            this.getView().setModel(oViewModel, "view");
        },

        onRefresh: function () {
            this.getView().byId("eforTable").getBinding("items").refresh();
            MessageToast.show("Liste güncellendi");
        },

        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query");
            const oTable = this.byId("eforTable");
            const oBinding = oTable.getBinding("items");
            
            if (!oBinding) return;

            const aFilters = [];
            if (sQuery) {
                aFilters.push(new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Isisteyen", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Notbilgisi", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Isinsahibi", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            oBinding.filter(aFilters);
        },

        onFilterChange: function () {
            const oTable = this.byId("eforTable");
            const oBinding = oTable.getBinding("items");
            
            if (!oBinding) return;

            const aFilters = [];
            
            // Tarih filtreleri
            const oDateFrom = this.byId("dateFrom").getDateValue();
            const oDateTo = this.byId("dateTo").getDateValue();
            
            if (oDateFrom) {
                aFilters.push(new sap.ui.model.Filter("Tarih", sap.ui.model.FilterOperator.GE, oDateFrom));
            }
            if (oDateTo) {
                aFilters.push(new sap.ui.model.Filter("Tarih", sap.ui.model.FilterOperator.LE, oDateTo));
            }

            // İş isteyen filtresi
            const sIsIsteyen = this.byId("filterIsIsteyen").getValue();
            if (sIsIsteyen) {
                aFilters.push(new sap.ui.model.Filter("Isisteyen", sap.ui.model.FilterOperator.Contains, sIsIsteyen));
            }

            // Durum filtresi
            const sDurum = this.byId("filterDurum").getSelectedKey();
            if (sDurum) {
                aFilters.push(new sap.ui.model.Filter("Durum", sap.ui.model.FilterOperator.EQ, sDurum));
            }

            oBinding.filter(aFilters);
        },

        onClearFilters: function () {
            this.byId("dateFrom").setValue("");
            this.byId("dateTo").setValue("");
            this.byId("filterIsIsteyen").setValue("");
            this.byId("filterDurum").setSelectedKey("");
            this.onFilterChange();
        },

        onCreateEfor: function () {
            // Dialog açma kodu - sonra ekleyeceğiz
            MessageToast.show("Yeni efor dialog açılacak");
        },

        onEditEfor: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oContext = oItem.getBindingContext();
            MessageToast.show("Düzenleme: " + oContext.getProperty("Eforid"));
        },

        onDeleteEfor: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oContext = oItem.getBindingContext();
            const sEforId = oContext.getProperty("Eforid");

            MessageBox.confirm("Bu efor kaydını silmek istediğinizden emin misiniz?", {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this.getView().getModel().remove(oContext.getPath(), {
                            success: () => {
                                MessageToast.show("Efor kaydı silindi");
                                this.onRefresh();
                            },
                            error: (oError) => {
                                MessageBox.error("Silme işlemi başarısız: " + oError.message);
                            }
                        });
                    }
                }
            });
        },

        onExportToExcel: function () {
            const oTable = this.byId("eforTable");
            const oBinding = oTable.getBinding("items");

            const aCols = [
                { label: 'Efor ID', property: 'Eforid', type: EdmType.String },
                { label: 'Tarih', property: 'Tarih', type: EdmType.Date },
                { label: 'İş İsteyen', property: 'Isisteyen', type: EdmType.String },
                { label: 'Not', property: 'Notbilgisi', type: EdmType.String },
                { label: 'Efor (Gün)', property: 'Eforgun', type: EdmType.Number },
                { label: 'Teslim Tarihi', property: 'Isteslimtarih', type: EdmType.Date },
                { label: 'İşin Sahibi', property: 'Isinsahibi', type: EdmType.String },
                { label: 'Durum', property: 'Durum', type: EdmType.String }
            ];

            const oSettings = {
                workbook: {
                    columns: aCols,
                    context: {
                        sheetName: 'Efor Listesi'
                    }
                },
                dataSource: oBinding,
                fileName: 'Efor_Listesi_' + new Date().toISOString().slice(0, 10) + '.xlsx'
            };

            const oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build()
                .then(() => MessageToast.show("Excel dosyası oluşturuldu"))
                .catch((oError) => MessageBox.error("Excel oluşturulamadı: " + oError.message));
        }
    });
});
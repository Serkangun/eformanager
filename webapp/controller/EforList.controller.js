sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageBox, MessageToast, Fragment, Spreadsheet, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("eformanager.controller.EforList", {

     onInit: function () {
    // View model
    var oViewModel = new JSONModel({
        totalCount: 0,
        totalEfor: 0,
        currentMonth: "",
        hasActiveFilters: false,
        activeFiltersText: ""
    });
    this.getView().setModel(oViewModel, "view");
    
    // Filter model
    var oFilterModel = new JSONModel({
        baslangicTarihi: "",
        bitisTarihi: "",
        musteriKodu: "",
        personel: "",
        durum: ""
    });
    this.getView().setModel(oFilterModel, "filter");
    
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
    
    // Bu ayı hesapla ve göster
    this._setCurrentMonth();
},

onAfterRendering: function() {
    // Table'a event listener ekle
    var oTable = this.byId("eforTable");
    
    if (oTable && !this._bTableEventAttached) {
        this._bTableEventAttached = true;
        
        // updateFinished eventi dinle - tablo her güncellendiğinde
        oTable.attachEventOnce("updateFinished", function() {
            console.log("Tablo ilk kez yüklendi, filtre uygulanıyor...");
            this._applyCurrentMonthFilter();
            
            setTimeout(function() {
                this._updateSummary();
            }.bind(this), 100);
        }.bind(this));
    }
},

        _setCurrentMonth: function() {
            var oToday = new Date();
            var aAylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            var sCurrentMonth = aAylar[oToday.getMonth()] + " " + oToday.getFullYear();
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/currentMonth", sCurrentMonth);
            
            // Filter model'e de bu ayın tarihlerini set et
            var oFirstDay = new Date(oToday.getFullYear(), oToday.getMonth(), 1);
            var oLastDay = new Date(oToday.getFullYear(), oToday.getMonth() + 1, 0);
            
            var oFilterModel = this.getView().getModel("filter");
            oFilterModel.setProperty("/baslangicTarihi", oFirstDay.toISOString().split('T')[0]);
            oFilterModel.setProperty("/bitisTarihi", oLastDay.toISOString().split('T')[0]);
        },

        _applyCurrentMonthFilter: function() {
            var oTable = this.byId("eforTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                console.log("Binding bulunamadı");
                return;
            }
            
            var oToday = new Date();
            var sYear = oToday.getFullYear().toString();
            var sMonth = (oToday.getMonth() + 1).toString().padStart(2, '0');
            
            var sStartDate = sYear + sMonth + "01";
            var iLastDay = new Date(oToday.getFullYear(), oToday.getMonth() + 1, 0).getDate();
            var sEndDate = sYear + sMonth + iLastDay.toString().padStart(2, '0');
            
            console.log("Bu ayın filtresi uygulanıyor:", sStartDate, "-", sEndDate);
            
            var aFilters = [
                new Filter("Tarih", FilterOperator.GE, sStartDate),
                new Filter("Tarih", FilterOperator.LE, sEndDate)
            ];
            
            oBinding.filter(new Filter({
                filters: aFilters,
                and: true
            }));
            
            // Aktif filtre bilgisini güncelle
            this._updateActiveFiltersInfo();
            
            console.log("Filtre uygulandı - Görünen kayıt sayısı:", oTable.getItems().length);
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
            
            console.log("Özet güncellendi - Kayıt:", iTotalCount, "Efor:", fTotalEfor);
        },

        _updateActiveFiltersInfo: function() {
            var oFilterModel = this.getView().getModel("filter");
            var oData = oFilterModel.getData();
            
            var aActiveFilters = [];
            
            if (oData.baslangicTarihi && oData.bitisTarihi) {
                aActiveFilters.push("Tarih: " + this._formatDateDisplay(oData.baslangicTarihi) + " - " + this._formatDateDisplay(oData.bitisTarihi));
            }
            if (oData.musteriKodu) {
                aActiveFilters.push("Müşteri: " + oData.musteriKodu);
            }
            if (oData.personel) {
                aActiveFilters.push("Personel: " + oData.personel);
            }
            if (oData.durum) {
                aActiveFilters.push("Durum: " + oData.durum);
            }
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/hasActiveFilters", aActiveFilters.length > 0);
            oViewModel.setProperty("/activeFiltersText", aActiveFilters.join(" | "));
        },

        _formatDateDisplay: function(sDate) {
            if (!sDate) return "";
            var aParts = sDate.split("-");
            return aParts[2] + "." + aParts[1] + "." + aParts[0];
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
            var oTable = this.byId("eforTable");
            var oBinding = oTable.getBinding("items");
            
            if (oBinding) {
                var that = this;
                
                // Data geldiğinde filtre uygula
                var fnDataReceived = function() {
                    oBinding.detachDataReceived(fnDataReceived);
                    that._applyCurrentMonthFilter();
                    
                    setTimeout(function() {
                        that._updateSummary();
                    }, 100);
                };
                
                oBinding.attachDataReceived(fnDataReceived);
                oBinding.refresh();
                
                MessageToast.show("Liste güncellendi");
            }
        },

        /* ==================== FİLTRELEME ==================== */

        onOpenFilterDialog: function() {
            var oView = this.getView();
            
            if (!this._oFilterDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.FilterDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oFilterDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oFilterDialog.open();
            }
        },

        onFilterMusteriValueHelp: function() {
            var oView = this.getView();
            
            if (!this._oFilterMusteriDialog) {
                Fragment.load({
                    id: oView.getId() + "_filter",
                    name: "eformanager.view.fragment.MusteriSelectDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oFilterMusteriDialog = oDialog;
                    oView.addDependent(oDialog);
                    
                    oDialog.attachConfirm(this.onFilterMusteriConfirm, this);
                    oDialog.attachCancel(this.onFilterMusteriDialogClose, this);
                    
                    oDialog.open();
                }.bind(this));
            } else {
                this._oFilterMusteriDialog.open();
            }
        },

        onFilterMusteriConfirm: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sMusteriKodu = oContext.getProperty("MusteriKodu");
                
                var oFilterModel = this.getView().getModel("filter");
                oFilterModel.setProperty("/musteriKodu", sMusteriKodu);
            }
        },

        onFilterMusteriDialogClose: function() {
            if (this._oFilterMusteriDialog) {
                var oBinding = this._oFilterMusteriDialog.getBinding("items");
                if (oBinding) {
                    oBinding.filter([]);
                }
            }
        },

        onApplyFilter: function() {
            var oFilterModel = this.getView().getModel("filter");
            var oData = oFilterModel.getData();
            
            var oTable = this.byId("eforTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                MessageToast.show("Tablo yüklenemedi");
                return;
            }
            
            // ÖNCELİKLE MEVCUT FİLTRELERİ KALDIR
            oBinding.filter([]);
            
            var aFilters = [];
            
            // Tarih Aralığı Filtresi
            if (oData.baslangicTarihi && oData.bitisTarihi) {
                var sStartDate = oData.baslangicTarihi.replace(/-/g, "");
                var sEndDate = oData.bitisTarihi.replace(/-/g, "");
                
                console.log("Tarih Filtresi:", sStartDate, "-", sEndDate);
                
                aFilters.push(new Filter("Tarih", FilterOperator.GE, sStartDate));
                aFilters.push(new Filter("Tarih", FilterOperator.LE, sEndDate));
            }
            
            // Müşteri Filtresi
            if (oData.musteriKodu) {
                console.log("Müşteri Filtresi:", oData.musteriKodu);
                aFilters.push(new Filter("IsIsteyen", FilterOperator.EQ, oData.musteriKodu));
            }
            
            // Personel Filtresi
            if (oData.personel) {
                console.log("Personel Filtresi:", oData.personel);
                aFilters.push(new Filter("IsinSahibi", FilterOperator.Contains, oData.personel));
            }
            
            // Durum Filtresi
            if (oData.durum) {
                console.log("Durum Filtresi:", oData.durum);
                aFilters.push(new Filter("Durum", FilterOperator.EQ, oData.durum));
            }
            
            console.log("Toplam Filtre Sayısı:", aFilters.length);
            
            // YENİ FİLTRELERİ UYGULA
            if (aFilters.length > 0) {
                oBinding.filter(new Filter({
                    filters: aFilters,
                    and: true
                }));
            }
            
            this._oFilterDialog.close();
            
            // Aktif filtre bilgisini güncelle
            this._updateActiveFiltersInfo();
            
            // Özeti güncelle
            setTimeout(function() {
                this._updateSummary();
            }.bind(this), 300);
            
            MessageToast.show("Filtreler uygulandı");
        },

        onClearFilter: function() {
            var oFilterModel = this.getView().getModel("filter");
            
            // Bu ayın tarihlerini tekrar set et
            var oToday = new Date();
            var oFirstDay = new Date(oToday.getFullYear(), oToday.getMonth(), 1);
            var oLastDay = new Date(oToday.getFullYear(), oToday.getMonth() + 1, 0);
            
            oFilterModel.setData({
                baslangicTarihi: oFirstDay.toISOString().split('T')[0],
                bitisTarihi: oLastDay.toISOString().split('T')[0],
                musteriKodu: "",
                personel: "",
                durum: ""
            });
            
            // Bu ayın filtresini uygula
            this._applyCurrentMonthFilter();
            
            setTimeout(function() {
                this._updateSummary();
            }.bind(this), 200);
            
            this._oFilterDialog.close();
            MessageToast.show("Filtreler temizlendi - Bu ayın kayıtları gösteriliyor");
        },

        onClearAllFilters: function() {
            this.onClearFilter();
        },

        /* ==================== MÜŞTERİ SEÇİM ==================== */

        onMusteriValueHelp: function() {
            var oView = this.getView();
            
            if (!this._oMusteriDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "eformanager.view.fragment.MusteriSelectDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oMusteriDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oMusteriDialog.open();
            }
        },

        onMusteriConfirm: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sMusteriKodu = oContext.getProperty("MusteriKodu");
                
                var oCreateModel = this.getView().getModel("create");
                oCreateModel.setProperty("/IsIsteyen", sMusteriKodu);
            }
        },

        onMusteriDialogClose: function() {
            if (this._oMusteriDialog) {
                var oBinding = this._oMusteriDialog.getBinding("items");
                if (oBinding) {
                    oBinding.filter([]);
                }
            }
        },

        /* ==================== EDIT İÇİN MÜŞTERİ SEÇİM ==================== */

        onEditMusteriValueHelp: function() {
            var oView = this.getView();
            
            if (!this._oEditMusteriDialog) {
                Fragment.load({
                    id: oView.getId() + "_edit",
                    name: "eformanager.view.fragment.MusteriSelectDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oEditMusteriDialog = oDialog;
                    oView.addDependent(oDialog);
                    
                    oDialog.attachConfirm(this.onEditMusteriConfirm, this);
                    oDialog.attachCancel(this.onEditMusteriDialogClose, this);
                    
                    oDialog.open();
                }.bind(this));
            } else {
                this._oEditMusteriDialog.open();
            }
        },

        onEditMusteriConfirm: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sMusteriKodu = oContext.getProperty("MusteriKodu");
                
                var oEditModel = this.getView().getModel("edit");
                oEditModel.setProperty("/IsIsteyen", sMusteriKodu);
            }
        },

        onEditMusteriDialogClose: function() {
            if (this._oEditMusteriDialog) {
                var oBinding = this._oEditMusteriDialog.getBinding("items");
                if (oBinding) {
                    oBinding.filter([]);
                }
            }
        },

        /* ==================== EFOR İŞLEMLERİ ==================== */

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

            var oViewModel = this.getView().getModel("view");
            var sCurrentMonth = oViewModel.getProperty("/currentMonth");

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
                        sheetName: sCurrentMonth + " Efor Listesi",
                        metainfo: { author: "Efor Yönetim Sistemi", created: new Date() }
                    }
                },
                dataSource: aExcelData,
                fileName: sCurrentMonth.replace(" ", "_") + "_Efor_Listesi_" + this._getFormattedDateTime() + ".xlsx",
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
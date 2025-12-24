/*global QUnit*/

sap.ui.define([
	"eformanager/controller/EforProcess.controller"
], function (Controller) {
	"use strict";

	QUnit.module("EforProcess Controller");

	QUnit.test("I should test the EforProcess controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

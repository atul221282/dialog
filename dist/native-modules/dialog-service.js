var _class, _temp;



import { Origin } from 'aurelia-metadata';
import { Container } from 'aurelia-dependency-injection';
import { CompositionEngine, ViewSlot } from 'aurelia-templating';
import { DialogController } from './dialog-controller';
import { Renderer } from './renderer';
import { invokeLifecycle } from './lifecycle';
import { DialogResult } from './dialog-result';

export var DialogService = (_temp = _class = function () {
  function DialogService(container, compositionEngine) {
    

    this.container = container;
    this.compositionEngine = compositionEngine;
    this.controllers = [];
    this.hasActiveDialog = false;
  }

  DialogService.prototype.open = function open(settings) {
    var _this = this;

    var dialogController = void 0;

    var promise = new Promise(function (resolve, reject) {
      var childContainer = _this.container.createChild();
      dialogController = new DialogController(childContainer.get(Renderer), settings, resolve, reject);
      childContainer.registerInstance(DialogController, dialogController);
      var host = dialogController.renderer.getDialogContainer();

      var instruction = {
        container: _this.container,
        childContainer: childContainer,
        model: dialogController.settings.model,
        view: dialogController.settings.view,
        viewModel: dialogController.settings.viewModel,
        viewSlot: new ViewSlot(host, true),
        host: host
      };

      return _getViewModel(instruction, _this.compositionEngine).then(function (returnedInstruction) {
        dialogController.viewModel = returnedInstruction.viewModel;
        dialogController.slot = returnedInstruction.viewSlot;

        return invokeLifecycle(dialogController.viewModel, 'canActivate', dialogController.settings.model).then(function (canActivate) {
          if (canActivate) {
            _this.controllers.push(dialogController);
            _this.hasActiveDialog = !!_this.controllers.length;

            return _this.compositionEngine.compose(returnedInstruction).then(function (controller) {
              dialogController.controller = controller;
              dialogController.view = controller.view;

              return dialogController.renderer.showDialog(dialogController);
            });
          }
        });
      });
    });

    return promise.then(function (result) {
      var i = _this.controllers.indexOf(dialogController);
      if (i !== -1) {
        _this.controllers.splice(i, 1);
        _this.hasActiveDialog = !!_this.controllers.length;
      }

      return result;
    });
  };

  return DialogService;
}(), _class.inject = [Container, CompositionEngine], _temp);

function _getViewModel(instruction, compositionEngine) {
  if (typeof instruction.viewModel === 'function') {
    instruction.viewModel = Origin.get(instruction.viewModel).moduleId;
  }

  if (typeof instruction.viewModel === 'string') {
    return compositionEngine.ensureViewModel(instruction);
  }

  return Promise.resolve(instruction);
}
import _get = require('lodash.get');
import _set = require('lodash.set');
import _merge = require('lodash.merge');

import { EnumRequestType, Plugin } from 'jovo-core';
import { AlexaSkill } from '../core/AlexaSkill';
import { AlexaRequest } from '../core/AlexaRequest';
import { Alexa } from '../Alexa';
import { Template } from '../response/visuals/Template';
import { AlexaResponse } from '../core/AlexaResponse';

export class Apl {
  version: string;
  alexaSkill: AlexaSkill;

  constructor(alexaSkill: AlexaSkill) {
    this.alexaSkill = alexaSkill;
    this.version = '1.1';
  }
  // tslint:disable-next-line
  addDocumentDirective(documentDirective: any) {
    const doc = {
      type: 'Alexa.Presentation.APL.RenderDocument',
      version: this.version,
    };
    _merge(doc, documentDirective);

    const directives = _get(this.alexaSkill.$output, 'Alexa.Apl', []);
    directives.push(doc);
    _set(this.alexaSkill.$output, 'Alexa.Apl', directives);

    return this;
  }

  // tslint:disable-next-line
  addCommands(token: string, commands: any[]) {
    const commandDirective = {
      type: 'Alexa.Presentation.APL.ExecuteCommands',
      token,
      commands,
    };

    const existingExecuteCommands = _get(this.alexaSkill.$output, 'Alexa.Apl', []).filter(
      // tslint:disable-next-line
      (directive: any) => {
        return (
          directive.type === commandDirective.type && directive.token === commandDirective.token
        );
      },
    );

    if (existingExecuteCommands[0]) {
      existingExecuteCommands[0].commands = existingExecuteCommands[0].commands.concat(commands);
    } else {
      const directives = _get(this.alexaSkill.$output, 'Alexa.Apl', []);
      directives.push(commandDirective);
      _set(this.alexaSkill.$output, 'Alexa.Apl', directives);
    }

    return this;
  }

  setVersion(version: string) {
    this.version = version;
  }

  isUserEvent(): boolean {
    return _get(this.alexaSkill.$request, 'request.type') === 'Alexa.Presentation.APL.UserEvent';
  }

  getEventArguments() {
    return _get(this.alexaSkill.$request, 'request.arguments');
  }
}

export class AplPlugin implements Plugin {
  install(alexa: Alexa) {
    alexa.middleware('$type')!.use(this.type.bind(this));
    alexa.middleware('$output')!.use(this.output.bind(this));

    /**
     * Adds apl directive
     * @deprecated Please use addAPLDirective()
     * @public
     * @param {*} directive
     * @return {AlexaSkill}
     */
    // tslint:disable-next-line
    AlexaSkill.prototype.addAplDirective = function (directive: any) {
      const directives = _get(this.$output, 'Alexa.Apl', []);
      directives.push(directive);
      _set(this.$output, 'Alexa.Apl', directives);

      return this;
    };

    /**
     * Adds apl directive
     * @public
     * @param {*} directive
     * @return {AlexaSkill}
     */
    // tslint:disable-next-line
    AlexaSkill.prototype.addAPLDirective = function (directive: any) {
      const directives = _get(this.$output, 'Alexa.Apl', []);
      directives.push(directive);
      _set(this.$output, 'Alexa.Apl', directives);

      return this;
    };

    /**
     * Adds apl directive
     * @deprecated Use $alexaSkill.$apl.addCommnds()
     * @public
     * @param {*} documentDirective
     * @return {AlexaSkill}
     */
    // tslint:disable-next-line
    AlexaSkill.prototype.addAPLDocument = function (documentDirective: any) {
      const document = {
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
      };
      _merge(document, documentDirective);

      const directives = _get(this.$output, 'Alexa.Apl', []);
      directives.push(document);
      _set(this.$output, 'Alexa.Apl', directives);

      return this;
    };

    /**
     * Adds apl directive
     * @public
     * @deprecated Use $alexaSkill.$apl.addCommnds()
     * @param {string} token
     * @param {*} commands
     * @return {AlexaSkill}
     */
    // tslint:disable-next-line
    AlexaSkill.prototype.addAPLCommands = function (token: string, commands: any[]) {
      const commandDirective = {
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token,
        commands,
      };

      const existingExecuteCommands = _get(this.$output, 'Alexa.Apl', []).filter(
        // tslint:disable-next-line
        (directive: any) => {
          return (
            directive.type === commandDirective.type && directive.token === commandDirective.token
          );
        },
      );

      if (existingExecuteCommands[0]) {
        existingExecuteCommands[0].commands = existingExecuteCommands[0].commands.concat(commands);
      } else {
        const directives = _get(this.$output, 'Alexa.Apl', []);
        directives.push(commandDirective);
        _set(this.$output, 'Alexa.Apl', directives);
      }

      return this;
    };
  }
  uninstall(alexa: Alexa) {}
  type(alexaSkill: AlexaSkill) {
    const alexaRequest = alexaSkill.$request as AlexaRequest;
    if (_get(alexaRequest, 'request.type') === 'Alexa.Presentation.APL.UserEvent') {
      alexaSkill.$type = {
        type: EnumRequestType.ON_ELEMENT_SELECTED,
        subType: _get(alexaRequest, 'request.token'),
      };
    }

    alexaSkill.$apl = new Apl(alexaSkill);
  }
  output(alexaSkill: AlexaSkill) {
    const output = alexaSkill.$output;
    const response = alexaSkill.$response as AlexaResponse;
    const request = alexaSkill.$request! as AlexaRequest;
    const apl = _get(output, 'Alexa.Apl');

    if (apl) {
      let directives = _get(response, 'response.directives', []);

      if (Array.isArray(apl)) {
        apl.forEach((directive: any) => {
          if (request.hasAPLInterface() || isAplA(directive)) {
            directives.push(directive);
          }
        });
      } else {
        if (request.hasAPLInterface() || isAplA(apl)) {
          directives.push(apl);
        }
      }
      _set(response, 'response.directives', directives);
    }
  }
}

function isAplA(directive: any) {
  return directive.type.startsWith('Alexa.Presentation.APLA');
}

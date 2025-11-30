import { rules } from './Data/rules.mjs'
import { players } from './Data/players.mjs'

$(function () {

  const _ = {
    data: {},
    init: () => {
      console.log('Loaded rules:', Object.keys(rules).length);
      console.log('Loaded players:', players.length);
      console.log('Example - Violations for @BearDaBear:', _.func.getPlayerViolations('@BearDaBear'));
      _.render.table.players();
      _.render.toolbar.buttons();
    },
    func: {
      getViolationDefinition: (violationId) => {
        return rules[violationId] || null;
      },
      getPlayerViolations: (playerName) => {
        let violations = [];
        let violationsDefined = [];
        const player = players.find(p => p.accountName === playerName);
        violations = player ? player.violations : [];
        $.each(violations, (index, violationId) => {
          const definition = _.func.getViolationDefinition(violationId);
          if (definition) {
            violationsDefined.push(definition);
          }
        });
        return violationsDefined;
      },
    },
    render: {
      table: {
        players: () => {
          $('.sample-row').remove(); // Clear existing sample rows
          let rowTemplate = `<tr>
            <td><b>{{accountName}}</b></td>
            <td>{{violations}}</td>
          </tr>`;
          let violationPillTemplate = `<span class="violation-pill" data-bs-toggle="tooltip" data-bss-tooltip title="{{description}}" value="{{id}}">{{title}}</span>`;
          let tableBody = $('#tableBody');
          $.each(players, (index, player) => {
            let violationsHtml = '';
            $.each(player.violations, (violationIndex, violationId) => {
              const definition = _.func.getViolationDefinition(violationId);
              if (definition) {
                violationsHtml += violationPillTemplate
                  .replace('{{id}}', violationId)
                  .replace('{{title}}', definition.title)
                  .replace('{{description}}', definition.description);
              }
            });
            tableBody.append(rowTemplate
              .replace('{{accountName}}', player.accountName)
              .replace('{{violations}}', violationsHtml));
          });
          // Initialize tooltips
          $('[data-bs-toggle="tooltip"]').tooltip();
        },
        rules: () => {
          $('.sample-row').remove(); // Clear existing sample rows
          let rowTemplate = `<tr>
            <td><b>{{title}}</b></td>
            <td>{{description}}</td>
          </tr>`;
          let tableBody = $('#tableBodyRules');
          tableBody.empty();
          $.each(rules, (id, rule) => {
            tableBody.append(rowTemplate
              .replace('{{title}}', rule.title)
              .replace('{{description}}', rule.description));
          });
        }
      },
      toolbar: {
        buttons: () => {
          let rulesButtonText = 'Rules: {{amount}}'
          $('#rules-button').html(rulesButtonText.replace('{{amount}}', Object.keys(rules).length));
          $('#rules-button').on('click', () => {
            $('#rules-modal').modal('show');
            _.render.table.rules();
          });

          let playersButtonText = 'Players: {{amount}}'
          $('#players-button').html(playersButtonText.replace('{{amount}}', players.length));
        }
      }
    }
  }

_.init();

});
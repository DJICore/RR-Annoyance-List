import { rules } from './Data/rules.mjs'
import { players } from './Data/players.mjs'
import { request } from './Modules/API.mjs';

$(function () {

  const _ = {
    data: {
      recnet: {
        proxy: { enabled: false, baseUrl: 'https://proxy.corsfix.com/?' },
        endpoints: {
          accountSearch: 'https://apim.rec.net/accounts/account/search?name={{accountName}}',
          accountById: 'https://accounts.rec.net/account/bulk{{queryIds}}' // Example: ?id=1&id=2&id=3
        }
      },
      htmlIcons: {
        check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 0 512 512" width="1em" height="1em" fill="currentColor">
          <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"></path>
        </svg>`
      },
      insertPlayers: []
    },
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
      selectElementContents: (el) => {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
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

          $('#insert-players-button').on('click', () => {
            _.data.insertPlayers = [];
            _.render.modals.insertPlayers.refreshTable();
            _.render.modals.insertPlayers.init.playerSearch();
            _.render.modals.insertPlayers.init.violationDropdown();
            _.render.modals.insertPlayers.init.buttons();
            $('#insert-players-modal').modal('show');
          });
        }
      },
      modals: {
        insertPlayers: {
          init: {
            playerSearch: () => {
              // Initialize player search inputs and dropdowns
              let playerInputs = $('#insert-players-modal .player-input');
              playerInputs.on('focus', function () {
                _.func.selectElementContents(this);
              });
              playerInputs.on('keyup', async function () {
                const playerInput = $(this);
                const query = playerInput.html();
                if (query.length < 2) return;
                const matchedPlayers = await request({
                  url: _.data.recnet.endpoints.accountSearch.replace('{{accountName}}', encodeURIComponent(query)),
                  proxy: _.data.recnet.proxy
                });
                _.render.modals.insertPlayers.showPlayerSearchDropdown(playerInput, matchedPlayers.data);
              });
            },
            violationDropdown: () => {
              // Initialize violation dropdowns
              let violationInputs = $('#insert-players-modal .player-violations');
              violationInputs.on('click', function () {
                const violationInput = $(this);
                _.render.modals.insertPlayers.showViolationDropdown(violationInput);
              });
              const violationDropdown = $('#insert-players-modal #violations-dropdown');
              $(document).on('click', function (e) {
                const hasId = $(e.target).attr('id') === '#violations-dropdown';
                const hasClass = $(e.target).hasClass('player-violations');
                const isDropdownItem = $(e.target).hasClass('dropdown-item');
                if (!hasId && !hasClass && !isDropdownItem) {
                  violationDropdown.empty();
                }
              });
            },
            buttons: () => {
              // Initialize add player button
              let addPlayerButton = $('#insert-players-modal #add-player-button');
              let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
              let playerRowTemplate = `<tr>
                <td class="player-input" contenteditable="true">Player</td>
                <td class="player-id"></td>
                <td class="player-violations"></td>
              </tr>`;
              addPlayerButton.on('click', function () {
                _.render.modals.insertPlayers.refreshTable();
                tableBody.append(playerRowTemplate);
                _.render.modals.insertPlayers.init.playerSearch();
                _.render.modals.insertPlayers.init.violationDropdown();
              });

              // Initialize export JSON button
              let exportJSONButton = $('#insert-players-modal #export-json-button');
              let jsonOutput = $('#insert-players-export-json-modal #export-json-output');
              let exportJSONModal = $('#insert-players-export-json-modal');
              let insertPlayersModal = $('#insert-players-modal');
              exportJSONButton.on('click', function () {
                _.render.modals.insertPlayers.updateJSONOutput();
                const jsonString = JSON.stringify(_.data.insertPlayers, null, 2);
                jsonOutput.text(jsonString);
                exportJSONModal.modal('show');
                insertPlayersModal.modal('hide');
                _.func.selectElementContents(jsonOutput[0]);
              });
            }
          },
          showPlayerSearchDropdown: (inputElement, searchResults) => {
            let inputX = inputElement.offset().left;
            let inputY = inputElement.offset().top + inputElement.outerHeight();
            let playerSearchDropdown = $('#insert-players-modal #player-search-dropdown');
            playerSearchDropdown.empty();
            $.each(searchResults, (index, player) => {
              const option = $(`<div class="dropdown-item" data-account-id="${player.accountId}">AN: ${player.username} - DN: ${player.displayName}</div>`);
              option.on('click', function () {
                inputElement.html('@' + player.username);
                inputElement.parent().find('.player-id').html(player.accountId);
                playerSearchDropdown.empty();
                _.render.modals.insertPlayers.updateJSONOutput();
              });
              playerSearchDropdown.append(option);
            });
            playerSearchDropdown.css({ top: inputY, left: inputX });
          },
          showViolationDropdown: (inputElement) => {
            let inputX = inputElement.offset().left;
            let inputY = inputElement.offset().top + inputElement.outerHeight();
            let violationsDropdown = $('#insert-players-modal #violations-dropdown');
            let selectedViolations = [];
            inputElement.find('.violation-pill').each(function () {
              const violationId = parseInt($(this).attr('data-violation-id'));
              selectedViolations.push(violationId);
            });
            violationsDropdown.empty();
            $.each(rules, (violationId, rule) => {
              const iconCheck = selectedViolations.includes(parseInt(violationId)) ? _.data.htmlIcons.check : '';
              const option = $(`<div class="dropdown-item" data-violation-id="${violationId}">${rule.title} ${iconCheck}</div>`);
              option.on('click', function () {
                if (iconCheck) {
                  inputElement.find(`.violation-pill[data-violation-id="${violationId}"]`).remove();
                } else {
                  inputElement.append(`<span class="violation-pill" data-violation-id="${violationId}">${rule.title}</span>`);
                }
                _.render.modals.insertPlayers.showViolationDropdown(inputElement);
                _.render.modals.insertPlayers.updateJSONOutput();
              });
              violationsDropdown.append(option);
            });
            violationsDropdown.css({ top: inputY, left: inputX });
          },
          updateJSONOutput: () => {
            let outputArray = [];
            let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
            $.each(tableBody.find('tr'), (index, row) => {
              const rowElement = $(row);
              const accountName = rowElement.find('.player-input').html().trim();
              const accountId = rowElement.find('.player-id').html().trim();
              if (!accountName || !accountId) return;
              let violations = [];
              rowElement.find('.violation-pill').each(function () {
                const violationId = parseInt($(this).attr('data-violation-id'));
                violations.push(violationId);
              });
              outputArray.push({
                accountName: accountName,
                accountId: accountId,
                violations: violations
              });
            });
            _.data.insertPlayers = outputArray;
            console.log('JSON Output updated:', _.data.insertPlayers);
          },
          refreshTable: () => {
            let tableBody = $('#insert-players-modal #tableBodyInsertPlayers');
            let violationPillTemplate = `<span class="violation-pill" data-violation-id="{{id}}">{{title}}</span>`;
            let rowTemplate = `<tr>
              <td class="player-input" contenteditable="true">{{accountName}}</td>
              <td class="player-id">{{accountId}}</td>
              <td class="player-violations">{{violations}}</td>
            </tr>`;
            tableBody.empty();
            $.each(_.data.insertPlayers, (index, player) => {
              let violationsHtml = '';
              $.each(player.violations, (violationIndex, violationId) => {
                const definition = _.func.getViolationDefinition(violationId);
                if (definition) {
                  violationsHtml += violationPillTemplate
                    .replace('{{id}}', violationId)
                    .replace('{{title}}', definition.title);
                }
              });
              const rowHtml = rowTemplate
                .replace('{{accountName}}', player.accountName)
                .replace('{{accountId}}', player.accountId)
                .replace('{{violations}}', violationsHtml);
              tableBody.append(rowHtml);
            });
          }
        }
      }
    }
  }

  _.init();

});